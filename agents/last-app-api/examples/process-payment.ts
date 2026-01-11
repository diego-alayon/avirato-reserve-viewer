/**
 * Last.app API - Process Payment Example
 *
 * Different payment scenarios
 */

import { lastAppService } from '../../../src/services/lastapp';

// Single payment
export async function singlePayment(billId: string, total: number) {
  const payment = await lastAppService.createPayment({
    bill_id: billId,
    amount: total,
    method: 'card',
    reference: `TXN_${Date.now()}`
  });

  return payment;
}

// Split payment
export async function splitPayment(billId: string, total: number) {
  const half = total / 2;

  // First customer
  await lastAppService.createPayment({
    bill_id: billId,
    amount: half,
    method: 'cash'
  });

  // Second customer
  await lastAppService.createPayment({
    bill_id: billId,
    amount: half,
    method: 'card'
  });

  console.log('Split payment complete!');
}
