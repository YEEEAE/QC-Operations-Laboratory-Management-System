import { DOCUMENT_TYPES } from '../domain/document.js';
import { DOCUMENT_VERSION_STATES } from '../domain/document-version.js';

// Delivery-safe projection of the controlled document-type vocabulary
// (F-06). The single source of truth stays the domain constant
// DOCUMENT_TYPES; this module only re-exports it through the application
// layer so Astro pages never import domain internals directly
// (architecture boundary: delivery to domain imports are forbidden).
// No value is added, removed, or invented here.
export const DOCUMENT_TYPE_OPTIONS: readonly string[] = DOCUMENT_TYPES;

// Transport-safe state vocabulary for document Actions. The application layer
// exposes the domain-owned values without letting delivery import domain code.
export const DOCUMENT_VERSION_STATE_OPTIONS = DOCUMENT_VERSION_STATES;
