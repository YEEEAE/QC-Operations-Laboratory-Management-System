import { APP_TIME_ZONE } from '../../config/constants';

export interface RiyadhParts {
  date: string;
  time: string;
}

export function toRiyadhParts(value: Date | string | number): RiyadhParts {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new RangeError('Invalid date');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}:${get('second')}`,
  };
}

export function formatRiyadhDateTime(value: Date | string | number): string {
  const parts = toRiyadhParts(value);
  return `${parts.date} ${parts.time}`;
}
