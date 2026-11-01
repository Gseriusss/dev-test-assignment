import type { AssignmentRecord, Branch } from "./types.ts";

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

export function countDailyOrders( branchId: string, date: string, assignments: AssignmentRecord[]): number {
    return assignments.filter((assignment) => {
      return (
        assignment.branchId === branchId &&
        getAlmatyDate(assignment.createdAt) === date
      );
    }).length;
  }

export function isBranchFull(branch: Branch, date: string, assignments: AssignmentRecord[]): boolean {
  const orderCount = countDailyOrders(branch.id, date, assignments);

  return orderCount >= branch.dailyLimit;
}