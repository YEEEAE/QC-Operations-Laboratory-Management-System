import type { ActorContext } from '../../../shared/authorization/types.js';

export type DashboardMetricTone = 'neutral' | 'warning' | 'danger' | 'success';
export interface DashboardMetric { key: string; label: string; value: number; definition: string; href?: string; tone?: DashboardMetricTone; }
export interface DashboardAttention { id: string; title: string; summary: string; href: string; severity: 'INFO' | 'WARNING' | 'CRITICAL'; state: string; }
export interface DashboardActivity { id: string; action: string; subjectType: string; subjectId: string; summary: string; occurredAt: Date; }
export interface DashboardReadModel { generatedAt: Date; scopeLabel: string; metrics: DashboardMetric[]; attention: DashboardAttention[]; activity: DashboardActivity[]; }
export interface DashboardQuery { get(actor: ActorContext): Promise<DashboardReadModel>; }
