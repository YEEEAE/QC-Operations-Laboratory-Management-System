import { createHash } from 'node:crypto';
import { MASTER_DATA_ENTITIES, getMasterDataEntity } from '../../../../scripts/data/master-data-catalog.js';
import { importIntentSha256, mapImportHeaders, parseCsvRecords, type ImportRow } from '../../../../scripts/data/import-preflight.js';
import { getRegisteredDataset } from '../../../../scripts/data/registered-datasets.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { isNamedSystemOwner } from '../../../shared/authorization/p05-authority.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { MasterDataRepository } from '../ports/master-data-repository.js';

export class ListMasterDataRevisionsUseCase {
  constructor(private readonly repository: MasterDataRepository) {}
  async execute(input: { actor: ActorContext }) {
    if (!isNamedSystemOwner(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    return { catalog: MASTER_DATA_ENTITIES, revisions: await this.repository.listRevisions() };
  }
}

export class PreviewMasterDataRevisionUseCase {
  execute(input: {
    datasetKey: string; source: string; mapping: Record<string, string>;
  }) {
    const entity = getMasterDataEntity(input.datasetKey);
    const parsed = parseCsvRecords(input.source);
    const records = mapImportHeaders(parsed.headers, parsed.records, input.mapping);
    const missingMappings = entity.businessKey.filter((field) => !Object.values(input.mapping).includes(field));
    const supported = entity.importAdapter !== null;
    const issues = [
      ...missingMappings.map((field) => ({ rowNumber: 0, field, code: 'MISSING_HEADER_MAPPING', detail: `Map a source column to ${field}.` })),
      ...(!supported ? [{ rowNumber: 0, code: 'ADAPTER_UNAVAILABLE', detail: 'No governed import adapter is registered for this dataset.' }] : []),
      ...((entity.sourceApprovalState !== 'APPROVED') ? [{ rowNumber: 0, code: 'PENDING_SOURCE_APPROVAL', detail: 'Source approval and effective revision are unresolved.' }] : []),
    ];
    let registered: ReturnType<typeof getRegisteredDataset> | undefined;
    if (supported) {
      try { registered = getRegisteredDataset(input.datasetKey); }
      catch { issues.push({ rowNumber: 0, code: 'ADAPTER_UNAVAILABLE', detail: 'The registered adapter is not available for this dataset.' }); }
    }
    const seenKeys = new Set<string>();
    records.forEach((record, index) => {
      const rowNumber = index + 2;
      for (const field of registered?.fields ?? []) {
        const value = record[field.column];
        if (field.required && (value === undefined || value === null || String(value).trim() === '')) {
          issues.push({ rowNumber, field: field.column, code: 'MISSING_REQUIRED_FIELD', detail: `Required field ${field.column} is empty.` });
        } else if (value !== undefined && field.allowedValues && !field.allowedValues.includes(String(value))) {
          issues.push({ rowNumber, field: field.column, code: 'INVALID_VALUE', detail: `Value is not allowed for ${field.column}.` });
        }
      }
      for (const reference of registered?.references ?? []) {
        if (reference.required && (record[reference.column] === undefined || String(record[reference.column]).trim() === '')) {
          issues.push({ rowNumber, field: reference.column, code: 'MISSING_REQUIRED_FIELD', detail: `Required reference ${reference.column} is empty.` });
        } else if (record[reference.column] !== undefined) {
          issues.push({ rowNumber, field: reference.column, code: 'REFERENCE_CHECK_REQUIRED', detail: 'Reference must be checked against the authorized database before import.' });
        }
      }
      if (entity.businessKey.length) {
        const key = entity.businessKey.map((field) => String(record[field] ?? '').trim()).join('\u001f');
        if (key.split('\u001f').some((part) => !part)) issues.push({ rowNumber, field: entity.businessKey.join(','), code: 'MISSING_BUSINESS_KEY', detail: 'Map and supply the complete business key.' });
        else if (seenKeys.has(key)) issues.push({ rowNumber, field: entity.businessKey.join(','), code: 'DUPLICATE_IN_BATCH', detail: 'Business key duplicates an earlier row in this file.' });
        seenKeys.add(key);
      }
    });
    if (registered) issues.push({ rowNumber: 0, code: 'EXISTING_KEY_CHECK_REQUIRED', detail: 'Existing-record conflicts are not queried during this source-only preview.' });
    return {
      datasetKey: entity.key,
      source: { owner: entity.sourceOwner, effectiveRevision: entity.effectiveRevision, approvalState: entity.sourceApprovalState, importAdapter: entity.importAdapter, lastUpdated: entity.lastUpdated },
      headers: parsed.headers,
      records,
      contentSha256: importIntentSha256(input.source, input.mapping),
      mappingFingerprint: createHash('sha256').update(JSON.stringify(Object.entries(input.mapping).sort(([a], [b]) => a.localeCompare(b)))).digest('hex'),
      issues,
      importable: false as const,
      status: 'PENDING_SOURCE_APPROVAL' as const,
    };
  }
}

export class SubmitMasterDataRevisionUseCase {
  constructor(private readonly repository: MasterDataRepository) {}
  async execute(input: {
    actor: ActorContext; datasetKey: string; source: string; mapping: Record<string, string>;
    sourceOwner: string; sourceReference: string; requestId: string;
    sourceFileReference?: string;
  }) {
    if (!isNamedSystemOwner(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const preview = new PreviewMasterDataRevisionUseCase().execute(input);
    const entity = getMasterDataEntity(input.datasetKey);
    const hasUnsafeInput = preview.issues.some((issue) => issue.code === 'MISSING_HEADER_MAPPING');
    const rows = preview.records as ImportRow[];
    const sourceFileReference = input.sourceFileReference?.trim() ?? '';
    if (hasUnsafeInput || rows.length === 0 || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(sourceFileReference))
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    return this.repository.submitRevision({
      actor: input.actor, datasetKey: input.datasetKey, contentSha256: preview.contentSha256,
      sourceOwner: input.sourceOwner, sourceReference: input.sourceReference,
      sourceFileReference, schemaVersion: 'master-data-csv/v1',
      adapterKey: entity.importAdapter, headerMapping: input.mapping, records: rows,
      preview: { headers: preview.headers, issues: preview.issues, status: preview.status, mappingFingerprint: preview.mappingFingerprint },
      requestId: input.requestId,
    });
  }
}

export class ApproveMasterDataRevisionUseCase {
  constructor(private readonly repository: MasterDataRepository) {}
  execute(input: Parameters<MasterDataRepository['decideRevision']>[0]) {
    if (!isNamedSystemOwner(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (!input.effectiveRevision.trim() || !input.sourceApprovalReference.trim() || !input.sourceLastUpdated || !input.reason.trim()) {
      throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
    }
    return this.repository.decideRevision(input);
  }
}
