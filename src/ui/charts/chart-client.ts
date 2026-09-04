export interface ChartPoint { label: string; value: number; }
export function serializeChartQuery(points: readonly ChartPoint[]) { return points.map(point => `${encodeURIComponent(point.label)}:${point.value}`).join(','); }
