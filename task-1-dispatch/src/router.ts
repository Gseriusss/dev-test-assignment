import type { Assignment, AssignmentRecord, Branch, Order, Rule } from './types.ts';
import { distanceKm } from './geo.ts';
import { getAlmatyDate, isBranchFull } from './time.ts';
import type { assignments } from './store.ts';

export function assignBranch(order: Order, branches: Branch[], assignments: AssignmentRecord[]): Assignment {
  const own = branches.filter((b) => b.storeId === order.storeId && b.active);

  if (order.manualBranchId) {
    const manual = own.find((b) => b.id === order.manualBranchId);
    if (manual) return { orderId: order.id, branchId: manual.id, rule: 'manual' };
  }

  let selectedBranch: Branch | null = null;
  let selectedRule: Rule = 'unassigned';

  if (own.length === 1) {
    selectedBranch = own[0],
    selectedRule = 'single'
  }

  // TODO: pickup_point

  if (order.pickupPointId) {
    const pickupBranch = own.find((b) => 
      b.pickupPointIds.includes(order.pickupPointId!)
    );
    if (pickupBranch) {
      selectedBranch = pickupBranch;
      selectedRule = 'pickup_point';
    }
  }

  // TODO: city

  const cityBranches = own.filter((b) => b.city === order.city);

  if (cityBranches.length === 1) {
    selectedBranch = cityBranches[0];
    selectedRule = 'city';
  }

  // GEO

  if (!selectedBranch) {
    selectedBranch = findNearest(order, own);
    if (selectedBranch) {
      selectedRule = 'geo'
    }
  }

  // unassigned
  if (!selectedBranch) {
  return {orderId: order.id, branchId: null, rule: 'unassigned'};
  }
  // TODO: limit
  
  const date = getAlmatyDate(order.createdAt);

  if (!isBranchFull(selectedBranch, date, assignments)) {
    return {orderId: order.id, branchId: selectedBranch.id, rule: selectedRule};
  }

  // Поиск ближайшего незаполненного филиала
  const availableBranches = own.filter(
    (b) => !isBranchFull(b, date, assignments)
  );

  const nearestAvailable = findNearest(order,availableBranches);

  if (!nearestAvailable) {
    return {orderId: order.id, branchId: null, rule: 'unassigned'};
  }

  return {orderId: order.id, branchId: nearestAvailable.id, rule: 'geo'};

   

  /* const nearest = findNearest(order, own);
  if (nearest) return { orderId: order.id, branchId: nearest.id, rule: 'geo' };

  return { orderId: order.id, branchId: null, rule: 'unassigned' }; */
}

function findNearest(order: Order, branches: Branch[]): Branch | null {
  if (order.lat === null || order.lon === null) return null;

  let best: Branch | null = null;
  let bestDist = Infinity;
  for (const b of branches) {
    const d = distanceKm(order.lat, order.lon, b.lat, b.lon);
    if (d < bestDist) {
      best = b;
      bestDist = d;
    }
  }
  return best;
}
