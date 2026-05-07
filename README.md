# 📸 CivicEye — AI-Powered Civic Reporting

A next-generation civic engagement solution powered by **Vision AI** and **Real-time Geotagging**.

## ✨ System Highlights

| Feature | Technology |
| :--- | :--- |
| 🔐 **Authentication** | Supabase Auth (Magic Links + Passwords) |
| 👁️ **AI Classification** | Vision AI Issue Routing |
| 🗄️ **Database** | Supabase (PostgreSQL) |
| 🌐 **Frontend** | Next.js (App Router) + React |
| 🎨 **Styling** | Tailwind CSS + Lucide Icons |
| 📍 **Location** | Browser Geolocation API |

## 🛠️ System Architecture

This project utilizes a modern serverless architecture to combine the best of both worlds:

### 1. Frontend & API Engine (Next.js)
* **Role:** Powers the user interface, Server-Side Rendering, and secure API routes.
* **Stack:** Next.js, React, and Tailwind CSS.
* **Responsibility:** Handling the camera interface, rendering the user dashboard, managing state, and securely bridging client requests to the database via Server Actions.

### 2. Backend & Data Engine (Supabase)
* **Role:** Handles database management, file storage, and authentication.
* **Stack:** PostgreSQL, Supabase Auth, Supabase Storage.
* **Responsibility:** Securely managing user sessions, storing high-resolution report images, and maintaining relational data for civic issues.

## 🔐 Security & AI Pipeline

### Authentication Flow
* **Secure Sessions:** Leverages Supabase Auth for cryptographically secure session management.
* **Tokenization:** Uses secure HTTP-only cookies and JWTs to authorize database interactions.
* **Data Protection:** Row Level Security (RLS) policies in PostgreSQL ensure citizens can only access and view their own reports.

### AI & Reporting Flow
* **Capture:** The web app captures a live photo of the civic issue (e.g., pothole, broken streetlight).
* **Location Tagging:** Automatically fetches precise GPS coordinates and attaches them to the payload.
* **Vision AI Routing:** The backend analyzes the report data to automatically classify the issue type and route it directly to the correct municipal authority.
* **Tracking:** The system generates a unique `tracking_id` so the user can monitor the resolution status in real-time.

## 🚀 Installation & Setup

### Prerequisites
* **Node.js** (v18+)
* **Supabase Account** (for database routing and auth keys)

### 1. Installation

```bash
git clone [https://github.com/fadikalody/civicEye.git](https://github.com/fadikalody/civicEye.git)
cd civicEye/webapp
npm install --legacy-peer-deps
```

### 2. Environment Variables

Create a `.env.local` file in the `webapp` directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start Development Server

```bash
npm run dev
```

## 🗄️ Database Management (Supabase)

You can manage and view your data using the **Supabase Dashboard** or standard SQL queries.

### View Civic Reports
```sql
SELECT * FROM reports ORDER BY created_at DESC;
```

### View User Profiles
```sql
SELECT full_name, role, avatar_url FROM profiles;
```

