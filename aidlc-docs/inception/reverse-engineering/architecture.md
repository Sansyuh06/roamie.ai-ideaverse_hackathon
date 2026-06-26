# System Architecture

## System Overview
Roamie is a monorepo containing a TypeScript backend API (Express + Prisma) and a React frontend SPA (Vite + Tailwind). The backend follows Clean Architecture / Hexagonal Architecture with clear separation between domain, use cases, adapters, infrastructure, and AI agents.

## Architecture Diagram

```
+-------------------------------------------------------+
|                    Frontend (apps/web)                 |
|  React 19 + Vite 8 + Tailwind 4 + Zustand + Router   |
+-------------------------------------------------------+
                         | HTTP/JSON
                         v
+-------------------------------------------------------+
|                    Backend (apps/api)                  |
+-------------------------------------------------------+
| Infrastructure Layer                                  |
|  Express Server, Middleware (Auth, Rate Limit, i18n)  |
+-------------------------------------------------------+
| Adapters Layer                                        |
|  Controllers (13 route groups)                        |
|  Repositories (PrismaTripRepository)                  |
|  Services (Claude, Ollama, Weather, Geocoding, QR)    |
+-------------------------------------------------------+
| Use Cases Layer                                       |
|  BuildItinerary, TriggerDisruptionShield,             |
|  ScanExpenseReceipt, GeneratePackingList,             |
|  GenerateDocChecklist, GetLawNudges                   |
+-------------------------------------------------------+
| Domain Layer                                          |
|  Entities (User, Trip, Flight, Hotel, Cab, etc.)      |
|  Interfaces (ITripRepository, IItineraryService, etc.)|
+-------------------------------------------------------+
| Agents Layer                                          |
|  BaseAgent, SearchAgent, BookingAgent, ClawbotAgent,  |
|  DisruptionCoordinator, LiveSuggestionAgent,          |
|  SmartPackingAgent, ContextAnalyzerAgent              |
+-------------------------------------------------------+
                         |
                         v
+------------------+  +------------------+  +-----------+
| SQLite (Prisma)  |  | Anthropic Claude |  | Ollama    |
| Local Database   |  | API (Remote)     |  | (Local)   |
+------------------+  +------------------+  +-----------+
         |
         v
+------------------+  +------------------+
| Open-Meteo API   |  | Nominatim API    |
| (Weather)        |  | (Geocoding)      |
+------------------+  +------------------+
```

## Component Descriptions

### Infrastructure Layer
- **Purpose**: Server bootstrap, configuration, middleware pipeline
- **Responsibilities**: Express server setup, CORS, Helmet security headers, rate limiting, JWT authentication, i18n language detection
- **Dependencies**: Express, jsonwebtoken, bcryptjs, helmet, express-rate-limit
- **Type**: Infrastructure

### Adapters - Controllers
- **Purpose**: HTTP request/response handling, input validation, route definitions
- **Responsibilities**: 13 controller files mapping to API routes, Zod schema validation, error responses
- **Dependencies**: Express Router, Zod, Use Cases, Infrastructure middleware
- **Type**: Application

### Adapters - Repositories
- **Purpose**: Data persistence abstraction
- **Responsibilities**: Prisma-based CRUD operations for all entities
- **Dependencies**: Prisma Client, Domain Interfaces
- **Type**: Application

### Adapters - Services
- **Purpose**: External service integrations
- **Responsibilities**: AI generation (Claude, Ollama), weather data, geocoding, QR codes
- **Dependencies**: External APIs (Anthropic, Open-Meteo, Nominatim), Domain Interfaces
- **Type**: Application

### Use Cases
- **Purpose**: Business logic orchestration
- **Responsibilities**: Coordinate domain logic, call repositories and services
- **Dependencies**: Domain Interfaces, Domain Entities
- **Type**: Application

### Domain Layer
- **Purpose**: Core business rules and contracts
- **Responsibilities**: Entity type definitions, repository/service interface contracts
- **Dependencies**: None (innermost layer)
- **Type**: Domain

### Agents Layer
- **Purpose**: AI agent system for intelligent features
- **Responsibilities**: Multi-agent coordination for disruption handling, smart packing, live suggestions
- **Dependencies**: External AI services (Ollama, Anthropic)
- **Type**: Application

## Data Flow

### Trip Creation and Itinerary Generation
```
User -> Frontend -> POST /api/trips (create trip)
User -> Frontend -> POST /api/itinerary/build
  -> BuildItinerary use case
    -> GeocodingService (get coordinates)
    -> WeatherService (get forecast)
    -> ClaudeItineraryService (AI generation)
      -> Fallback: OllamaItineraryService
      -> Fallback: fallbackItineraries.json
    -> PrismaTripRepository (save days)
  -> Response with full itinerary plan
```

### Disruption Shield Flow
```
User -> POST /api/disruption/trigger
  -> TriggerDisruptionShield use case
    -> Load trip, flight, user, hotel, cab context
    -> MockFlightService.findAlternatives() (scored ranking)
    -> Update hotel check-in time
    -> Update cab pickup time
    -> ClaudeItineraryService.generateItinerary() (rebuild)
    -> QRCodeService.generate() (payment confirmation)
  -> Response with resolution + QR token
User -> POST /api/disruption/confirm/:token (pay and confirm)
```

## Integration Points

### External APIs
- **Anthropic Claude API**: AI itinerary generation, Clawbot messages (primary AI backend)
- **Open-Meteo API**: Weather forecast data (free, no API key required)
- **Nominatim/OpenStreetMap**: Geocoding and address autocomplete
- **Google Translate / MyMemory / LibreTranslate**: Translation with fallback chain

### Databases
- **SQLite** (via Prisma ORM): All persistent data storage (users, trips, bookings, expenses, itineraries)

### Third-party Libraries
- **qrcode**: QR code generation for disruption confirmation tokens
- **i18next**: Internationalization (5 languages: en, hi, es, fr, ja)
- **Leaflet/react-leaflet**: Map rendering in frontend
- **recharts**: Data visualization (expense charts)

## Infrastructure Components

### Deployment Model
- **Current**: Local development setup (SQLite file-based DB, localhost servers)
- **Backend**: Node.js server on port 3001
- **Frontend**: Vite dev server on port 5173 (production: static build)
- **No cloud infrastructure**: No CDK/CloudFormation/Terraform detected
- **No CI/CD pipeline**: No GitHub Actions or similar detected
