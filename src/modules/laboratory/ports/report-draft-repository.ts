import type { ReportDraftData, ReportType } from '../domain/report-draft.js';

export interface ReportDraftRow {
  id: string;
  report_type: ReportType;
  form_data: ReportDraftData;
  author_id: string;
  created_at: Date;
  updated_at: Date;
  version: bigint;
}

export interface ReportDraftRepository {
  list(input: { authorId?: string; limit: number }): Promise<ReportDraftRow[]>;
  get(id: string): Promise<ReportDraftRow | undefined>;
  create(input: {
    id: string;
    reportType: ReportType;
    formData: ReportDraftData;
    authorId: string;
    requestId: string;
  }): Promise<void>;
  update(input: {
    id: string;
    authorId?: string;
    reportType: ReportType;
    expectedVersion: bigint;
    formData: ReportDraftData;
    actorId: string;
    requestId: string;
  }): Promise<void>;
}
