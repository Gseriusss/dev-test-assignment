import { createServer, type ServerResponse } from 'node:http';
import { assignments, branches, orders } from './store.ts';
import { assignBranch } from './router.ts';
import {isValidDate, getAlmatyDate} from './time.ts';

const port = Number(process.env.PORT ?? 3001);

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean);

  try {
    if (req.method === 'GET' && url.pathname === '/branches') {
      return send(res, 200, branches);
    }

    if (req.method === 'GET' && parts[0] === 'orders' && parts.length === 2) {
      const order = orders.find((o) => o.id === parts[1]);
      if (!order) return send(res, 404, { error: 'order_not_found' });
      return send(res, 200, order);
    }

    if (req.method === 'POST' && parts[0] === 'orders' && parts[2] === 'assign' && parts.length === 3) {
      const orderId = parts[1];
      const order = orders.find((o) => o.id === orderId);
      if (!order) {
        return send(res, 404, {error: 'order_not_found'});
      }
      const existing = assignments.get(orderId);
      if (existing) {
        return send(res, 200, existing);
      }
      const saveOrder = assignBranch(order, branches, []);
      assignments.set(orderId, saveOrder);
      return send(res, 200, saveOrder);
    }

    if (req.method === 'GET' && parts[0] === 'branches' && parts[2] === 'load' && parts.length === 3) {
      const branchId = parts[1];
      const date = url.searchParams.get('date');
      if (!date || !isValidDate(date)) {
        return send(res, 400, { error: 'invalid_date' });
      }
      const branch = branches.find((b) => b.id === branchId);
        if (!branch) {
          return send(res, 404, { error: 'branch_not_found' });
        }

  
      const assigned = [...assignments.values()].filter((assignment) => {
        if (assignment.branchId !== branchId) {
          return false;
        }
      const order = orders.find((o) => o.id === assignment.orderId);
      return order && getAlmatyDate(order.createdAt) === date;
      }).length;

    return send(res, 200, {branchId, date, assigned, limit: branch.dailyLimit});
    }

    send(res, 404, { error: 'not_found' });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: 'internal' });
  }
});

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

server.listen(port, () => {
  console.log(`dispatch: http://localhost:${port}`);
});
