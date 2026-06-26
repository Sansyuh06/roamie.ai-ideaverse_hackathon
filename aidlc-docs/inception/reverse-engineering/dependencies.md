# Dependencies

## Internal Dependencies

```
+------------------+          +------------------+
|    apps/web      |  HTTP    |    apps/api      |
|  (React SPA)     |--------->|  (Express API)   |
+------------------+          +------------------+
                                       |
                                       v
                              +------------------+
                              |  SQLite (Prisma) |
                              +------------------+
```

### apps/web depends on apps/api
- **Type**: Runtime (HTTP API calls via Axios)
- **Reason**: Frontend consumes all backend REST endpoints for data and AI features

### apps/api depends on SQLite
- **Type**: Runtime (Prisma Client)
- **Reason**: All persistent storage (users, trips, bookings, expenses, itineraries)

## External Dependencies

### Backend (apps/api)

| Dependency | Version | Purpose | License |
|---|---|---|---|
| @prisma/client | ^5.22.0 | Database ORM | Apache-2.0 |
| bcryptjs | ^2.4.3 | Password hashing | MIT |
| cors | ^2.8.5 | Cross-origin requests | MIT |
| dotenv | ^17.3.1 | Environment variables | BSD-2 |
| express | ^4.21.0 | Web framework | MIT |
| express-rate-limit | ^7.4.0 | API rate limiting | MIT |
| helmet | ^8.0.0 | Security headers | MIT |
| i18next | ^23.16.0 | Internationalization | MIT |
| jsonwebtoken | ^9.0.2 | JWT authentication | MIT |
| qrcode | ^1.5.4 | QR code generation | MIT |
| uuid | ^10.0.0 | UUID generation | MIT |
| zod | ^3.23.8 | Input validation | MIT |

### Frontend (apps/web)

| Dependency | Version | Purpose | License |
|---|---|---|---|
| react | ^19.2.4 | UI library | MIT |
| react-dom | ^19.2.4 | React DOM rendering | MIT |
| react-router-dom | ^7.13.1 | Client routing | MIT |
| axios | ^1.13.6 | HTTP client | MIT |
| zustand | ^5.0.12 | State management | MIT |
| tailwindcss | ^4.2.2 | CSS framework | MIT |
| framer-motion | ^12.38.0 | Animations | MIT |
| recharts | ^3.8.0 | Charts | MIT |
| leaflet | ^1.9.4 | Maps | BSD-2 |
| react-leaflet | ^5.0.0 | React map wrapper | MIT |
| lucide-react | ^0.577.0 | Icons | ISC |
| i18next | ^25.8.18 | Internationalization | MIT |
| react-i18next | ^16.5.8 | React i18n wrapper | MIT |
| qrcode | ^1.5.4 | QR code generation | MIT |
| world-countries | ^5.1.0 | Country data | MIT |

## Dependency Concerns

1. **Version ranges (^)**: All dependencies use caret ranges which could introduce breaking changes on major updates
2. **No lock file at root**: Only individual `package-lock.json` files in each app
3. **Duplicate dependencies**: `i18next` and `qrcode` exist in both apps with different versions
4. **@types/leaflet in dependencies**: Should be in devDependencies (frontend)
