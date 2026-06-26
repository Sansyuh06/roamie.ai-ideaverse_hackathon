# Business Overview

## Business Context Diagram

```
+-------------------------------------------+
|              Roamie Platform               |
|         AI Travel Companion                |
+-------------------------------------------+
|                                           |
|  +----------+   +-----------+   +------+  |
|  | Traveller|-->| Trip Mgmt |-->| AI   |  |
|  | (User)   |   | Engine    |   | Layer|  |
|  +----------+   +-----------+   +------+  |
|       |               |             |      |
|       v               v             v      |
|  +----------+   +-----------+   +------+  |
|  | Auth &   |   | Booking & |   |Ollama|  |
|  | Profile  |   | Logistics |   |Claude|  |
|  +----------+   +-----------+   +------+  |
|                                           |
+-------------------------------------------+
         |                    |
         v                    v
+----------------+   +------------------+
| External APIs  |   | Local Database   |
| (Weather,Geo,  |   | (SQLite/Prisma)  |
| Translation)   |   |                  |
+----------------+   +------------------+
```

## Business Description
- **Business Description**: Roamie is an AI-powered travel companion application that helps travelers plan, manage, and adapt their trips in real-time. It combines AI-driven itinerary generation, automated disruption handling, expense tracking, and smart contextual suggestions into a single platform.
- **Target Users**: Individual leisure and business travelers seeking intelligent trip management with minimal manual effort.

## Business Transactions

| # | Transaction | Description |
|---|---|---|
| 1 | Trip Lifecycle Management | Create, view, update, and delete trips with destination, dates, and budget |
| 2 | AI Itinerary Generation | Generate day-by-day travel plans using weather, preferences, and calendar constraints |
| 3 | Disruption Shield | Auto-detect flight cancellations/delays and orchestrate multi-step recovery (rebooking, hotel shift, cab reschedule, itinerary rebuild) |
| 4 | Expense Tracking | Scan receipt text to extract amount/currency/category, track trip expenses |
| 5 | Smart Packing | Generate weather + agenda-aware packing lists with AI enhancement |
| 6 | Live Suggestions | Real-time itinerary adjustment suggestions based on weather/gaps/crowd data |
| 7 | Booking Suggestions | AI-generated hotel and flight recommendations for a trip |
| 8 | Document Checklist | Visa, health, and document requirements based on passport country + destination |
| 9 | Translation | Multi-backend phrase translation for travelers |
| 10 | User Authentication | Registration, login, JWT-based session with token refresh |

## Business Dictionary

| Term | Meaning |
|---|---|
| Trip | A planned journey with destination, dates, bookings, and itinerary |
| Itinerary Day | A single day's schedule of events within a trip |
| Disruption Shield | Automated multi-step flight disruption recovery system |
| Clawbot | User-facing conversational agent that delivers disruption notifications |
| OpenClaw Cart | Shopping cart for booking suggestions (hotels/flights) |
| Law Nudges | Country-specific legal/cultural tips for travelers |
| Free Gap | Unscheduled time between itinerary events |
| Breathing Room | Intentional break events inserted for traveler well-being |
| Energy Level | User preference (high/medium/low) affecting itinerary intensity |

## Component Level Business Descriptions

### apps/api (Backend API)
- **Purpose**: Serves all business logic, AI orchestration, and data persistence for the travel platform
- **Responsibilities**: Authentication, trip management, AI itinerary generation, disruption recovery, expense processing, packing lists, booking suggestions, translation, geocoding

### apps/web (Frontend SPA)
- **Purpose**: Single-page React application providing the user interface for all travel management features
- **Responsibilities**: Dashboard with trip overview, itinerary timeline view, disruption monitoring, expense management, packing checklist, feedback collection, multi-language support
