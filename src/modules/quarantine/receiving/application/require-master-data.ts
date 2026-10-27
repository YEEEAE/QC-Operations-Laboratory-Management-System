import { getMasterDataEntity } from '../../../../../scripts/data/master-data-catalog.js';
import { AppError } from '../../../../shared/errors/app-error.js';

/** Receiving identities have no approved, effective Item/Supplier source today. */
export function assertReceivingMasterDataAvailable(): void {
  for (const key of ['item', 'supplier']) {
    const source = getMasterDataEntity(key);
    if (source.sourceApprovalState !== 'APPROVED' || !source.effectiveRevision || source.importAdapter === null) {
      throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true, messageKey: 'MASTER_DATA_UNAVAILABLE' });
    }
  }
}
