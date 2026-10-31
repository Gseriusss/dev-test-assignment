import type { AssignmentRecord } from "./types.ts";

export function getAlmatyDate(date: string): string {
  const utcDate = new Date(date);

  const almatyDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Almaty',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(utcDate);

  return almatyDate;
}

