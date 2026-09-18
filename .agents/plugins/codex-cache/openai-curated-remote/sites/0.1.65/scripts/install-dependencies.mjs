import {
  readProjectManifest,
  resolveYarnMajor,
  selectPackageManager,
} from "./package-manager.mjs";
import { runPnpmInstaller, runReportedInstall } from "./install-report.mjs";
import { bootstrapPnpm, PNPM_VERSION } from "./pnpm-bootstrap.mjs";
import {
  runMeasuredOperation,
  WorkflowError,
} from "./workflow-metrics.mjs";

// Preserve project install scripts and let the package manager handle its dependencies.
await runMeasuredOperation(async () => {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 1 || args[0] !== "--prefer-pnpm")) {
    throw new WorkflowError("Use install-dependencies.mjs [--prefer-pnpm]; opt-in applies only to a fresh Sites starter.", 64);
  }
  const manifest = readProjectManifest({ required: false });
  const manager = selectPackageManager(manifest);
  if (!manifest) {
    if (manager.hasLockfile) throw new WorkflowError("A lockfile exists without package.json.");
    return skipInstall();
  }
  if (args.length && manager.name === "npm") {
    return bootstrapPnpm();
  }
  // Starter scripts own profile-specific cache, runtime setup, and timeouts.
  const installCi = manifest.scripts?.["install:ci"];
  if (installCi !== undefined) {
    if (typeof installCi !== "string" || !installCi.trim()) {
      throw new WorkflowError("The install:ci script must be a nonempty string.");
    }
    if (manager.name === "pnpm" && manager.version === PNPM_VERSION && installCi === "bash scripts/install-pnpm.sh") {
      return runPnpmInstaller(process.cwd());
    }
    return runReportedInstall([
      manager.name,
      ...(manager.name === "npm" ? ["--prefix", ".", "--workspaces=false"] : []),
      "run", "install:ci",
    ], { reportsSeed: true });
  }
  // Even dependency-free roots can need workspace linking or implicit install hooks.
  return runReportedInstall(installCommand(manager));
});

function installCommand({ name, version, hasLockfile }) {
  if (name === "npm") return ["npm", hasLockfile ? "ci" : "install"];
  if (name === "pnpm" || name === "bun") {
    return hasLockfile
      ? [name, "install", "--frozen-lockfile"]
      : [name, "install"];
  }
  if (resolveYarnMajor(version) === 1) {
    return hasLockfile
      ? ["yarn", "install", "--frozen-lockfile", "--non-interactive"]
      : ["yarn", "install", "--non-interactive"];
  }
  return ["yarn", "install", hasLockfile ? "--immutable" : "--no-immutable"];
}

function skipInstall() {
  // No installer ran: succeed with an empty measurement list, not a latency sample.
  process.stdout.write("No dependency installation is needed.\n");
  return { code: 0, skipped: true };
}
