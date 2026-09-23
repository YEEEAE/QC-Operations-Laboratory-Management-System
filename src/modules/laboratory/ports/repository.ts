import type { ActorContext } from '../../../shared/authorization/types.js';
import type { EquipmentContext, LabTest } from '../domain/lab-test.js';
import type { LabState } from '../domain/lab-state.js';
import type { SignatureEvidence } from '../../e-signatures/domain/signature-evidence.js';
export interface Mutation {
  actor: ActorContext;
  requestId: string;
  action: string;
  reason?: string;
  /** Final-approval evidence is committed atomically with the state transition. */
  signatureEvidence?: SignatureEvidence;
}

/**
 * The two filters the laboratory register exposes server-side.
 *
 * `state` is the workflow state the register already stores (one predicate per
 * stage, never a merged bucket) and `ownership` is the same owner dimension the
 * dashboard counts, so a personal count can link to exactly its own set.
 */
export interface LabListFilter {
  state?: LabState;
  ownership?: 'mine';
  search?: string;
  sort?: 'updated' | 'testNo' | 'state';
  direction?: 'asc' | 'desc';
}

/** One row of a bounded laboratory workload read. */
export interface LabWorkloadRow {
  id: string;
  labTestNo: string;
  state: LabState;
  /** The record's own server timestamp; the age derives from this, never a client clock. */
  updatedAt: Date;
}

/**
 * A bounded, state-filtered laboratory workload read.
 *
 * `total` is the register's own count for the same filter the page lists, and
 * `rows` is its bounded newest-first page, so the displayed number is the full
 * filtered population and the queue stays bounded — a count that grew with the
 * caller's page size, or a page that had to load every row to be counted, is a
 * defect, not a presentation choice.
 */
export interface LabWorkloadRead {
  total: number;
  rows: readonly LabWorkloadRow[];
}

export interface LabRepository {
  get(id: string, actor: ActorContext): Promise<LabTest | undefined>;
  /**
   * A bounded register page plus the readable total for the same filter.
   *
   * `limit` is required: the register is a page, never the whole table, and
   * `total` is the count of the same predicate so the page can state how much
   * of the population it is showing without a second, separately-filtered read.
   */
  list(input: {
    actor: ActorContext;
    filter?: LabListFilter;
    limit: number;
    offset?: number;
  }): Promise<{ items: LabTest[]; total: number }>;
  /**
   * Counts the readable population for `filter` and returns its bounded first
   * page in the same read, so no caller can disagree with itself about the
   * population it is counting.
   */
  workload(input: {
    actor: ActorContext;
    filter?: LabListFilter;
    limit: number;
  }): Promise<LabWorkloadRead>;
  create(test: LabTest, mutation: Mutation): Promise<LabTest>;
  save(previous: LabTest, next: LabTest, mutation: Mutation): Promise<LabTest>;
  /**
   * QC-DATA-003: persist one run's equipment usage with the snapshots taken at
   * usage time. Eligibility is verified by the caller through the approved
   * Assets capability; this only records the verified fact.
   */
  linkRunEquipment(input: {
    id: string;
    labTestId: string;
    batchId: string;
    usage: EquipmentContext;
    actor: ActorContext;
    requestId: string;
    recordedAt: Date;
  }): Promise<void>;
  /** Every equipment usage row of a test, run-level and legacy test-level. */
  listRunEquipment(
    labTestId: string,
  ): Promise<readonly (EquipmentContext & { batchId: string | null })[]>;
  history(
    id: string,
    actor: ActorContext,
  ): Promise<readonly { stage: string; hash: string; record: LabTest }[]>;
}
