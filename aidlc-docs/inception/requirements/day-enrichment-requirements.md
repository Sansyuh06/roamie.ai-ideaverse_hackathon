# Requirements — Per-Day Itinerary Enrichment

**Feature ID:** day-enrichment
**Phase:** Inception → Requirements Analysis (Standard depth)
**Type:** Brownfield feature addition (TypeScript monorepo, Clean Architecture)

## 1. Intent Analysis

The user wants each day in the itinerary to feel like a polished, magazine-quality
day plan. For every itinerary day the product must show:

1. **Weather for that day** — real forecast (already sourced from Open-Meteo) shown
   inline on the day card (temp range, conditions, rain probability).
2. **"How the day looks"** — a short, human, AI-written narrative that sets the vibe
   of the day and tells the traveller what to do and what to expect.
3. **An AI-generated hero image** — a destination/day-themed image rendered by an
   AWS Bedrock image model, embedded in the day description.

Quality bar: "professional / $100M product". No fabricated/random data — weather is
real, narrative + image are genuinely AI-generated.

## 2. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | Each `ItineraryDay` persists a weather snapshot for its date (real Open-Meteo data). |
| FR-2 | Each `ItineraryDay` persists an AI-generated narrative summary (2–4 sentences, weather-aware, English). |
| FR-3 | Each `ItineraryDay` persists an AI-generated hero image themed to the destination + that day's plan. |
| FR-4 | The itinerary build flow generates summary + image for every day during `/api/itinerary/build`. |
| FR-5 | The trip-read API returns weather (parsed), summary, and image for each day. |
| FR-6 | The frontend day card renders: hero image, weather chip, and the narrative summary. |
| FR-7 | Failures in summary/image generation must NOT break itinerary building (graceful degradation). |

## 3. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Real data only — no random/simulated weather, no stock-photo fallback that pretends to be AI. |
| NFR-2 | Image + summary generation runs concurrently across days to keep build latency within the existing 90s client timeout. |
| NFR-3 | Use free-tier AWS Bedrock models already available to the account. |
| NFR-4 | Reuse existing Clean Architecture seams (use-case + service + repository); no new frameworks. |
| NFR-5 | Image stored as a self-contained data URL so no static-file/S3 infra or CORS changes are required. |

## 4. Scope

**In scope:** ItineraryDay schema fields, a `DayEnrichmentService`, Bedrock image
generation in `LLMAdapter`, `BuildItinerary` integration, trip-read parsing, and the
`MyItinerary` day-card UI.

**Out of scope:** Re-architecting the V2 generator, per-event images, image editing,
multi-language narratives (English only for now).

## 5. Assumptions

- Open-Meteo + Nominatim remain the weather/geocoding source (already wired).
- Bedrock Nova Canvas (`amazon.nova-canvas-v1:0`) is available; Titan Image Generator
  v2 is the fallback. If both fail, the day still renders with weather + summary.
- Trip length is typically ≤ 7 days, bounding image-generation fan-out.
