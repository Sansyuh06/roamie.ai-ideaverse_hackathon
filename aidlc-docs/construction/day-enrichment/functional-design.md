# Functional Design — Per-Day Itinerary Enrichment

**Feature ID:** day-enrichment
**Phase:** Construction → Functional Design
**Maps to:** requirements/day-enrichment-requirements.md

## 1. Component Overview

```
/api/itinerary/build
        │
        ▼
BuildItinerary (use-case)
        │  for each day (concurrent):
        ├─ pick weather snapshot (from Open-Meteo via WeatherService)
        ├─ DayEnrichmentService.generateSummary()  ── LLMAdapter.invoke()  (Bedrock Claude)
        └─ DayEnrichmentService.generateImage()     ── LLMAdapter.generateImage() (Bedrock Nova Canvas → Titan)
        │
        ▼
PrismaTripRepository.upsertItineraryDay({ ..., weather, summary, imageUrl })
        │
        ▼
ItineraryDay row (SQLite)  →  /api/trips/:id  →  MyItinerary day card
```

## 2. Data Model Changes

`ItineraryDay` gains three nullable columns (additive, backward compatible):

| Column | Type | Meaning |
|--------|------|---------|
| `weather` | `String?` | JSON snapshot: `{ date, tempMax, tempMin, precipitationProbability, weatherCode, description }` |
| `summary` | `String?` | AI narrative (2–4 sentences) |
| `imageUrl` | `String?` | `data:image/png;base64,...` self-contained image |

Migration: `add_day_enrichment`.

## 3. New / Changed Code

### 3.1 LLMAdapter.generateImage(prompt): Promise<string | null>
- Calls Bedrock `InvokeModel` on `amazon.nova-canvas-v1:0` (TEXT_IMAGE, 1 image, 768×512, quality "standard").
- On failure, retries with `amazon.titan-image-generator-v2:0`.
- Returns a `data:image/png;base64,...` URL, or `null` on total failure (never throws).

### 3.2 DayEnrichmentService (new adapter service)
- `generateSummary({ destination, dayNumber, dateLabel, events, weather }): Promise<string>`
  - Builds a concise prompt; calls `LLMAdapter.invoke` (low token budget, temp ~0.8).
  - Returns trimmed text; on failure returns a deterministic non-AI one-liner from the
    day's first/last activity (so the card is never empty) — flagged in logs.
- `generateImagePrompt({ destination, dayNumber, events, weather })` → builds a vivid,
  safe, photography-style prompt (destination landmark + day theme + weather mood).
- `enrichDay(...)` → runs summary + image concurrently, returns `{ summary, imageUrl }`.

### 3.3 BuildItinerary integration
- After plan generation + travel enrichment, map each plan day to its weather snapshot
  (match by date; fall back to index).
- `Promise.all` over days calling `DayEnrichmentService.enrichDay`.
- Pass `weather`, `summary`, `imageUrl` into `upsertItineraryDay`.
- Wrapped so any enrichment error degrades gracefully (day still saved with events).

### 3.4 Repository
- Extend `ITripRepository.upsertItineraryDay` signature + Prisma impl + `mapItineraryDay`
  to carry `weather`, `summary`, `imageUrl`.

### 3.5 Trip read API
- In `trip.controller.ts` list + single endpoints, parse `weather` via `safeParseJSON`
  and pass `summary` / `imageUrl` through.

### 3.6 Frontend (MyItinerary.tsx)
- Day timeline node carries `weather`, `summary`, `imageUrl` in `details`.
- Day card renders (when present):
  - hero image (rounded, object-cover banner)
  - weather chip: `🌤 {description} · {tempMin}–{tempMax}°C · {rain}% rain`
  - narrative summary paragraph.

## 4. Failure & Degradation Matrix

| Failure | Behaviour |
|---------|-----------|
| Weather API down | No weather chip; summary/image still generated; build succeeds. |
| Summary LLM fails | Deterministic fallback one-liner from events; logged. |
| Image model fails | `imageUrl = null`; card shows weather + summary only. |
| All enrichment fails | Day saved with events exactly as today (full backward compatibility). |

## 5. Verification

- `tsc --noEmit` clean.
- `prisma migrate dev` applies `add_day_enrichment`.
- Build a trip → confirm each day row has weather/summary/imageUrl populated.
- Frontend renders image + weather + summary on each day card.
