import { createHash } from 'node:crypto';
import { sql, type Kysely, type Selectable, type Transaction } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { actorHasScope } from '../../../shared/authorization/scope-evaluator.js';
import type { AuditRepository } from '../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import type { OutboxRepository } from '../../../shared/outbox/outbox-repository.js';
import { stableJson } from '../../../shared/json/stable-stringify.js';
import { insertSignatureEvidence } from '../../../shared/e-signatures/insert-signature-evidence.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import type { LabListFilter, LabRepository, Mutation } from '../ports/repository.js';
import type { LabState } from '../domain/lab-state.js';
import type { ControlledContext, EquipmentContext, LabTest } from '../domain/lab-test.js';
import type { SampleResult } from '../domain/sample-result.js';
const hash = (value: unknown) => createHash('sha256').update(stableJson(value)).digest('hex');

/**
 * One raw value is always stored in exactly one typed column (0009 + 0037).
 * A missing value on a reading is a database defect, not an empty reading.
 */
function storedRaw(row: {
  raw_numeric_value: string | null;
  raw_text_value: string | null;
  raw_boolean_value: boolean | null;
}): string | boolean {
  const value = row.raw_numeric_value ?? row.raw_text_value ?? row.raw_boolean_value;
  if (value === null || value === undefined) throw new AppError('SYSTEM_DATABASE_UNAVAILABLE');
  return value;
}

type LabTestRow = Selectable<DatabaseSchema['lab_tests']>;
type SnapshotRow = Selectable<DatabaseSchema['lab_test_snapshots']>;
type BatchRow = Selectable<DatabaseSchema['lab_test_batches']>;
type SampleRow = Selectable<DatabaseSchema['lab_samples']>;
type ReadingRow = Selectable<DatabaseSchema['lab_readings']>;
type MeasurementRow = Selectable<DatabaseSchema['lab_measurements']>;
type SampleResultRow = Selectable<DatabaseSchema['lab_sample_results']>;
type ParameterRow = Selectable<DatabaseSchema['lab_test_template_parameters']>;
export class PostgresLabRepository implements LabRepository {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly audit?: AuditRepository,
    private readonly outbox?: OutboxRepository,
  ) {}
  async get(id: string, actor: ActorContext) {
    const row = await this.db
      .selectFrom('lab_tests')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!row) return undefined;
    if (!this.canRead(actor, row)) return undefined;
    const [test] = await this.hydrate([row]);
    return test;
  }

  /**
   * The register, filtered server-side and loaded in a constant number of
   * queries.
   *
   * Every row this actor may not read is dropped by the same scope decision
   * `get()` applies, so a filtered register can never list a record its own
   * detail page refuses. The batched hydrate replaces the previous per-row
   * `get()` loop (four statements per laboratory test), which made the register
   * cost grow with the table it filtered.
   */
  async list(input: {
    actor: ActorContext;
    filter?: LabListFilter;
    limit: number;
    offset?: number;
  }) {
    const scope = this.rowScope(input.actor);
    if (scope === 'NONE') throw new AppError('AUTHZ_DENIED');
    let rowsQuery = this.filteredQuery(input.actor, scope, input.filter).selectAll();
    const direction = input.filter?.direction ?? 'desc';
    switch (input.filter?.sort ?? 'updated') {
      case 'testNo':
        rowsQuery = rowsQuery.orderBy('lab_test_no', direction);
        break;
      case 'state':
        rowsQuery = rowsQuery.orderBy('state', direction);
        break;
      default:
        rowsQuery = rowsQuery.orderBy('updated_at', direction);
    }
    const [countRow, rows] = await Promise.all([
      this.filteredQuery(input.actor, scope, input.filter)
        .select((eb) => eb.fn.countAll().as('count'))
        .executeTakeFirst(),
      rowsQuery
        .orderBy('id', direction)
        .limit(Math.max(1, input.limit))
        .offset(Math.max(0, input.offset ?? 0))
        .execute(),
    ]);
    // The page keeps the same per-row scope decision the detail read applies,
    // so the register can never list a record its own detail page refuses.
    const readable = rows.filter((row) => this.canRead(input.actor, row));
    const items = readable.length ? await this.hydrate(readable) : [];
    return { items, total: Number(countRow?.count ?? 0) };
  }

  /**
   * A bounded workload read: the register's own count plus its bounded
   * newest-first page.
   *
   * The scope predicate is the SQL form of the same decision `canRead` makes on
   * a loaded row — GLOBAL reaches every row, OWN reaches only rows this actor
   * authored, and any other scope kind cannot match a laboratory-test row at all
   * (the entity carries no team, department, site or domain). Applying it in SQL
   * is what keeps the count and the page from having to load the whole table to
   * stay consistent with the register.
   */
  async workload(input: { actor: ActorContext; filter?: LabListFilter; limit: number }) {
    const scope = this.rowScope(input.actor);
    if (scope === 'NONE') return { total: 0, rows: [] };
    const [countRow, rows] = await Promise.all([
      this.filteredQuery(input.actor, scope, input.filter)
        .select((eb) => eb.fn.countAll().as('count'))
        .executeTakeFirst(),
      this.filteredQuery(input.actor, scope, input.filter)
        .select(['id', 'lab_test_no', 'state', 'updated_at'])
        .orderBy('updated_at', 'desc')
        .orderBy('id', 'desc')
        .limit(Math.max(1, input.limit))
        .execute(),
    ]);
    return {
      total: Number(countRow?.count ?? 0),
      rows: rows.map((row) => ({
        id: row.id,
        labTestNo: String(row.lab_test_no),
        state: row.state as LabState,
        updatedAt: row.updated_at as Date,
      })),
    };
  }

  /**
   * The register-level scope decision for one laboratory-test row.
   *
   * It is exactly the decision `actorHasScope` reaches in `get()` for a
   * LAB_TEST whose owner and author are the same record: the entity's
   * `authorId`/`ownerId` are both the row author, so GLOBAL reaches every row,
   * OWN reaches only rows this actor authored, and TEAM/DEPARTMENT/SITE/DOMAIN
   * cannot match because the entity carries no such identifiers.
   */
  private rowScope(actor: ActorContext): 'ALL' | 'OWN' | 'NONE' {
    const grant = actor.permissions.find((p) => p.code === 'PERM-LAB-VIEW');
    if (!grant || grant.active === false) return 'NONE';
    if (grant.scopes.includes('GLOBAL')) return 'ALL';
    if (grant.scopes.includes('OWN')) return 'OWN';
    return 'NONE';
  }

  private canRead(actor: ActorContext, row: LabTestRow): boolean {
    return actorHasScope(
      actor,
      {
        type: 'LAB_TEST',
        id: row.id,
        state: row.state as LabTest['state'],
        authorId: row.author_id,
      },
      { ownerId: row.author_id },
      actor.permissions.find((p) => p.code === 'PERM-LAB-VIEW'),
    );
  }

  /**
   * The filtered register query, before ordering and projection.
   *
   * One helper means the count and the page can never apply different
   * predicates: every read of this register filters through here.
   */
  private filteredQuery(
    actor: ActorContext,
    scope: 'ALL' | 'OWN' | 'NONE',
    filter?: LabListFilter,
  ) {
    let query = this.db.selectFrom('lab_tests');
    if (filter?.state) query = query.where('state', '=', filter.state) as typeof query;
    if (filter?.search)
      query = query.where((eb) =>
        eb.or([
          eb('lab_test_no', 'ilike', `%${filter.search}%`),
          eb.exists(
            eb
              .selectFrom('lab_samples')
              .select('id')
              .whereRef('lab_samples.lab_test_id', '=', 'lab_tests.id')
              .where('sample_identifier', 'ilike', `%${filter.search}%`),
          ),
        ]),
      ) as typeof query;
    // Ownership is the same owner dimension the dashboard counts, so a personal
    // count can link to exactly its own set instead of the whole authorized
    // scope.
    if (filter?.ownership === 'mine')
      query = query.where('author_id', '=', actor.id) as typeof query;
    // The scope predicate is folded into the same query, so the counted
    // population and the visible page are one predicate, not two.
    if (scope === 'OWN') query = query.where('author_id', '=', actor.id) as typeof query;
    return query;
  }

  /**
   * Loads the whole register page in a constant number of reads.
   *
   * The previous implementation called `get()` once per row, so listing N tests
   * issued 1 + 4N statements. This loads the rows' snapshots, samples,
   * measurements and template parameters in four batched reads instead.
   */
  private async hydrate(rows: readonly LabTestRow[]): Promise<LabTest[]> {
    const ids = rows.map((row) => row.id);
    const versionIds = [...new Set(rows.map((row) => row.template_version_id))];
    const [snapshots, batches, samples, readings, measurements, sampleResults, parameters] =
      await Promise.all([
        this.db
          .selectFrom('lab_test_snapshots')
          .selectAll()
          .where('lab_test_id', 'in', ids)
          .orderBy('snapshot_version', 'desc')
          .execute(),
        this.db
          .selectFrom('lab_test_batches')
          .selectAll()
          .where('lab_test_id', 'in', ids)
          .orderBy('sequence')
          .execute(),
        this.db.selectFrom('lab_samples').selectAll().where('lab_test_id', 'in', ids).execute(),
        this.db.selectFrom('lab_readings').selectAll().where('lab_test_id', 'in', ids).execute(),
        this.db
          .selectFrom('lab_measurements')
          .selectAll()
          .where('lab_test_id', 'in', ids)
          .execute(),
        this.db
          .selectFrom('lab_sample_results')
          .selectAll()
          .where('lab_test_id', 'in', ids)
          .execute(),
        this.db
          .selectFrom('lab_test_template_parameters')
          .selectAll()
          .where('template_version_id', 'in', versionIds)
          .execute(),
      ]);
    const latestSnapshot = new Map<string, SnapshotRow>();
    for (const snapshot of snapshots)
      if (!latestSnapshot.has(snapshot.lab_test_id))
        latestSnapshot.set(snapshot.lab_test_id, snapshot);
    return rows.map((row) =>
      this.map(
        row,
        latestSnapshot.get(row.id),
        batches,
        samples,
        readings,
        measurements,
        sampleResults,
        parameters,
      ),
    );
  }

  /** The one row mapper shared by the detail read and the register page. */
  private map(
    row: LabTestRow,
    snapshot: SnapshotRow | undefined,
    batches: readonly BatchRow[],
    samples: readonly SampleRow[],
    readings: readonly ReadingRow[],
    measurements: readonly MeasurementRow[],
    sampleResults: readonly SampleResultRow[],
    parameters: readonly ParameterRow[],
  ): LabTest {
    const ctx = snapshot?.template_snapshot as
      { test: LabTest; context: ControlledContext } | undefined;
    if (!ctx?.test || !ctx?.context) throw new AppError('SYSTEM_DATABASE_UNAVAILABLE');
    return {
      ...(ctx.test as unknown as Omit<
        LabTest,
        'samples' | 'measurements' | 'version' | 'state' | 'scientificResult'
      >),
      id: row.id,
      state: row.state as LabTest['state'],
      scientificResult: row.scientific_result as LabTest['scientificResult'],
      version: BigInt(row.version),
      derivedResult: row.derived_result
        ? {
            result: row.derived_result as SampleResult,
            source: row.derived_result_source ?? 'SYSTEM_EVALUATION',
            inputsHash: row.derived_result_inputs_hash ?? '',
            computedAt: (row.derived_result_computed_at ?? row.updated_at).toISOString(),
          }
        : null,
      batches: batches
        .filter((batch) => batch.lab_test_id === row.id)
        .map((batch) => ({
          id: batch.id,
          batchNo: batch.batch_no,
          label: batch.label,
          sequence: batch.sequence,
          startedAt: (batch.started_at ?? batch.created_at).toISOString(),
          completedAt: batch.completed_at ? batch.completed_at.toISOString() : null,
        })),
      samples: samples
        .filter((sample) => sample.lab_test_id === row.id)
        .map((sample) => ({
          id: sample.id,
          identifier: sample.sample_identifier,
          batchId: sample.batch_id,
        })),
      readings: readings
        .filter((reading) => reading.lab_test_id === row.id)
        .map((reading) => ({
          id: reading.id,
          batchId: reading.batch_id,
          sampleId: reading.sample_id,
          parameterId: reading.template_parameter_id,
          readingIndex: reading.reading_index,
          raw: storedRaw(reading),
          unit: reading.unit,
          remarks: reading.remarks ?? undefined,
          enteredBy: reading.entered_by,
          enteredAt: reading.entered_at.toISOString(),
        })),
      measurements: measurements
        .filter((measurement) => measurement.lab_test_id === row.id)
        .map((measurement) => ({
          id: measurement.id,
          sampleId: measurement.sample_id!,
          parameterId: measurement.template_parameter_id,
          batchId: measurement.batch_id,
          raw:
            measurement.raw_numeric_value ??
            measurement.raw_text_value ??
            measurement.raw_boolean_value ??
            null,
          unit: measurement.unit,
          calculatedValue: measurement.calculated_value,
          calculatedUnit: measurement.calculated_unit,
          calculationRuleReference: measurement.calculation_rule_reference,
          calculationRuleVersion: measurement.calculation_rule_version,
          calculationInputs: (measurement.calculation_inputs ?? null) as Readonly<
            Record<string, unknown>
          > | null,
          remarks: measurement.remarks ?? undefined,
          enteredBy: measurement.entered_by,
          enteredAt: measurement.entered_at.toISOString(),
        })),
      sampleResults: sampleResults
        .filter((result) => result.lab_test_id === row.id)
        .map((result) => ({
          id: result.id,
          batchId: result.batch_id,
          sampleId: result.sample_id,
          result: result.result as SampleResult,
          source: result.source as 'SYSTEM_EVALUATION' | 'HUMAN',
          sourceReference: result.source_reference,
          contentHash: result.content_hash,
          derivedFrom: (result.derived_from ?? null) as Readonly<Record<string, unknown>> | null,
          evaluatedAt: result.evaluated_at.toISOString(),
          evaluatedBy: result.evaluated_by,
        })),
      context: {
        ...ctx.context,
        parameters: parameters
          .filter((parameter) => parameter.template_version_id === row.template_version_id)
          .map((parameter) => ({
            id: parameter.id,
            code: parameter.parameter_code,
            label: parameter.label,
            dataType: parameter.data_type as 'NUMERIC' | 'TEXT' | 'BOOLEAN',
            unit: parameter.unit,
            required: parameter.required,
            sourceReference: parameter.controlled_source_reference ?? '',
            criteria: (parameter.acceptance_rule_payload ?? {}) as Readonly<
              Record<string, unknown>
            >,
            acceptanceRuleType: parameter.acceptance_rule_type,
            // QC-DATA-003 approved calculation rule (migration 0037).
            calculationRule: parameter.calculation_rule_type
              ? {
                  ruleType: parameter.calculation_rule_type,
                  rulePayload: parameter.calculation_rule_payload,
                }
              : null,
          })),
      },
    };
  }
  async create(test: LabTest, mutation: Mutation) {
    return this.persist(undefined, test, mutation);
  }
  async save(previous: LabTest, next: LabTest, mutation: Mutation) {
    return this.persist(previous, next, mutation);
  }
  /**
   * QC-DATA-003 run-level equipment evidence.
   *
   * The usage row stores the equipment/calibration snapshots taken at usage
   * time (DATA-MODEL §76/§77) so a later calibration change cannot rewrite what
   * the run actually used. `batch_id` is NULL for a legacy test-level row.
   */
  async linkRunEquipment(i: {
    id: string;
    labTestId: string;
    batchId: string;
    usage: EquipmentContext;
    actor: ActorContext;
    requestId: string;
    recordedAt: Date;
  }): Promise<void> {
    await this.db.transaction().execute(async (tx) => {
      await tx
        .insertInto('lab_equipment_usage')
        .values({
          id: i.id,
          lab_test_id: i.labTestId,
          batch_id: i.batchId,
          equipment_id: i.usage.equipmentId,
          calibration_record_id: i.usage.calibrationRecordId,
          usage_role: i.usage.usageRole ?? null,
          used_at: new Date(i.usage.usedAt),
          equipment_snapshot: stableJson(i.usage.equipmentSnapshot),
          calibration_snapshot: stableJson(i.usage.calibrationSnapshot),
          created_at: i.recordedAt,
        })
        .execute();
      await this.auditFor(tx)?.append({
        actorType: 'USER',
        actorId: i.actor.id,
        subjectType: 'LAB_TEST',
        subjectId: i.labTestId,
        action: 'EQUIPMENT_LINKED',
        requestId: i.requestId,
        payload: {
          batchId: i.batchId,
          equipmentId: i.usage.equipmentId,
          calibrationRecordId: i.usage.calibrationRecordId,
        },
      });
    });
  }

  async listRunEquipment(
    labTestId: string,
  ): Promise<readonly (EquipmentContext & { batchId: string | null })[]> {
    const rows = await this.db
      .selectFrom('lab_equipment_usage')
      .selectAll()
      .where('lab_test_id', '=', labTestId)
      .orderBy('created_at')
      .execute();
    return rows.map((row) => ({
      batchId: row.batch_id,
      equipmentId: row.equipment_id,
      calibrationRecordId: row.calibration_record_id ?? '',
      usedAt: (row.used_at ?? row.created_at).toISOString(),
      equipmentSnapshot: (row.equipment_snapshot ?? {}) as Readonly<Record<string, unknown>>,
      calibrationSnapshot: (row.calibration_snapshot ?? {}) as Readonly<Record<string, unknown>>,
      usageRole: row.usage_role ?? undefined,
    }));
  }

  async history(id: string, actor: ActorContext) {
    await this.get(id, actor);
    const rows = await this.db
      .selectFrom('lab_test_snapshots')
      .selectAll()
      .where('lab_test_id', '=', id)
      .orderBy('snapshot_version')
      .execute();
    return rows.map((r) => ({
      stage: r.snapshot_stage,
      hash: r.snapshot_hash,
      record: r.template_snapshot as LabTest,
    }));
  }
  private async persist(previous: LabTest | undefined, next: LabTest, mutation: Mutation) {
    if (mutation.action === 'FINAL_APPROVE') {
      const evidence = mutation.signatureEvidence;
      if (
        !evidence ||
        evidence.subjectType !== 'LAB_TEST' ||
        evidence.subjectId !== next.id ||
        evidence.subjectVersion !== previous?.version ||
        evidence.actorId !== mutation.actor.id ||
        evidence.action !== 'FINAL_APPROVE' ||
        evidence.meaning !== 'FINAL_APPROVE' ||
        evidence.requestId !== mutation.requestId
      )
        throw new AppError('VALIDATION_FAILED', { userSafe: true });
    } else if (mutation.signatureEvidence) {
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    }
    return this.db.transaction().execute(async (tx) => {
      if (!previous) {
        await tx
          .insertInto('lab_tests')
          .values({
            id: next.id,
            lab_test_no: next.labTestNo,
            template_version_id: next.context.templateVersionId,
            state: next.state,
            scientific_result: null,
            source_receiving_item_id: null,
            original_test_id: next.originalTestId,
            retest_sequence: next.retestSequence,
            retest_reason: next.retestReason,
            author_id: next.authorId,
            submitted_at: null,
            review_started_at: null,
            approved_at: null,
            rejected_at: null,
            voided_at: null,
            void_reason: null,
            snapshot_id: null,
            derived_result: next.derivedResult?.result ?? null,
            derived_result_source: next.derivedResult?.source ?? null,
            derived_result_inputs_hash: next.derivedResult?.inputsHash ?? null,
            derived_result_computed_at: next.derivedResult
              ? new Date(next.derivedResult.computedAt)
              : null,
            created_by: next.createdBy,
            updated_by: next.authorId,
            updated_at: new Date(next.updatedAt),
            version: next.version,
          })
          .execute();
        if (next.context.documents.length)
          await tx
            .insertInto('lab_document_usage')
            .values(
              next.context.documents.map((document) => ({
                lab_test_id: next.id,
                document_version_id: document.documentVersionId,
                usage_type: document.usageType,
                document_snapshot: stableJson({
                  documentVersionId: document.documentVersionId,
                  usageType: document.usageType,
                  ...document.snapshot,
                }),
              })),
            )
            .execute();
      } else {
        const changed = await tx
          .updateTable('lab_tests')
          .set({
            state: next.state,
            scientific_result: next.scientificResult,
            submitted_at: next.submittedAt ? new Date(next.submittedAt) : null,
            review_started_at: next.reviewStartedAt ? new Date(next.reviewStartedAt) : null,
            approved_at: next.approvedAt ? new Date(next.approvedAt) : null,
            rejected_at: next.rejectedAt ? new Date(next.rejectedAt) : null,
            derived_result: next.derivedResult?.result ?? null,
            derived_result_source: next.derivedResult?.source ?? null,
            derived_result_inputs_hash: next.derivedResult?.inputsHash ?? null,
            derived_result_computed_at: next.derivedResult
              ? new Date(next.derivedResult.computedAt)
              : null,
            updated_by: mutation.actor.id,
            updated_at: new Date(next.updatedAt),
            version: next.version,
          })
          .where('id', '=', next.id)
          .where('version', '=', previous.version)
          .where('state', '=', previous.state)
          .executeTakeFirst();
        if (!changed.numUpdatedRows)
          throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        if (mutation.action === 'FINAL_APPROVE')
          await insertSignatureEvidence(tx, mutation.signatureEvidence!);
      }
      await this.reconcileRunContent(tx, next, mutation);
      const snapshot = { test: next, context: next.context };
      const snap = await tx
        .insertInto('lab_test_snapshots')
        .values({
          id: uuidv7(),
          lab_test_id: next.id,
          snapshot_version: Number(next.version),
          snapshot_stage: mutation.action,
          template_snapshot: stableJson(snapshot),
          source_snapshot: stableJson(next.context.source),
          equipment_snapshot: stableJson(next.context.equipment),
          calibration_snapshot: stableJson(
            next.context.equipment.map((e) => e.calibrationSnapshot),
          ),
          document_snapshot: stableJson(next.context.documents),
          criteria_snapshot: stableJson(next.context.parameters.map((p) => p.criteria)),
          sample_context_snapshot: stableJson(next.samples),
          created_at: new Date(),
          snapshot_hash: hash(snapshot),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await tx
        .updateTable('lab_tests')
        .set({ snapshot_id: snap.id })
        .where('id', '=', next.id)
        .execute();
      await this.auditFor(tx)?.append({
        actorType: 'USER',
        actorId: mutation.actor.id,
        subjectType: 'LAB_TEST',
        subjectId: next.id,
        action: mutation.action,
        oldState: previous?.state,
        newState: next.state,
        reason: mutation.reason,
        requestId: mutation.requestId,
      });
      await this.outboxFor(tx)?.enqueue({
        eventType: 'LAB_TEST_CHANGED',
        aggregateType: 'LAB_TEST',
        aggregateId: next.id,
        payload: { action: mutation.action, state: next.state },
        dedupeKey: `lab:${next.id}:v${next.version}`,
      });
      return next;
    });
  }
  /**
   * QC-DATA-003 run content reconcile.
   *
   * The aggregate is authoritative, but rows are never rewritten blindly:
   * children are pruned before their parents (readings → sample results →
   * measurements → samples → batches) and every surviving row is upserted by its
   * own id. The previous delete-and-reinsert behaviour destroyed exactly the run
   * evidence this change depends on, because `lab_readings` and
   * `lab_sample_results` reference the sample rows it deleted.
   */
  private async reconcileRunContent(
    tx: Transaction<DatabaseSchema>,
    next: LabTest,
    mutation: Mutation,
  ) {
    const batches = next.batches ?? [];
    const readings = next.readings ?? [];
    const sampleResults = next.sampleResults ?? [];
    const { samples, measurements } = next;
    const sampleIds = samples.map((sample) => sample.id);

    // A sample removed from the aggregate must not leave an orphaned child
    // behind: the run's readings, measurements and derived results reference
    // the sample row directly, so they are pruned before it.
    let orphanReadings = tx.deleteFrom('lab_readings').where('lab_test_id', '=', next.id);
    if (sampleIds.length) orphanReadings = orphanReadings.where('sample_id', 'not in', sampleIds);
    await orphanReadings.execute();

    let orphanResults = tx.deleteFrom('lab_sample_results').where('lab_test_id', '=', next.id);
    if (sampleIds.length) orphanResults = orphanResults.where('sample_id', 'not in', sampleIds);
    await orphanResults.execute();

    let orphanMeasurements = tx
      .deleteFrom('lab_measurements')
      .where('lab_test_id', '=', next.id)
      .where('sample_id', 'is not', null);
    if (sampleIds.length)
      orphanMeasurements = orphanMeasurements.where('sample_id', 'not in', sampleIds);
    await orphanMeasurements.execute();

    let readingDelete = tx.deleteFrom('lab_readings').where('lab_test_id', '=', next.id);
    if (readings.length)
      readingDelete = readingDelete.where(
        'id',
        'not in',
        readings.map((reading) => reading.id),
      );
    await readingDelete.execute();

    let resultDelete = tx.deleteFrom('lab_sample_results').where('lab_test_id', '=', next.id);
    if (sampleResults.length)
      resultDelete = resultDelete.where(
        'id',
        'not in',
        sampleResults.map((result) => result.id),
      );
    await resultDelete.execute();

    let measurementDelete = tx.deleteFrom('lab_measurements').where('lab_test_id', '=', next.id);
    if (measurements.length)
      measurementDelete = measurementDelete.where(
        'id',
        'not in',
        measurements.map((measurement) => measurement.id),
      );
    await measurementDelete.execute();

    let sampleDelete = tx.deleteFrom('lab_samples').where('lab_test_id', '=', next.id);
    if (samples.length)
      sampleDelete = sampleDelete.where(
        'id',
        'not in',
        samples.map((sample) => sample.id),
      );
    await sampleDelete.execute();

    let batchDelete = tx.deleteFrom('lab_test_batches').where('lab_test_id', '=', next.id);
    if (batches.length)
      batchDelete = batchDelete.where(
        'id',
        'not in',
        batches.map((batch) => batch.id),
      );
    await batchDelete.execute();

    if (batches.length)
      await tx
        .insertInto('lab_test_batches')
        .values(
          batches.map((batch) => ({
            id: batch.id,
            lab_test_id: next.id,
            batch_no: batch.batchNo,
            label: batch.label ?? null,
            sequence: batch.sequence,
            started_at: new Date(batch.startedAt),
            completed_at: batch.completedAt ? new Date(batch.completedAt) : null,
            created_by: next.createdBy,
            updated_by: mutation.actor.id,
            updated_at: new Date(),
            version: 1n,
          })),
        )
        .onConflict((oc) =>
          oc.column('id').doUpdateSet({
            batch_no: sql`excluded.batch_no`,
            label: sql`excluded.label`,
            sequence: sql`excluded.sequence`,
            started_at: sql`excluded.started_at`,
            completed_at: sql`excluded.completed_at`,
            updated_by: sql`excluded.updated_by`,
            updated_at: sql`excluded.updated_at`,
          }),
        )
        .execute();

    if (samples.length)
      await tx
        .insertInto('lab_samples')
        .values(
          samples.map((sample, index) => ({
            id: sample.id,
            lab_test_id: next.id,
            batch_id: sample.batchId ?? null,
            sample_no: null,
            sample_identifier: sample.identifier,
            position: index,
            sample_source: null,
            state: null,
            created_by: next.createdBy,
            version: 1n,
          })),
        )
        .onConflict((oc) =>
          oc.column('id').doUpdateSet({
            batch_id: sql`excluded.batch_id`,
            sample_identifier: sql`excluded.sample_identifier`,
            position: sql`excluded.position`,
          }),
        )
        .execute();

    if (measurements.length)
      await tx
        .insertInto('lab_measurements')
        .values(
          measurements.map((measurement) => ({
            id: measurement.id,
            lab_test_id: next.id,
            batch_id: measurement.batchId ?? null,
            sample_id: measurement.sampleId,
            template_parameter_id: measurement.parameterId,
            raw_numeric_value:
              typeof measurement.raw === 'string' &&
              /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(measurement.raw)
                ? measurement.raw
                : null,
            raw_text_value:
              typeof measurement.raw === 'string' &&
              !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(measurement.raw)
                ? measurement.raw
                : null,
            raw_boolean_value: typeof measurement.raw === 'boolean' ? measurement.raw : null,
            unit: measurement.unit,
            calculated_value: measurement.calculatedValue ?? null,
            calculated_unit: measurement.calculatedUnit ?? null,
            calculation_rule_reference: measurement.calculationRuleReference ?? null,
            calculation_rule_version: measurement.calculationRuleVersion ?? null,
            calculation_inputs: measurement.calculationInputs
              ? stableJson(measurement.calculationInputs)
              : null,
            result: null,
            remarks: measurement.remarks ?? null,
            entered_by: measurement.enteredBy,
            entered_at: new Date(measurement.enteredAt),
            updated_at: new Date(measurement.enteredAt),
            version: 1n,
          })),
        )
        .onConflict((oc) =>
          oc.column('id').doUpdateSet({
            batch_id: sql`excluded.batch_id`,
            raw_numeric_value: sql`excluded.raw_numeric_value`,
            raw_text_value: sql`excluded.raw_text_value`,
            raw_boolean_value: sql`excluded.raw_boolean_value`,
            unit: sql`excluded.unit`,
            calculated_value: sql`excluded.calculated_value`,
            calculated_unit: sql`excluded.calculated_unit`,
            calculation_rule_reference: sql`excluded.calculation_rule_reference`,
            calculation_rule_version: sql`excluded.calculation_rule_version`,
            calculation_inputs: sql`excluded.calculation_inputs`,
            remarks: sql`excluded.remarks`,
            updated_at: sql`excluded.updated_at`,
          }),
        )
        .execute();

    if (readings.length)
      await tx
        .insertInto('lab_readings')
        .values(
          readings.map((reading) => ({
            id: reading.id,
            lab_test_id: next.id,
            batch_id: reading.batchId,
            sample_id: reading.sampleId,
            template_parameter_id: reading.parameterId,
            reading_index: reading.readingIndex,
            raw_numeric_value:
              typeof reading.raw === 'string' && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(reading.raw)
                ? reading.raw
                : null,
            raw_text_value:
              typeof reading.raw === 'string' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(reading.raw)
                ? reading.raw
                : null,
            raw_boolean_value: typeof reading.raw === 'boolean' ? reading.raw : null,
            unit: reading.unit,
            remarks: reading.remarks ?? null,
            entered_by: reading.enteredBy,
            entered_at: new Date(reading.enteredAt),
            updated_at: new Date(reading.enteredAt),
            version: 1n,
          })),
        )
        .onConflict((oc) => oc.column('id').doNothing())
        .execute();

    if (sampleResults.length)
      await tx
        .insertInto('lab_sample_results')
        .values(
          sampleResults.map((result) => ({
            id: result.id,
            lab_test_id: next.id,
            batch_id: result.batchId,
            sample_id: result.sampleId,
            result: result.result,
            source: result.source,
            source_reference: result.sourceReference,
            content_hash: result.contentHash,
            derived_from: result.derivedFrom ? stableJson(result.derivedFrom) : null,
            evaluated_at: new Date(result.evaluatedAt),
            evaluated_by: result.evaluatedBy,
            version: 1n,
          })),
        )
        .onConflict((oc) =>
          oc.column('id').doUpdateSet({
            result: sql`excluded.result`,
            source: sql`excluded.source`,
            source_reference: sql`excluded.source_reference`,
            content_hash: sql`excluded.content_hash`,
            derived_from: sql`excluded.derived_from`,
            evaluated_at: sql`excluded.evaluated_at`,
            evaluated_by: sql`excluded.evaluated_by`,
          }),
        )
        .execute();
  }

  private auditFor(tx: Transaction<DatabaseSchema>) {
    return this.audit instanceof PostgresAuditRepository
      ? new PostgresAuditRepository(tx)
      : this.audit;
  }
  private outboxFor(tx: Transaction<DatabaseSchema>) {
    return this.outbox instanceof PostgresOutboxRepository
      ? new PostgresOutboxRepository(tx)
      : this.outbox;
  }
}
