/**
 * Future extension seam for a separately approved Focus CSV/API capability.
 * The application intentionally has no implementation or active binding.
 */
export interface FocusTransferAdapterPort {
  readonly mode: 'CSV' | 'API';
  readonly activation: 'OWNER_APPROVAL_REQUIRED';
  prepareTransfer(input: { reportId: string; reportRevision: bigint }): Promise<{ payloadReference: string }>;
}
