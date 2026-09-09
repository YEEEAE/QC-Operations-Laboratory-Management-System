/**
 * Delivery-safe projection of the supported change-target vocabulary
 * (F-06). `DOCUMENT_VERSION` is the only target type evidenced as supported
 * by the approval runtime (`src/modules/approvals/...`: the
 * `DOCUMENT_VERSION` resolution case plus the policy-registry entries).
 *
 * The server still accepts any non-blank target type, so no approval policy
 * is invented or narrowed here: the UI simply stops offering unevidenced
 * free text. Exposed through the application layer so Astro pages never
 * import domain internals directly.
 */
export const CHANGE_TARGET_TYPES: readonly string[] = ['DOCUMENT_VERSION'];
