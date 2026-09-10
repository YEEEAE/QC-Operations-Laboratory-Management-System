import { server as authActions } from './auth.js';
import { account } from './account.js';
import { admin } from './admin.js';
import { reports } from './reports.js';
import { tasks } from './tasks.js';
import { findings } from './findings.js';
import { ncr } from './ncr.js';
import { rca } from './rca.js';
import { capa } from './capa.js';
import { quarantine } from './quarantine.js';
import { quarantineTemplates } from './quarantine-templates.js';
import { laboratory } from './laboratory.js';
import { assets } from './assets.js';
import { documents } from './documents.js';
import { approvals } from './approvals.js';
import { changeRequests } from './change-requests.js';
import { system } from './system.js';
import { aiAdvisory } from './ai-advisory.js';
import { releaseGovernance } from './release-governance.js';

// Astro actions contract (verified against installed astro@4.16.19):
// - `src/actions` must export a single `server` object
//   (vitePluginUserActions re-exports `{ server }` from this module).
// - Nested namespaces are supported at runtime AND in types:
//   client proxy `toActionProxy` recurses for nested paths
//   (templates/actions.mjs), and server `getAction` traverses
//   dot-separated paths (`/_actions/quarantine.reviewInspection`).
// This module is an aggregation point only: domain action
// definitions stay in their own files; no business rules live here.
export const server = {
  login: authActions.login,
  logout: authActions.logout,
  account,
  admin,
  reports,
  tasks,
  findings,
  ncr,
  rca,
  capa,
  quarantine,
  quarantineTemplates,
  laboratory,
  assets,
  documents,
  approvals,
  changeRequests,
  system,
  aiAdvisory,
  releaseGovernance,
};
