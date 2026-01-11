/**
 * Last.app API - Create Reservation Example
 *
 * Complete reservation flow with availability check
 */

import { lastAppService } from '../../../src/services/lastapp';
import { format } from 'date-fns';

export async function createReservationFlow() {
  const locationId = 'loc_123';
  const date = format(new Date(), 'yyyy-MM-dd');
  const partySize = 4;

  // 1. Check availability
  const availability = await lastAppService.getDayAvailability({
    location_id: locationId,
    date,
    party_size: partySize
  });

  const availableSlots = availability.filter(slot => slot.available);

  if (availableSlots.length === 0) {
    console.log('No availability for this date');
    return;
  }

  // 2. Create reservation
  const reservation = await lastAppService.createReservation({
    location_id: locationId,
    date,
    time: availableSlots[0].time,
    party_size: partySize,
    customer_name: 'John Doe',
    customer_phone: '+34612345678',
    customer_email: 'john@example.com',
    notes: 'Window table preferred'
  });

  console.log(`Reservation created: ${reservation.id}`);
  console.log(`Date: ${reservation.date} at ${reservation.time}`);
  console.log(`Party: ${reservation.party_size} people`);

  return reservation;
}

// Check month availability
export async function checkMonthAvailability() {
  const availability = await lastAppService.getMonthAvailability({
    location_id: 'loc_123',
    year: 2026,
    month: 1,
    party_size: 2
  });

  const availableDays = availability.filter(d => d.has_availability);
  console.log(`${availableDays.length} days available this month`);

  return availableDays;
}
