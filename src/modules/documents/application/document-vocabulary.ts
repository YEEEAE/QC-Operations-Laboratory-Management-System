import { DOCUMENT_TYPES } from '../domain/document.js';

// Delivery-safe projection of the controlled document-type vocabulary
// (F-06). The single source of truth stays the domain constant
// DOCUMENT_TYPES; this module only re-exports it through the application
// layer so Astro pages never import domain internals directly
// (architecture boundary: delivery to domain imports are forbidden).
// No value is added, removed, or invented here.
export const DOCUMENT_TYPE_OPTIONS: readonly string[] = DOCUMENT_TYPES;
