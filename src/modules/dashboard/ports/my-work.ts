import type { ActorContext } from '../../../shared/authorization/types.js';

/**
 * QC-100-FINAL-022 — "My work today" queue contract.
 *
 * The workspace answers one question honestly: what is mine to do now, and
 * which of those answers the server cannot give me. It is not a second
 * dashboard: it consumes the same domain-owned read models the dashboard
 * already composes (see `dashboard-sources.ts`) and adds nothing but a
 * grouping, a next action and the role that owns that action.
 */

/**
 * The four approved kinds of outstanding work.
 *
 * Only these four exist because only these four can be reproduced by a register
 * filter the reader may open. `UNRESOLVED_SOURCES` records what is deliberately
 * not a fifth group instead of approximating it.
 */
export type MyWorkCategory = 'ASSIGNED' | 'DUE_TODAY' | 'OVERDUE' | 'BLOCKED';

export const MY_WORK_CATEGORIES: readonly MyWorkCategory[] = [
  'ASSIGNED',
  'DUE_TODAY',
  'OVERDUE',
  'BLOCKED',
];

/**
 * The approved meaning of one queue group.
 *
 * Every field is a fact about how the group is read, not a target: there is no
 * threshold, no urgency score and no aging policy here, because none is
 * approved. `timezone` and `sourceTimestamp` exist so a reader can reproduce
 * the same set by hand.
 */
export interface MyWorkGroupDefinition {
  category: MyWorkCategory;
  label: string;
  /** What membership means, in one sentence. */
  membership: string;
  /** Whose work the group covers. */
  ownership: string;
  /** The actor scope the read is taken in. */
  actorScope: string;
  /** The server clock every window in this group is resolved in. */
  timezone: 'UTC';
  /** The register's own timestamp the position and age are derived from. */
  sourceTimestamp: string;
  /** The exact register predicate that decides membership. */
  predicate: string;
}

/**
 * A data product this workspace deliberately does not read.
 *
 * Recording the reason and the owner is what keeps the queue truthful: an
 * unresolved source is shown as unresolved, never as an empty group or a zero.
 */
export interface MyWorkUnresolvedSource {
  key: string;
  label: string;
  /** Why no read model exists yet, naming the real missing piece. */
  reason: string;
  /** Who resolves it. */
  owner: string;
}

/**
 * Why a group carries no number for this account.
 *
 * `NOT_AUTHORIZED` means at least one source in the group may not be read by
 * this account, so the group total would understate the truth. `NOT_SUPPLIED`
 * means the group has no register-backed source at all. Neither is `EMPTY`.
 */
export type MyWorkGroupState = 'AVAILABLE' | 'NOT_AUTHORIZED' | 'NOT_SUPPLIED';

/** One register read the reader may open, with the number it reports. */
export interface MyWorkRegisterLink {
  sourceKey: string;
  label: string;
  href: string;
  /** The register's own match count for this link's filter. */
  count: number;
}

/** One outstanding record the reader can act on. */
export interface MyWorkItem {
  /** Stable identity of the queue entry (`sourceKey:recordId`). */
  key: string;
  title: string;
  state: string;
  /** Why this record is waiting for the reader. */
  reason: string;
  /** What the reader does next. Guidance only: the mutation stays server-checked. */
  nextAction: string;
  /** The role that owns the next step, from the register that records it. */
  responsibleRole: string;
  /** Whose work this row is; never a personal count under a scope label. */
  actorScope: string;
  sourceKey: string;
  sourceLabel: string;
  /** The record workspace the reader opens. */
  href: string;
  /** The register filter that reproduces this item's group. */
  registerHref: string;
  anchorAt?: Date;
  anchor: 'waiting' | 'due';
  /** Age derived from the real server timestamp; never invented. */
  ageLabel: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  /** True when another source matched the same record and this row won the merge. */
  merged: boolean;
}

export interface MyWorkGroup {
  definition: MyWorkGroupDefinition;
  state: MyWorkGroupState;
  /** Honest sentence for every state; never a count when the state is not `AVAILABLE`. */
  message: string;
  /**
   * The sum of the group's register totals, or `null` when any source in the
   * group could not be read. `null` is not zero.
   */
  count: number | null;
  registerLinks: readonly MyWorkRegisterLink[];
  /** The bounded, deduplicated page of this group. May be shorter than `count`. */
  items: readonly MyWorkItem[];
}

export interface MyWorkReadModel {
  generatedAt: Date;
  scopeLabel: string;
  timezone: 'UTC';
  groups: readonly MyWorkGroup[];
  unresolvedSources: readonly MyWorkUnresolvedSource[];
}

export interface MyWorkQuery {
  get(actor: ActorContext): Promise<MyWorkReadModel>;
}
