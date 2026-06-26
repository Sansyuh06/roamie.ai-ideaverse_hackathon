# API Documentation

## REST APIs

### Authentication (/api/auth)

#### POST /api/auth/register
- **Purpose**: Create a new user account
- **Request**: `{ email, name, password, preferredLang?, tripPurpose?, dietaryPref?, seatPreference?, passportCountry? }`
- **Response**: `{ user: {...}, accessToken, refreshToken }`
- **Auth**: None (rate limited)

#### POST /api/auth/login
- **Purpose**: Authenticate existing user
- **Request**: `{ email, password }`
- **Response**: `{ user: {...}, accessToken, refreshToken }`
- **Auth**: None (rate limited)

#### POST /api/auth/refresh
- **Purpose**: Refresh expired access token
- **Request**: `{ refreshToken }`
- **Response**: `{ accessToken, refreshToken }`

#### GET /api/auth/me
- **Purpose**: Get current user profile
- **Response**: `{ user: {...} }`
- **Auth**: Required

#### PUT /api/auth/profile
- **Purpose**: Update user profile preferences
- **Request**: Partial user fields
- **Auth**: Required

### Trips (/api/trips)

#### POST /api/trips
- **Purpose**: Create a new trip
- **Request**: `{ destination, startDate, endDate }`
- **Response**: `{ trip: {...} }`
- **Auth**: Required

#### GET /api/trips
- **Purpose**: List all user trips with bookings and itinerary
- **Response**: `{ trips: [...] }`
- **Auth**: Required

#### GET /api/trips/:id
- **Purpose**: Get single trip with all relations
- **Response**: `{ trip: {...} }`
- **Auth**: Required (ownership check)

#### DELETE /api/trips/:id
- **Purpose**: Delete trip and all related data (cascade)
- **Auth**: Required (ownership check)

#### PATCH /api/trips/:id/status
- **Purpose**: Update trip status
- **Auth**: Required

#### POST /api/trips/:id/flights
- **Purpose**: Add flight booking to trip
- **Request**: `{ flightNumber, origin, destination, departureTime, arrivalTime, airline, price? }`
- **Auth**: Required (ownership check)

#### POST /api/trips/:id/hotels
- **Purpose**: Add hotel booking to trip
- **Request**: `{ hotelName, checkIn, checkOut }`
- **Auth**: Required (ownership check)

#### PATCH /api/trips/:id/budget
- **Purpose**: Set trip budget
- **Request**: `{ budget, budgetCurrency? }`
- **Auth**: Required

#### GET /api/trips/:id/budget-summary
- **Purpose**: Get budget vs. expenses summary
- **Auth**: Required

### Itinerary (/api/itinerary)

#### POST /api/itinerary/build
- **Purpose**: Generate full AI itinerary for a trip
- **Request**: `{ tripId, calendarEvents?, savedPlaces?, energyLevel? }`
- **Response**: Full itinerary plan with days, events, cultural nudges
- **Auth**: Required

#### GET /api/itinerary/days/:tripId
- **Purpose**: Get all itinerary days for a trip
- **Response**: `{ days: [...] }`
- **Auth**: Required

#### PUT /api/itinerary/day/:dayId
- **Purpose**: Update events for a specific day (saves previous version)
- **Request**: `{ events: [...] }`
- **Auth**: Required

#### POST /api/itinerary/regenerate
- **Purpose**: Regenerate full itinerary, return specific date
- **Request**: `{ tripId, date, energyLevel?, savedPlaces? }`
- **Auth**: Required

#### POST /api/itinerary/regenerate-day
- **Purpose**: Regenerate a single day's itinerary
- **Request**: `{ tripId, dayId, energyLevel? }`
- **Auth**: Required

#### POST /api/itinerary/notes
- **Purpose**: Save a note on an event
- **Request**: `{ tripId, dayId, eventTime, note }`
- **Auth**: Required

#### GET /api/itinerary/notes/:tripId
- **Purpose**: Get all notes for a trip
- **Auth**: Required

#### POST /api/itinerary/undo/:dayId
- **Purpose**: Revert day to previous version
- **Auth**: Required

#### GET /api/itinerary/:tripId/export
- **Purpose**: Plain-text itinerary export
- **Response**: text/plain
- **Auth**: Required

#### GET /api/itinerary/:tripId/weather-warnings
- **Purpose**: Get weather-based warnings for itinerary
- **Auth**: Required

### Disruption (/api/disruption)

#### POST /api/disruption/trigger
- **Purpose**: Trigger disruption shield for a flight
- **Request**: `{ tripId, flightId, disruptionType, simulateZeroFlights? }`
- **Response**: Full resolution with steps, alternative flights, QR code
- **Auth**: Required (ownership + rate limited)

#### POST /api/disruption/confirm/:token
- **Purpose**: Confirm disruption resolution booking
- **Auth**: None (token-based)

#### POST /api/disruption/cancel/:token
- **Purpose**: Cancel disruption resolution
- **Auth**: None (token-based)

#### GET /api/disruption/log/:tripId
- **Purpose**: Get disruption history for a trip
- **Auth**: Required

### Expenses (/api/expense)

#### POST /api/expense/scan
- **Purpose**: Scan receipt text and create expense
- **Request**: `{ receiptText, tripId? }`
- **Response**: `{ expense, extracted }`
- **Auth**: Required

#### GET /api/expense/list
- **Purpose**: List expenses (optionally filtered by tripId)
- **Query**: `tripId?`
- **Auth**: Required

### Other Endpoints

#### GET /api/checklist/:tripId — Combined packing + visa + law checklist
#### GET /api/checklist/:tripId/law-nudges — Destination law/cultural tips
#### GET /api/geocode/autocomplete?q= — Place search autocomplete
#### GET /api/geocode/coords?q= — Get coordinates for location
#### POST /api/translate — Translate text
#### GET /api/suggestions/:tripId — Live AI suggestions
#### GET /api/booking-suggestions/:tripId — Hotel + flight recommendations
#### GET /api/packing/:tripId — Smart packing list
#### POST /api/feedback — Submit public feedback
#### GET /api/admin/feedback — List all feedback (admin)
#### DELETE /api/admin/feedback/:id — Delete feedback (admin)
#### GET /api/health — Health check

## Internal APIs (Domain Interfaces)

### ITripRepository
- `findTripById(id)`, `findTripsByUserId(userId)`, `createTrip(data)`, `updateTrip(id, data)`, `deleteTrip(id)`
- `findItineraryDays(tripId)`, `upsertItineraryDay(data)`
- `findFlightsByTripId(tripId)`, `findFlightById(id)`, `updateFlight(id, data)`
- `findHotelsByTripId(tripId)`, `updateHotel(id, data)`
- `findCabsByTripId(tripId)`, `updateCab(id, data)`
- `findUserById(id)`, `createDisruptionLog(data)`

### IItineraryService
- `generateItinerary(context: TripContext): Promise<ItineraryPlan>`

### IFlightService
- `findAlternatives(origin, destination, date, preferences?): Promise<AlternativeFlight[]>`

### IExpenseService
- `scanReceipt(receiptText, lang): Promise<{amount, currency, category, description, date?}>`

### IWeatherService
- `getForecast(lat, lng, days?): Promise<WeatherForecast>`

## Data Models

### User
- Fields: id, email, name, passwordHash, preferredLang, tripPurpose, dietaryPref, seatPreference, passportCountry, paymentBalance, travelProfile, isAdmin
- Relationships: has many Trips, has many Expenses

### Trip
- Fields: id, userId, destination, startDate, endDate, status, budget, budgetCurrency
- Relationships: belongs to User, has many ItineraryDays, FlightBookings, HotelBookings, CabBookings, DisruptionLogs, ItineraryNotes

### ItineraryDay
- Fields: id, tripId, date, events (JSON string), freeGaps (JSON string), previousVersion
- Note: events and freeGaps stored as serialized JSON strings in SQLite

### FlightBooking
- Fields: id, tripId, flightNumber, origin, destination, departureTime, arrivalTime, airline, status, price, seatClass, confirmationCode

### HotelBooking
- Fields: id, tripId, hotelName, checkIn, checkOut, confirmationCode, status, latestCheckIn

### CabBooking
- Fields: id, tripId, pickup, dropoff, pickupTime, status

### Expense
- Fields: id, userId, tripId, amount, currency, category, description, receiptText, date
