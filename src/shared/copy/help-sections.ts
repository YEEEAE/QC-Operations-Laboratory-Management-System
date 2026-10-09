/** Exact displayed prose, shared by rendering and the server/client search index. */
export const HELP_SECTIONS = {
  'start-of-day': {
    title: 'Start of day by role',
    introduction:
      'Your role decides what you usually start with — not what you are allowed to do. Every action is still authorized server-side by permission, scope, state, version, separation of duties and signature.',
    escalationLabel: 'Escalate to',
  },
  'quick-links': { title: 'Everyday routes' },
  'guidance-matrix': {
    title: 'Screen and state guidance',
    introduction:
      'What each major workspace means in each state, and where the real next action lives. Guidance is derived from the approved state machines and read models; it never grants authority — every mutation is re-authorized server-side. Informational steps (open a workspace, read a register) are links; authorized mutations (approve, release, sign) commit only when the server accepts them.',
    columns: ['State you see', 'What it means', 'Next action'],
    ending:
      'Awaiting an approval stage means the record is readable but the decision belongs to another role. If your row shows a stage but your account lacks the permission, the action buttons are not rendered and the server refuses the mutation — this is fail-closed by design.',
  },
  troubleshooting: {
    title: 'Troubleshooting',
    caption: 'What a state or refusal means and what to do next',
    columns: ['You see', 'What it means and what to do'],
    notes: [
      {
        situation: 'Work returned for correction',
        meaning:
          'Fix the draft and resubmit; the same review path resumes from the returned state.',
      },
      {
        situation: 'A required source is missing (for example no official inspection result)',
        meaning:
          'Fail-closed. Do not invent a limit, criterion or result. Record the blocker and escalate.',
      },
    ],
  },
  escalation: {
    title: 'Escalation and handoff',
    introduction:
      'Escalation is by function, not by a named person. Organizational names are recorded (or left unresolved) in the support ownership register, never invented here.',
    entries: [
      {
        label: 'Employee to Supervisor:',
        text: 'blocked work, missing instruction, equipment ineligible, template invalid.',
      },
      {
        label: 'Supervisor to QCM:',
        text: 'critical FAIL, recurring failure, unresolved HOLD, major NCR, CAPA escalation.',
      },
      {
        label: 'QCM to named system owner:',
        text: 'compliance concern, cross-domain risk, release risk, production decision.',
      },
      {
        label: 'Admin to named system owner:',
        text: 'security, authentication, database, migration, backup or outage incident.',
      },
    ],
    ending:
      'Who acts next after a submit: the review is owned by the Supervisor (stage 1), and final approval by the QCM or the named owner. Admin is never the approver.',
  },
  interruption: {
    title: 'Service interruption',
    entries: [
      'Do not re-enter controlled data into a second channel; there is no valid offline path.',
      'Do not treat a failed read as an empty table — “Not available” is not zero.',
      'Do not attempt a release, approval or signature while a dependency outage is shown.',
      'Report the incident to the technical owner (Admin); production decisions go to the named owner.',
    ],
  },
} as const;

export type HelpSectionId = keyof typeof HELP_SECTIONS;

function displayedStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(displayedStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(displayedStrings);
  return [];
}

export function helpSectionSearchText(id: HelpSectionId, displayedContent: unknown = []): string {
  return [...displayedStrings(HELP_SECTIONS[id]), ...displayedStrings(displayedContent)].join(' ');
}
