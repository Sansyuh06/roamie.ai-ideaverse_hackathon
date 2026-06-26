# Technology Stack

## Programming Languages
- TypeScript 5.6 (backend) / 5.9 (frontend) — Primary language for both apps

## Frameworks

### Backend
- Express 4.21 — HTTP server and routing
- Prisma 5.22 — ORM and database migrations
- i18next 23.16 — Server-side internationalization

### Frontend
- React 19.2 — UI component library
- Vite 8.0 — Build tool and dev server
- Tailwind CSS 4.2 — Utility-first CSS framework
- React Router DOM 7.13 — Client-side routing
- Zustand 5.0 — State management
- Framer Motion 12.38 — Animations
- Recharts 3.8 — Data visualization (charts)
- React Leaflet 5.0 / Leaflet 1.9 — Interactive maps
- Axios 1.13 — HTTP client

## AI / ML Services
- Anthropic Claude API (claude-sonnet-4-6) — Primary AI for itinerary generation, Clawbot messaging
- Ollama (local, llama3.2) — Secondary/fallback AI for suggestions, packing lists

## Database
- SQLite — File-based relational database (via Prisma)

## External APIs
- Open-Meteo — Weather forecast (free, no key required)
- Nominatim / OpenStreetMap — Geocoding and address lookup
- Google Translate / MyMemory / LibreTranslate — Translation with fallback chain

## Security
- jsonwebtoken 9.0 — JWT-based authentication
- bcryptjs 2.4 — Password hashing
- helmet 8.0 — HTTP security headers
- express-rate-limit 7.4 — API rate limiting
- zod 3.23 — Input validation

## Build Tools
- npm — Package manager
- concurrently 8.2 — Parallel script runner (monorepo)
- ts-node-dev 2.0 — TypeScript dev server with hot reload
- TypeScript Compiler (tsc) — Build step

## Testing Tools
- Jest 29.7 — Test runner
- ts-jest 29.2 — TypeScript support for Jest
- supertest 7.0 — HTTP assertion library

## Other Libraries
- qrcode 1.5 — QR code generation (both backend and frontend)
- uuid 10.0 — Unique ID generation
- lucide-react 0.577 — Icon library
- world-countries 5.1 — Country data
- i18next / react-i18next — Multi-language support (en, hi, es, fr, ja)
