# Roamie — Intelligent Operating System for Modern Travel

Roamie (TripMind) is a state-of-the-art, full-stack travel companion application designed to turn travel disruptions, cluttered itineraries, and expense tracking into a seamless, automated experience. Built with a clean architecture pattern and rich, modern aesthetics, Roamie acts as an intelligent local travel agent right in your pocket.

---

## 📌 Problem Statement

Modern travel is fragmented and stressful. Travelers today face a multitude of pain points:
1. **Inefficient Planning & Over-scheduling**: Traditional itineraries are rigid. Travelers either pack their days too tightly, leading to fatigue, or leave massive gaps with no clear idea of what local sights, food, or cultural experiences are nearby.
2. **Disruptions & Panic**: Flight cancellations, delays, and missed connections cost travelers time, money, and immense cognitive load. Scrambling to find alternative flights, updating hotel reservations, and notifying cab drivers under stress in a foreign airport is a chaotic experience.
3. **Complex Expense Auditing**: Keeping track of physical receipts, converting multiple currencies (USD, EUR, GBP, JPY, INR), and categorizing costs for post-trip budgeting is tedious and error-prone.
4. **Language Barriers & Cultural Nuances**: Navigating local customs, understanding required travel documents (visas, passports), and communicating in non-native languages often results in fine violations or missed requirements.

---

## 💡 The Solution: Roamie

Roamie solves these problems by providing an integrated, localized, intelligent travel operating system that responds dynamically to the user's journey.

* **Smart Itinerary Agent**: Auto-generates day-by-day plans, inserts "Breathing Room" blocks to prevent traveler burnout, and dynamically detects calendar gaps to suggest highly-rated local spots (using either a local LLM or robust curated datasets).
* **Disruption Shield (The Flagship Feature)**: Provides a 7-step disruption resolution in under 3 seconds. When a flight is disrupted, Roamie:
  1. Detects the issue (cancelled, delayed, or missed).
  2. Pulls and ranks alternative flights using utility scoring (combining arrival times, prices, and airline reliability).
  3. Updates downstream travel plans (hotels, cabs).
  4. Auto-charges or updates user balances.
  5. Generates local QR-code boarding passes for the new flight instantly.
* **Intelligent Expense Scanner**: Instantly extracts amount, currency, category, and description from receipt transcripts, updating dynamic budget visualization charts in real-time.
* **Local & Cultural Guardrails**: Real-time visa and document checklists, automated local law notifications (e.g., specific rules in Singapore or London), and real-time interface translation across English, Hindi, Spanish, French, and Japanese.

---

## 🛠️ Tech Stack

Roamie is engineered using a robust, modern stack split into a micro-frontend and clean API layer:

### Frontend
- **Framework & Build**: React 18, Vite, TypeScript
- **Styling & UI**: Vanilla CSS custom variables, Tailwind CSS v4, Lucide React Icons
- **State Management**: Zustand (lightweight, decoupled state containers)
- **Animations**: Framer Motion (premium micro-animations, spring-based layouts)
- **Data Visualization**: Recharts (dynamic svg-based responsive charts)
- **Internationalization (i18n)**: i18next, react-i18next (dynamic runtime locale switching)

### Backend
- **Runtime & Framework**: Node.js, Express, TypeScript
- **Database ORM**: Prisma ORM with SQLite (supporting drop-in PostgreSQL migration)
- **Local AI Engine**: Ollama (Llama 3.2 integration for on-device/local-server execution)
- **Security & Integrity**: JWT with Refresh Token rotation, Helmet, Rate Limiter middlewares, Zod Validation schemas

---

## 🏗️ Architecture & How It's Built

Roamie is built following **Clean Architecture (Hexagonal / Ports & Adapters)** principles. This keeps the core business logic completely separated from external frameworks, databases, and third-party APIs.

### Backend Structure
```
apps/api/src/
├── domain/                  # CORE: Pure enterprise models & definitions
│   ├── entities.ts          # Rich TS models (User, Trip, ItineraryDay, etc.)
│   └── interfaces.ts        # Ports: Repository & service contracts
├── use-cases/               # USE CASES: Orchestration of business rules
│   ├── BuildItinerary.ts    # Logic for stitching flights, hotels, and spots
│   ├── TriggerDisruption.ts # Flagship disruption scoring & alternative ranking
│   └── ScanExpenseReceipt.ts# Receipt extraction logic (LLM / fallback)
├── adapters/                # ADAPTERS: Translating inputs/outputs
│   ├── controllers/         # Express Router routes (checks input shapes via Zod)
│   ├── services/            # Client implementations (Weather, Geocoding, Claude/Ollama LLM)
│   └── repositories/        # Database Access (Prisma SQLite Repository)
└── infrastructure/          # CONFIG & BOOT: Setup Express server, JWT, CORS, database connection
```

### Key Architectural Decisions
1. **Separation of Concerns**: If we decide to swap SQLite for MongoDB or PostgreSQL, we only write a new repository class that implements the `ITripRepository` port. The controllers and use-cases remain completely untouched.
2. **LLM Resilience**: Ollama is configured for local LLM completion (itinerary creation, expense scanning). However, network failures or slow systems are common during travel. To resolve this, every use-case has a **regex/deterministic fallback handler** that ensures the system operates immediately and flawlessly even if the AI engine is offline.
3. **Utility-Scored Disruption Resolution**: The Disruption Shield calculates a utility score for each replacement flight option:
   $$\text{Score} = w_1 \cdot \text{NormalizedPrice} + w_2 \cdot \text{NormalizedDelay} - w_3 \cdot \text{DisloyaltyPenalty}$$
   This ensures that the app recommends options that best align with user preferences (e.g., favoring the current airline alliance or early arrivals).

---

## ✨ Micro-Interactions & UX Impacts

Every interface element in Roamie is built to offer a premium, state-of-the-art interactive experience:

* **Glassmorphism & Color Systems**: Curated color palettes with HSL variables (`--color-brand-purple`, `--color-brand-amber`, `--color-bg-cream`) provide a modern, warm, and highly professional layout.
* **Dynamic Spring-Based Transitions**: Modals, slide-overs, and disruption cards animate using custom Bezier curves (`ease: [0.4, 0, 0.2, 1]`) and Framer Motion spring layouts, ensuring interactions feel fluid rather than abrupt.
* **Interactive Disruption Resolution Steps**: When a flight cancellation is simulated, the user sees a real-time progress sequence checking alternative seats, reserving slots, notifying cab services, and calculating price differences step-by-step to build trust.
* **Donut Chart Repaint**: As new receipts are scanned, the expense categories animate their proportions smoothly, making budget tracking visually rewarding.

---

## 🚀 Setup & Launch Instructions

### Prerequisites
- **Node.js** 18 or higher installed on your computer.
- **npm** (comes with Node.js).

### Step 1: Clone and Install Dependencies
From the repository root directory, run:
```bash
npm install
cd apps/api && npm install
cd ../web && npm install
```

### Step 2: Initialize Database and Schema
Generate the Prisma Client and seed the database with demo accounts, cities, places, and mock flights:
```bash
cd apps/api
npm run prisma:generate
npx prisma db push
npm run seed
```

### Step 3: Run the Application
Start both the backend API and frontend React application concurrently from the root directory:
```bash
cd ../../
npm run dev
```

* **Frontend Dashboard**: `http://localhost:5173`
* **API Server**: `http://localhost:3001`

### 🔑 Demo Login Credentials
- **Email**: `demo@roamie.app`
- **Password**: `password123`
