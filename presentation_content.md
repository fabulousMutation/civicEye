# CivicEye — AI-Powered Civic Reporting PWA
## Presentation Content Guide

---

## 1. Title & Introduction

**Project Title:** CivicEye — AI-Powered Civic Reporting Progressive Web App

**Tagline:** *"Report Issues. Drive Change."*

**Brief Introduction:**
CivicEye is an AI-powered Progressive Web App (PWA) that empowers citizens to report civic issues — potholes, illegal dumping, broken streetlights, vandalism — by simply taking a photo. The app uses Vision AI to automatically classify the issue, assess its severity, geo-tag the location, and route it to the correct municipal authority via automated email notification.

---

## 2. Problem Statement

- **Citizen disconnect:** Citizens witness civic problems daily (road damage, garbage, broken infrastructure) but lack an easy, effective channel to report them.
- **Manual bureaucracy:** Traditional complaint systems require citizens to identify the correct department, fill lengthy forms, and follow up manually — most people give up.
- **Delayed response:** Without structured, prioritized data, municipal authorities struggle to triage and respond to issues efficiently.
- **Accountability gap:** There is no transparent tracking system for citizens to verify that their complaints were received and acted upon.

**Why it matters:** Urban civic infrastructure deteriorates when citizen feedback loops are broken. CivicEye bridges this gap by automating the entire reporting pipeline with AI.

---

## 3. Objectives

1. **Simplify civic reporting** to a single photo capture — no forms, no department selection, no manual typing.
2. **Automate classification and severity assessment** using AI Vision models to eliminate human bottlenecks.
3. **Auto-route reports to the correct authority** by combining reverse geocoding with web search to find the relevant municipal department and contact.
4. **Provide transparent tracking** with unique Tracking IDs, live status updates, and a user dashboard.

---

## 4. Methodology / Approach

### End-to-End Pipeline (How It Works)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  1. CAPTURE   │ ──► │  2. UPLOAD    │ ──► │  3. AI CLASSIFY   │ ──► │ 4. AUTHORITY     │ ──► │ 5. TRACK & SEND  │
│  Photo + GPS  │     │  Supabase     │     │  OpenRouter       │     │    SEARCH         │     │  Dashboard       │
│  (Browser API)│     │  Storage      │     │  Vision AI        │     │    Tavily/Geocode │     │  Email via Resend│
└──────────────┘     └──────────────┘     └──────────────────┘     └─────────────────┘     └──────────────────┘
```

### Step-by-Step Breakdown:

| Step | Action | Technology |
|------|--------|------------|
| **1. Capture** | User opens the camera (or uploads a photo) and tags GPS location | Browser MediaDevices API, Geolocation API |
| **2. Upload** | Image is uploaded to cloud storage and a public URL is generated | Supabase Storage (`images` bucket) |
| **3. AI Gatekeeper + Classification** | Image is sent to a Vision AI model via API. The AI first validates if it's a real civic issue (rejecting selfies, screenshots, memes). If valid, it classifies the issue type, assigns priority (High/Medium/Low), generates tags, and writes a professional summary. | OpenRouter API → Vision AI Model (auto-routed) |
| **4. Reverse Geocoding + Authority Search** | GPS coordinates are reverse-geocoded to a human-readable address. A web search finds the correct local government department's contact info (email, phone). | Google Maps Geocoding API / OpenStreetMap Nominatim (fallback), Tavily Search API |
| **5. Database Persist** | The full report (image, classification, location, authority contact, tracking ID) is saved to the database. | Supabase PostgreSQL (`reports` table) |
| **6. User Review & Send** | User reviews the AI-generated summary in a Draft Editor, can edit it, attach additional evidence photos, and manually trigger the email notification to authorities. | React Client Components, Supabase Storage (`evidence` bucket) |
| **7. Authority Notification** | A formatted HTML email with the report, evidence images, priority badge, and tracking ID is sent to the identified authority. | Resend Email SDK |
| **8. Track** | User can track report status via a unique Tracking ID (`CR-YYYY-XXXXXX`) on a detail page with live status indicators. | Next.js Server Components, Supabase real-time queries |

---

## 5. Data / Tools Used

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework with server components, API routes, and SSR |
| **Language** | TypeScript | Type-safe development across frontend and backend |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS with custom design system (CSS variables for theming) |
| **UI Icons** | Lucide React | Consistent, modern iconography across all components |
| **PWA** | `@ducanh2912/next-pwa` | Service worker, offline support, installable app experience with manifest |
| **Database** | Supabase (PostgreSQL) | Cloud-hosted PostgreSQL for `reports` and `profiles` tables |
| **Authentication** | Supabase Auth | Email/password sign-up, Magic Link (OTP) login, session middleware |
| **File Storage** | Supabase Storage | Three buckets: `images` (report photos), `evidence` (additional photos), `avatars` (profile pics) |
| **AI / Vision** | OpenRouter API | Routes to best available Vision AI model for image classification |
| **Geocoding** | Google Maps Geocoding API + OpenStreetMap Nominatim (fallback) | Converts GPS lat/lng to human-readable addresses |
| **Authority Search** | Tavily Search API | Web search to find correct municipal department contact info |
| **Email** | Resend SDK | Transactional email delivery to authorities with HTML templates |
| **Deployment** | Vercel | Production hosting with edge functions and automatic CI/CD |
| **Version Control** | Git | Source code management |

### Key Browser APIs Used

| API | Purpose |
|-----|---------|
| `navigator.mediaDevices.getUserMedia()` | Access device camera (rear-facing) for live photo capture |
| `navigator.geolocation.getCurrentPosition()` | Capture precise GPS coordinates of the civic issue |
| `navigator.clipboard.writeText()` | Copy report details to clipboard for sharing |
| `HTMLCanvasElement.toBlob()` | Convert camera video frame to JPEG image file |
| Web App Manifest + Service Worker | PWA installability, offline caching |

### External APIs & Services

| Service | Endpoint / SDK | Use Case |
|---------|---------------|----------|
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | Vision AI classification with structured JSON output |
| Google Maps | `https://maps.googleapis.com/maps/api/geocode/json` | Primary reverse geocoding |
| Nominatim (OSM) | `https://nominatim.openstreetmap.org/reverse` | Fallback reverse geocoding (free, no API key) |
| Tavily | `https://api.tavily.com/search` | Advanced web search to scrape authority contact info |
| Resend | Node SDK (`resend.emails.send()`) | HTML email delivery to municipal departments |
| Supabase | `@supabase/supabase-js`, `@supabase/ssr` | DB, Auth, Storage (server + client side) |

---

## 6. Analysis / Process (What We Actually Built)

### Application Architecture

```
webapp/
├── public/
│   ├── manifest.json          # PWA manifest (standalone, portrait)
│   ├── sw.js                  # Auto-generated service worker
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── page.tsx           # Home — Landing (logged out) / Dashboard (logged in)
│   │   ├── layout.tsx         # Root layout with Nav, fonts, metadata
│   │   ├── globals.css        # Design system (CSS variables, light/dark theme)
│   │   ├── (auth)/
│   │   │   ├── login/         # Login page
│   │   │   └── register/      # Registration page
│   │   ├── auth/callback/     # Supabase OAuth/Magic Link callback handler
│   │   ├── report/            # Report submission page (camera → AI → result)
│   │   ├── track/[id]/        # Dynamic tracking page per report
│   │   ├── profile/           # User profile + report history dashboard
│   │   └── api/
│   │       ├── classify/      # POST: AI classification pipeline
│   │       └── authority/     # POST: Authority search + email notification
│   ├── components/
│   │   ├── MediaCapture.tsx   # Camera/upload + GPS tagging interface
│   │   ├── AuthLoginForm.tsx  # Login form (password + magic link + rate-limit handling)
│   │   ├── AuthRegisterForm.tsx # Registration form
│   │   ├── ProfileDashboard.tsx # Profile editing + report history
│   │   ├── DraftEditor.tsx    # Editable report summary + evidence upload + send
│   │   ├── Nav.tsx            # Global navigation bar (auth-aware)
│   │   ├── ShareDirect.tsx    # Native SMS/Email sharing
│   │   └── CopyDetails.tsx    # Clipboard copy utility
│   ├── lib/
│   │   ├── supabaseClient.ts  # Browser-side Supabase client
│   │   └── supabase/
│   │       ├── client.ts      # Client-side Supabase (with cookies)
│   │       ├── server.ts      # Server-side Supabase (with cookies)
│   │       └── middleware.ts   # Session refresh middleware
│   └── middleware.ts          # Next.js route middleware for auth session
└── tailwind.config.ts         # Custom theme tokens (colors, radius, etc.)
```

### Key Components Built

| Component | Type | What It Does |
|-----------|------|-------------|
| **MediaCapture** | Client Component | Full camera interface (open camera → capture frame → upload from gallery → GPS tag → upload to Supabase Storage) |
| **DraftEditor** | Client Component | Editable AI-generated summary, additional evidence photo uploads, "Send to Authority" trigger |
| **ProfileDashboard** | Client Component | Avatar upload, profile editing (name, phone), recent report history with status indicators |
| **AuthLoginForm** | Client Component | Email/password login, Magic Link (OTP), rate-limit error handling with Force Reset, friendly error mapping |
| **Nav** | Server Component | Auth-aware global navbar — shows "Sign In / Get Started" for guests, "Profile / + Report" for users |
| **ShareDirect** | Client Component | Opens native SMS and Email apps with pre-filled report details |
| **CopyDetails** | Client Component | One-click clipboard copy of formatted report details |

### AI Gatekeeper System

The AI classification has a two-step process:

1. **Gatekeeper (Validation):** Rejects invalid submissions — selfies, screenshots, memes, blank images, indoor household messes
2. **Classification (If valid):** Returns structured JSON with:
   - `issue_type` (e.g., Pothole, Garbage, Vandalism)
   - `priority` (High / Medium / Low) with strict definitions
   - `tags` (3–5 descriptive keywords)
   - `text_summary` (professional description for official reports)

### Report Status Flow

```
PENDING_REVIEW → (User reviews & sends) → AUTHORITY_NOTIFIED
                                        ↗
Invalid image → REJECTED (with rejection_title + rejection_reason)
```

---

## 7. Results / Output

### What the System Produces

- **Automatic Classification:** Every submitted photo is classified into an issue type with AI-assigned severity
- **Tracking ID:** Each report gets a unique `CR-YYYY-XXXXXX` format ID for verification
- **Authority Routing:** The correct municipal department is identified and their contact info is scraped automatically
- **Email Notifications:** Formatted HTML emails with evidence images and priority badges are sent to authorities
- **User Dashboard:** Citizens see all their reports, statuses, and can track each one in detail
- **Rejection Feedback:** Invalid submissions are clearly explained (e.g., "This appears to be a screenshot of a digital game, not a physical civic issue")

### Key Screens

| Screen | Description |
|--------|------------|
| **Landing Page** | Hero section, "How It Works" features, CTA — for unauthenticated visitors |
| **Dashboard (Home)** | List of user's reports with status dots, priority badges, and tracking IDs |
| **Report Page** | Camera interface → AI analyzing loader → Success/Rejection result card |
| **Tracking Detail** | Full report view with image, address, priority badge, editable summary, authority routing info, and send button |
| **Profile** | Avatar, name, email, phone editing + complete report history |
| **Login / Register** | Modern auth forms with Magic Link option and rate-limit error recovery |

---

## 8. Conclusion

### Key Takeaways

1. **AI automation eliminates friction** — Citizens don't need to know which department to contact; the system figures it out.
2. **Gatekeeper prevents spam** — The AI validation step filters out invalid submissions before they enter the pipeline, ensuring data quality.
3. **PWA = native-like experience** — The app is installable on any device, works offline-first, and uses native device APIs (camera, GPS, clipboard).
4. **User-controlled workflow** — The "Draft Mode" approach lets users review and edit AI-generated summaries before sending, maintaining human oversight.
5. **Full-stack serverless architecture** — Next.js API routes + Supabase + Vercel = zero server management with global edge deployment.
6. **Transparent accountability** — Unique tracking IDs and status progression give citizens confidence their reports are being handled.

---

## 9. Future Scope

| Enhancement | Description |
|-------------|-------------|
| **Real-time status updates** | Integrate Supabase Realtime subscriptions for live push notifications when report status changes |
| **Authority response portal** | Build a dedicated dashboard for municipal officers to view, acknowledge, and resolve reports |
| **Map visualization** | Add an interactive map (e.g., Mapbox/Leaflet) showing clustered civic issues across the city |
| **Multi-language support** | Internationalization (i18n) for regional language accessibility |
| **Analytics dashboard** | Statistics on most reported issue types, heatmap of problem areas, response time metrics |
| **Community voting** | Allow citizens to upvote existing reports to signal urgency and prevent duplicates |
| **Image evidence timeline** | Support before/after photos to track resolution progress |
| **Push notifications** | Use Web Push API to notify users when their report status changes |
| **Integration with government APIs** | Direct integration with municipal complaint management systems (e.g., 311 systems) |
| **AI model fine-tuning** | Train a custom classification model on accumulated report data for higher accuracy in the local context |

---

## Quick Reference: Complete Tool & Technology Summary

### Frontend
- Next.js 14 (React 18, App Router, Server + Client Components)
- TypeScript
- Tailwind CSS 3.4 (custom design system with CSS variables)
- Lucide React (icons)
- `@ducanh2912/next-pwa` (service worker, manifest)

### Backend (API Routes)
- Next.js API Routes (serverless functions)
- OpenRouter API (Vision AI classification)
- Tavily Search API (authority contact scraping)
- Google Maps / Nominatim (reverse geocoding)
- Resend SDK (transactional email)

### Infrastructure
- Supabase (PostgreSQL database, Auth, Storage)
- Vercel (deployment, edge network, CI/CD)
- Git (version control)

### Browser APIs
- MediaDevices (camera)
- Geolocation (GPS)
- Canvas (frame capture)
- Clipboard (copy)
- Service Worker (PWA offline)
