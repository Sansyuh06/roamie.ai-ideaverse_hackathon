# Roamie Pro — AI Travel Companion

Full-stack AI-powered travel companion with intelligent itinerary planning, real-time disruption handling, receipt OCR, packing list generation, and multi-language translation.

## Architecture

```
┌─────────────────────────────────────────────┐
│              Frontend (React 19)             │
│  Vite + Tailwind 4 + Framer Motion + Zustand│
└──────────────────────┬──────────────────────┘
                       │ HTTP/JSON
                       ▼
┌─────────────────────────────────────────────┐
│              Backend (Express + TS)          │
├─────────────────────────────────────────────┤
│  LLM Adapter (Bedrock → Ollama fallback)    │
│  Controllers → Use Cases → Domain           │
│  Prisma ORM → SQLite/PostgreSQL             │
└──────────┬────────────────┬─────────────────┘
           │                │
           ▼                ▼
┌────────────────┐  ┌────────────────┐
│ AWS Bedrock    │  │ Ollama (local) │
│ Sonnet 4.6    │  │ mistral:latest │
│ Haiku 4.5     │  │                │
│ Titan Embed   │  │                │
└────────────────┘  └────────────────┘
```

## Features

| Feature | Description |
|---------|-------------|
| Animated Landing | Gradient mesh, floating emojis, word-by-word hero |
| Onboarding Chatbot | 6-question interactive flow with smooth transitions |
| AI Itinerary Generation | Budget-aware, uses real places, breathing room blocks |
| Drag-and-Drop Itinerary | Reorder plans, real-time budget meter |
| Disruption Shield | OpenClaw agent finds alternatives within budget |
| Receipt OCR | Bedrock vision extracts amount/merchant/category |
| Packing List | AI-generated based on destination/trip type |
| Safety Alerts | Destination-specific advisories |
| Translator | 50+ languages, voice input, text-to-speech |
| Memory Substrate | 3-tier memory (Atoms → Patterns → Principles) |

## LLM Fallback Chain

1. **AWS Bedrock Claude Sonnet 4.6** (primary)
2. **AWS Bedrock Claude Haiku 4.5** (if Sonnet fails)
3. **Ollama mistral:latest** (fully offline, local)

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install
cd apps/api && npm install
cd ../web && npm install
cd ../..

# 2. Configure environment
cp .env.example apps/api/.env
# Edit apps/api/.env with your settings

# 3. Run database migration
cd apps/api && npx prisma migrate dev

# 4. Start dev servers
npm run dev
# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

## Docker Compose (Production-like)

```bash
docker compose up -d
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
# PostgreSQL: localhost:5432
# Ollama: localhost:11434
```

## AWS Hackathon Setup

```bash
# Already provisioned:
# - AWS Account: 830215490915
# - Region: us-east-1
# - Bedrock: Full access (100+ models)
# - S3 Bucket: amazon-q-rules-87a5e787-3b12-4f36-be27-7dffbed3f932
# - EC2: t4g.medium at 3.238.135.50

# Test Bedrock:
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-sonnet-4-6 \
  --region us-east-1 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":50,"messages":[{"role":"user","content":"Say OK"}]}'
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, Framer Motion, Zustand |
| Backend | Express, TypeScript, Prisma |
| Database | SQLite (dev) / PostgreSQL 16 (prod) |
| AI | AWS Bedrock (Claude Sonnet 4.6, Haiku 4.5, Titan Embeddings) |
| Fallback AI | Ollama (mistral:latest) |
| Storage | AWS S3 |
| Infra | Docker, docker-compose |

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/itinerary/v2/generate | Generate AI itinerary from onboarding answers |
| POST | /api/disruption/v2/simulate | Simulate flight disruption + get alternatives |
| POST | /api/receipt/scan | OCR receipt via Bedrock vision |
| POST | /api/packing/v2/generate | Generate AI packing list |
| GET | /api/safety/:destination | Get safety alerts for destination |
| POST | /api/translate/v2 | Translate text |
| POST | /api/memory/remember | Store memory atom |
| POST | /api/memory/recall | Recall similar memories |

## Cost

| Service | Cost |
|---------|------|
| Bedrock Claude Sonnet 4.6 | $0 (hackathon) |
| Bedrock Claude Haiku 4.5 | $0 (hackathon) |
| Ollama mistral:latest | $0 (local) |
| PostgreSQL (Docker) | $0 |
| S3 | $0 (Free Tier) |
| **TOTAL** | **$0** |

## Demo Flow

1. Open landing page → admire animations
2. Click "Start Planning" → onboarding chatbot
3. Answer 6 questions (Tokyo, Leisure, next week, 2, $3000 USD, Culture+Food)
4. Watch itinerary generate
5. Open Disruption Shield → simulate "Flight Cancelled"
6. Review 3 AI alternatives
7. Open Packing List → generate
8. Open Translator → translate "Hello" to Japanese
