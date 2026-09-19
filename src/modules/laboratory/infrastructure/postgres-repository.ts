import { createHash } from 'node:crypto';
import type { Kysely, Selectable, Transaction } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { actorHasScope } from '../../../shared/authorization/scope-evaluator.js';
import type { AuditRepository } from '../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import type { OutboxRepository } from '../../../shared/outbox/outbox-repository.js';
import { stableJson } from '../../../shared/json/stable-stringify.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import type { LabListFilter, LabRepository, Mutation } from '../ports/repository.js';
import type { LabState } from '../domain/lab-state.js';
import type { ControlledContext, LabTest } from '../domain/lab-test.js';
const hash = (value: unknown) => createHash('sha256').update(stableJson(value)).digest('hex');

type LabTestRow = Selectable<DatabaseSchema['lab_tests']>;
type SnapshotRow = Selectable<DatabaseSchema['lab_test_snapshots']>;
type SampleRow = Selectable<DatabaseSchema['lab_samples']>;
type MeasurementRow = Selectable<DatabaseSchema['lab_measurements']>;
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
  async list(input: { actor: ActorContext; filter?: LabListFilter; limit: number }) {
    const scope = this.rowScope(input.actor);
    if (scope === 'NONE') return { items: [], total: 0 };
    const [countRow, rows] = await Promise.all([
      this.filteredQuery(input.actor, scope, input.filter)
        .select((eb) => eb.fn.countAll().as('count'))
        .executeTakeFirst(),
      this.filteredQuery(input.actor, scope, input.filter)
        .selectAll()
        .orderBy('updated_at', 'desc')
        .orderBy('id', 'desc')
        .limit(Math.max(1, input.limit))
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
    const grant = actor.permissions.find((p) => p.code === 'PERM-LAB-VIEW') ?? actor.permissions[0];
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
    const [snapshots, samples, measurements, parameters] = await Promise.all([
      this.db
        .selectFrom('lab_test_snapshots')
        .selectAll()
        .where('lab_test_id', 'in', ids)
        .orderBy('snapshot_version', 'desc')
        .execute(),
      this.db.selectFrom('lab_samples').selectAll().where('lab_test_id', 'in', ids).execute(),
      this.db.selectFrom('lab_measurements').selectAll().where('lab_test_id', 'in', ids).execute(),
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
      this.map(row, latestSnapshot.get(row.id), samples, measurements, parameters),
    );
  }

  /** The one row mapper shared by the detail read and the register page. */
  private map(
    row: LabTestRow,
    snapshot: SnapshotRow | undefined,
    samples: readonly SampleRow[],
    measurements: readonly MeasurementRow[],
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
      samples: samples
        .filter((sample) => sample.lab_test_id === row.id)
        .map((sample) => ({ id: sample.id, identifier: sample.sample_identifier })),
      measurements: measurements
        .filter((measurement) => measurement.lab_test_id === row.id)
        .map((measurement) => ({
          id: measurement.id,
          sampleId: measurement.sample_id!,
          parameterId: measurement.template_parameter_id,
          raw:
            measurement.raw_numeric_value ??
            measurement.raw_text_value ??
            measurement.raw_boolean_value!,
          unit: measurement.unit,
          remarks: measurement.remarks ?? undefined,
          enteredBy: measurement.entered_by,
          enteredAt: measurement.entered_at.toISOString(),
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
    return this.db.transaction().execute(async (tx) => {
      if (!previous)
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
            created_by: next.createdBy,
            updated_by: next.authorId,
            updated_at: new Date(next.updatedAt),
            version: next.version,
          })
          .execute();
      else {
        const changed = await tx
          .updateTable('lab_tests')
          .set({
            state: next.state,
            scientific_result: next.scientificResult,
            submitted_at: next.submittedAt ? new Date(next.submittedAt) : null,
            review_started_at: next.reviewStartedAt ? new Date(next.reviewStartedAt) : null,
            approved_at: next.approvedAt ? new Date(next.approvedAt) : null,
            rejected_at: next.rejectedAt ? new Date(next.rejectedAt) : null,
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
        await tx.deleteFrom('lab_measurements').where('lab_test_id', '=', next.id).execute();
      }
      if (previous) {
        await tx.deleteFrom('lab_samples').where('lab_test_id', '=', next.id).execute();
      }
      if (next.samples.length)
        await tx
          .insertInto('lab_samples')
          .values(
            next.samples.map((s, index) => ({
              id: s.id,
              lab_test_id: next.id,
              sample_no: null,
              sample_identifier: s.identifier,
              position: index,
              sample_source: null,
              state: null,
              created_by: next.createdBy,
              version: 1n,
            })),
          )
          .execute();
      if (next.measurements.length)
        await tx
          .insertInto('lab_measurements')
          .values(
            next.measurements.map((m) => ({
              id: m.id,
              lab_test_id: next.id,
              sample_id: m.sampleId,
              template_parameter_id: m.parameterId,
              raw_numeric_value:
                typeof m.raw === 'string' && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(m.raw)
                  ? m.raw
                  : null,
              raw_text_value:
                typeof m.raw === 'string' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(m.raw)
                  ? m.raw
                  : null,
              raw_boolean_value: typeof m.raw === 'boolean' ? m.raw : null,
              unit: m.unit,
              calculated_value: null,
              calculated_unit: null,
              result: null,
              remarks: m.remarks ?? null,
              entered_by: m.enteredBy,
              entered_at: new Date(m.enteredAt),
              updated_at: new Date(m.enteredAt),
              version: 1n,
            })),
          )
          .execute();
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
