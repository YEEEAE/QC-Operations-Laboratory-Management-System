import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  branch: (branch) => {
    if (branch.name !== "staging") {
      throw new Error("This Neon policy is restricted to the staging branch.");
    }
    return {};
  },
  buckets: {
    "qc-staging-artifacts": { access: "private" },
  },
});
