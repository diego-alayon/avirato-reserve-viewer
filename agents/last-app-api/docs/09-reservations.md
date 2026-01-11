# Reservations

## Overview

The Reservations API allows you to manage table/space bookings for your location. It includes real-time availability checking, reservation creation, and schedule management.

## Base Endpoint

```
/reservations
```

**Required Header**: `LocationID`

## Endpoints

### 1. Create Reservation

**POST** `/reservations`

Create a new reservation after checking availability.

**Request Body:**
```typescript
interface CreateReservationRequest {
  location_id: string;        // Required
  date: string;                // Required. Format: YYYY-MM-DD
  time: string;                // Required. Format: HH:MM (24-hour)
  party_size: number;          // Required. Number of guests
  customer_id?: string;        // Optional. Link to existing customer
  customer_name?: string;      // Required if no customer_id
  customer_phone?: string;     // Required if no customer_id
  customer_email?: string;     // Optional
  notes?: string;              // Optional. Special requests
  duration_minutes?: number;   // Optional. Default: 120
}
```

**Example Request:**
```typescript
const reservation = await lastAppService.createReservation({
  location_id: 'loc_abc123',
  date: '2026-01-15',
  time: '19:00',
  party_size: 4,
  customer_name: 'John Doe',
  customer_phone: '+34612345678',
  customer_email: 'john@example.com',
  notes: 'Mesa cerca de la ventana, aniversario',
  duration_minutes: 90
});
```

**Response:**
```typescript
interface LastAppReservation {
  id: string;
  location_id: string;
  date: string;
  time: string;
  party_size: number;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  table_number?: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}
```

**Status Codes:**
- `201 Created` - Reservation created successfully
- `400 Bad Request` - Invalid data or no availability
- `404 Not Found` - Location not found
- `429 Too Many Requests` - Rate limit exceeded

---

### 2. Check Day Availability

**GET** `/reservations/availability/day`

Get available time slots for a specific date.

**Query Parameters:**
```typescript
interface DayAvailabilityParams {
  location_id: string;     // Required
  date: string;            // Required. Format: YYYY-MM-DD
  party_size: number;      // Required
}
```

**Example Request:**
```typescript
const availability = await lastAppService.getDayAvailability({
  location_id: 'loc_abc123',
  date: '2026-01-15',
  party_size: 4
});
```

**Response:**
```typescript
interface AvailabilitySlot {
  time: string;              // Format: HH:MM
  available: boolean;
  available_tables: number;  // How many tables can accommodate party
  max_party_size: number;    // Maximum party size for this slot
}

// Response
{
  date: '2026-01-15',
  slots: [
    {
      time: '12:00',
      available: true,
      available_tables: 3,
      max_party_size: 6
    },
    {
      time: '12:30',
      available: true,
      available_tables: 2,
      max_party_size: 4
    },
    {
      time: '13:00',
      available: false,
      available_tables: 0,
      max_party_size: 0
    }
    // ... more slots
  ]
}
```

---

### 3. Check Month Availability

**GET** `/reservations/availability/month`

Get available dates for an entire month (overview).

**Query Parameters:**
```typescript
interface MonthAvailabilityParams {
  location_id: string;     // Required
  year: number;            // Required. e.g., 2026
  month: number;           // Required. 1-12
  party_size?: number;     // Optional. Filter by party size
}
```

**Example Request:**
```typescript
const monthAvailability = await lastAppService.getMonthAvailability({
  location_id: 'loc_abc123',
  year: 2026,
  month: 1,
  party_size: 4
});
```

**Response:**
```typescript
interface AvailableDay {
  date: string;              // YYYY-MM-DD
  has_availability: boolean;
  available_slots: number;   // How many time slots available
}

// Response
{
  year: 2026,
  month: 1,
  days: [
    {
      date: '2026-01-01',
      has_availability: false,  // Holiday
      available_slots: 0
    },
    {
      date: '2026-01-02',
      has_availability: true,
      available_slots: 15
    }
    // ... all days in month
  ]
}
```

---

### 4. Get Reservation Schedules

**GET** `/reservations/schedules`

Get configured schedules for a location (hours of operation, slot intervals).

**Required Header**: `LocationID`

**Example Request:**
```typescript
const schedules = await lastAppService.getSchedules();
```

**Response:**
```typescript
interface ReservationSchedule {
  id: string;
  location_id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = Sunday
  open_time: string;       // HH:MM
  close_time: string;      // HH:MM
  slot_duration: number;   // Minutes between slots (e.g., 30)
  max_capacity: number;    // Total capacity
  enabled: boolean;
}

// Response
{
  schedules: [
    {
      id: 'sched_123',
      location_id: 'loc_abc123',
      day_of_week: 1,  // Monday
      open_time: '12:00',
      close_time: '23:00',
      slot_duration: 30,
      max_capacity: 50,
      enabled: true
    },
    {
      id: 'sched_124',
      location_id: 'loc_abc123',
      day_of_week: 2,  // Tuesday
      open_time: '12:00',
      close_time: '23:00',
      slot_duration: 30,
      max_capacity: 50,
      enabled: true
    }
    // ... one per day of week
  ]
}
```

---

### 5. Cancel Reservation

**DELETE** `/reservations/{id}`

Cancel an existing reservation.

**Parameters:**
- `id` (path): Reservation ID

**Example Request:**
```typescript
await lastAppService.cancelReservation('res_xyz789');
```

**Response:**
```typescript
{
  success: true,
  message: 'Reservation cancelled successfully'
}
```

**Status Codes:**
- `200 OK` - Cancelled successfully
- `404 Not Found` - Reservation not found
- `400 Bad Request` - Cannot cancel (e.g., already completed)

---

## Complete Implementation

### Service Methods

```typescript
export class LastAppService {
  // Create reservation
  async createReservation(data: CreateReservationRequest): Promise<LastAppReservation> {
    return this.makeRequest<LastAppReservation>(
      '/reservations',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      'location'
    );
  }

  // Check day availability
  async getDayAvailability(params: DayAvailabilityParams): Promise<AvailabilitySlot[]> {
    const query = new URLSearchParams({
      location_id: params.location_id,
      date: params.date,
      party_size: params.party_size.toString()
    });

    const response = await this.makeRequest<{ slots: AvailabilitySlot[] }>(
      `/reservations/availability/day?${query}`,
      {},
      'location'
    );

    return response.slots;
  }

  // Check month availability
  async getMonthAvailability(params: MonthAvailabilityParams): Promise<AvailableDay[]> {
    const query = new URLSearchParams({
      location_id: params.location_id,
      year: params.year.toString(),
      month: params.month.toString()
    });

    if (params.party_size) {
      query.append('party_size', params.party_size.toString());
    }

    const response = await this.makeRequest<{ days: AvailableDay[] }>(
      `/reservations/availability/month?${query}`,
      {},
      'location'
    );

    return response.days;
  }

  // Get schedules
  async getSchedules(): Promise<ReservationSchedule[]> {
    const response = await this.makeRequest<{ schedules: ReservationSchedule[] }>(
      '/reservations/schedules',
      {},
      'location'
    );

    return response.schedules;
  }

  // Cancel reservation
  async cancelReservation(id: string): Promise<void> {
    await this.makeRequest(
      `/reservations/${id}`,
      { method: 'DELETE' },
      'location'
    );
  }
}
```

## UI Flow Example

### 1. Availability Calendar

```typescript
function ReservationCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [partySize, setPartySize] = useState(2);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);

  useEffect(() => {
    async function loadAvailability() {
      const slots = await lastAppService.getDayAvailability({
        location_id: currentLocationId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        party_size: partySize
      });
      setAvailability(slots);
    }
    loadAvailability();
  }, [selectedDate, partySize]);

  return (
    <div>
      <input
        type="date"
        value={format(selectedDate, 'yyyy-MM-dd')}
        onChange={(e) => setSelectedDate(new Date(e.target.value))}
      />
      <select value={partySize} onChange={(e) => setPartySize(+e.target.value)}>
        {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
          <option key={n} value={n}>{n} personas</option>
        ))}
      </select>

      <div className="slots">
        {availability.map(slot => (
          <button
            key={slot.time}
            disabled={!slot.available}
            onClick={() => handleSelectSlot(slot)}
          >
            {slot.time}
            {slot.available ? ' ✓' : ' (Completo)'}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 2. Reservation Form

```typescript
function ReservationForm() {
  const { register, handleSubmit } = useForm<CreateReservationRequest>();

  const onSubmit = async (data: CreateReservationRequest) => {
    try {
      const reservation = await lastAppService.createReservation({
        ...data,
        location_id: currentLocationId
      });

      toast({
        title: 'Reserva creada',
        description: `Confirmada para ${data.date} a las ${data.time}`
      });

      router.push(`/reservations/${reservation.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="date" {...register('date', { required: true })} />
      <input type="time" {...register('time', { required: true })} />
      <input type="number" {...register('party_size', { required: true })} />
      <input type="text" {...register('customer_name', { required: true })} />
      <input type="tel" {...register('customer_phone', { required: true })} />
      <input type="email" {...register('customer_email')} />
      <textarea {...register('notes')} placeholder="Notas especiales..." />
      <button type="submit">Crear Reserva</button>
    </form>
  );
}
```

## Webhooks

Listen for reservation events:

```typescript
await lastAppService.registerWebhook(
  'https://your-app.com/webhooks/lastapp',
  ['reservation:created', 'reservation:cancelled', 'reservation:updated']
);

// Server endpoint
app.post('/webhooks/lastapp', (req, res) => {
  const { event, data } = req.body;

  switch (event) {
    case 'reservation:created':
      // Send confirmation email
      sendConfirmationEmail(data.customer_email, data);
      break;

    case 'reservation:cancelled':
      // Send cancellation email
      sendCancellationEmail(data.customer_email, data);
      break;
  }

  res.sendStatus(200);
});
```

## Best Practices

1. **Always check availability first** before showing booking form
2. **Use month view** to highlight available dates
3. **Show clear messaging** when slots are full
4. **Send confirmation emails** immediately
5. **Allow easy cancellation** with customer-friendly policy
6. **Handle time zones properly** (store in UTC, display in local)
7. **Set reasonable default duration** (e.g., 2 hours for dinner)
8. **Implement waiting list** for popular times
9. **Send reminder notifications** (24h before, 2h before)
10. **Track no-shows** to optimize scheduling

## Related Endpoints

- [Customers](./10-customers.md) - Link reservations to customer profiles
- [Webhooks](./12-webhooks.md) - Real-time reservation updates
- [Locations](./05-locations.md) - Configure location schedules
