# Code Structure

## Build System
- **Type**: npm (monorepo with `concurrently` for parallel dev servers)
- **Root**: `package.json` — orchestrates both apps via `npm run dev`
- **Backend build**: `tsc` (TypeScript compiler)
- **Frontend build**: `tsc -b && vite build`
- **Dev servers**: `ts-node-dev` (API) + `vite` (Web)

## Key Modules

### Backend (apps/api/src/)

```
src/
+-- index.ts                    # Entry point, demo user seeding, server start
+-- seed.ts                     # Database seeding script
+-- infrastructure/
|   +-- config.ts               # Zod-validated environment config
|   +-- database.ts             # Prisma client singleton
|   +-- server.ts               # Express app factory with all middleware + routes
|   +-- middleware/
|       +-- auth.ts             # JWT auth middleware + optional auth
|       +-- rateLimiter.ts      # Rate limiting rules
|       +-- i18n.ts             # Language detection middleware
+-- domain/
|   +-- entities/index.ts       # All TypeScript interfaces for domain objects
|   +-- interfaces/index.ts     # Repository + service interface contracts
+-- use-cases/
|   +-- BuildItinerary.ts       # AI itinerary generation orchestrator
|   +-- TriggerDisruptionShield.ts  # Multi-step disruption recovery
|   +-- ScanExpenseReceipt.ts   # Receipt text parsing (regex-based)
|   +-- GeneratePackingList.ts  # Template-based packing list
|   +-- GenerateDocChecklist.ts # Document/visa checklist
|   +-- GetLawNudges.ts         # Destination law/cultural tips
+-- adapters/
|   +-- controllers/            # 13 Express router controllers
|   +-- repositories/
|   |   +-- PrismaTripRepository.ts  # All Prisma DB operations
|   +-- services/
|       +-- ClaudeItineraryService.ts    # Anthropic Claude AI
|       +-- OllamaItineraryService.ts    # Local Ollama LLM
|       +-- MockFlightService.ts         # Mock flight data + scoring
|       +-- MockPlacesService.ts         # Mock places/suggestions
|       +-- FlightMonitorService.ts      # Flight status monitoring
|       +-- WeatherService.ts            # Open-Meteo weather API
|       +-- GeocodingService.ts          # Nominatim geocoding
|       +-- QRCodeService.ts             # QR code generation
|       +-- RealFlightService.ts         # Real flight API (placeholder)
+-- agents/
|   +-- BaseAgent.ts            # Abstract base with name/description
|   +-- SearchAgent.ts          # Finds alternative flights
|   +-- BookingAgent.ts         # Selects cheapest flight
|   +-- ClawbotAgent.ts         # Conversational notifications
|   +-- DisruptionCoordinator.ts # Multi-agent orchestrator
|   +-- LiveSuggestionAgent.ts  # Real-time suggestions
|   +-- SmartPackingAgent.ts    # AI packing list generation
|   +-- ContextAnalyzerAgent.ts # Context analysis
+-- data/
    +-- docChecklists.json      # Visa/document data by country
    +-- fallbackItineraries.json # Static itinerary templates
    +-- flights.json            # Mock flight data
    +-- lawNudges.json          # Legal/cultural tips by country
    +-- packingTemplates.json   # Packing list templates
    +-- places.json             # Mock places/POI data
```

### Frontend (apps/web/src/)

```
src/
+-- App.tsx                     # Root component with routing + sidebar
+-- main.tsx                    # React entry point
+-- lib/
|   +-- api.ts                  # Axios instance with JWT interceptor
|   +-- i18n.ts                 # i18next configuration
+-- stores/
|   +-- useStore.ts             # Zustand global state store
+-- pages/
|   +-- Landing.tsx             # Public landing page
|   +-- Dashboard.tsx           # Trip overview + creation
|   +-- MyItinerary.tsx         # Day-by-day itinerary view
|   +-- Disruption.tsx          # Disruption shield UI
|   +-- Expenses.tsx            # Expense tracking + charts
|   +-- PackingChecklist.tsx    # Packing list UI
|   +-- LeaveFeedback.tsx       # Public feedback form
|   +-- AdminFeedback.tsx       # Admin feedback management
|   +-- Onboarding.tsx          # User onboarding flow
|   +-- Payment.tsx             # Disruption payment confirmation
+-- components/
    +-- VoiceTranslateWidget.tsx # Translation widget
    +-- OpenClawCart.tsx         # Booking cart component
    +-- TravelChatbotV2.tsx     # AI chatbot interface
    +-- ChatInputBar.tsx        # Chat input component
    +-- ItineraryTimeline.tsx   # Timeline visualization
    +-- CloverGrid.tsx          # Grid layout component
    +-- SplitPanelLayout.tsx    # Split panel layout
    +-- TripCard.tsx            # Trip card component
    +-- StatCard.tsx            # Statistics card
```

## Design Patterns

### Clean Architecture / Hexagonal Architecture
- **Location**: Entire backend structure
- **Purpose**: Decouple business logic from frameworks and external services
- **Implementation**: Domain layer has zero dependencies; use cases depend only on domain interfaces; adapters implement interfaces

### Repository Pattern
- **Location**: `PrismaTripRepository`
- **Purpose**: Abstract data access behind interface
- **Implementation**: Single repository class implementing `ITripRepository` with all Prisma operations

### Strategy Pattern (AI Fallback Chain)
- **Location**: All AI services (ClaudeItineraryService, SmartPackingAgent, etc.)
- **Purpose**: Graceful degradation when AI services are unavailable
- **Implementation**: Try Claude → Try Ollama → Use rule-based/template fallback

### Multi-Agent Coordination
- **Location**: `DisruptionCoordinator`, agents directory
- **Purpose**: Complex workflow decomposition into specialized agents
- **Implementation**: Coordinator orchestrates SearchAgent → BookingAgent → ClawbotAgent

### Observer/Progress Pattern
- **Location**: `TriggerDisruptionShield`
- **Purpose**: Real-time step progress reporting
- **Implementation**: `onProgress` callback with `DisruptionStep` status updates

## Critical Dependencies

### @prisma/client (^5.22.0)
- **Usage**: All database operations via generated type-safe client
- **Purpose**: ORM for SQLite with type safety and migrations

### express (^4.21.0)
- **Usage**: HTTP server, routing, middleware pipeline
- **Purpose**: Web framework for REST API

### jsonwebtoken (^9.0.2)
- **Usage**: Authentication tokens (access + refresh)
- **Purpose**: Stateless session management

### zod (^3.23.8)
- **Usage**: Request body validation in every controller
- **Purpose**: Runtime type validation with TypeScript inference

### zustand (^5.0.12)
- **Usage**: Frontend global state management
- **Purpose**: Lightweight reactive store for React

### react-router-dom (^7.13.1)
- **Usage**: Client-side routing for SPA
- **Purpose**: Page navigation without full page reloads
