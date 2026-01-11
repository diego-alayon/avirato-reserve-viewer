/**
 * Last.app API - Manage Tab Example
 *
 * Complete order lifecycle from creation to closure
 */

import { lastAppService } from '../../../src/services/lastapp';

export async function completeOrderFlow() {
  // 1. Create tab
  const tab = await lastAppService.createTab({
    location_id: 'loc_123',
    order_type: 'dine_in',
    table_number: 5
  });

  // 2. Add products
  await lastAppService.addProductsToTab(tab.id, [
    { product_id: 'prod_burger', quantity: 2 },
    { product_id: 'prod_fries', quantity: 1 }
  ]);

  // 3. Update status
  await lastAppService.updateOrderStatus(tab.id, { status: 'READY_TO_PICKUP' });

  // 4. Create bill
  const bill = await lastAppService.createBill(tab.id);

  // 5. Process payment
  await lastAppService.createPayment({
    bill_id: bill.id,
    amount: bill.total,
    method: 'card'
  });

  console.log('Order complete!');
}
