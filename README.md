# Dynamic Multi-Module Device Monitoring & Admin Platform

> **Enterprise multi-tenant, consent-based device monitoring, live GPS tracking, WebRTC audio/video sessions, and dynamic runtime module management.**

Built with **React (Vite, Tailwind CSS, Leaflet, Recharts)** on the frontend and **Java 21/23 Spring Boot (Spring Security, JWT, Flyway, WebSocket, OpenAPI)** on the backend.

---

## 1. Architecture Overview

The platform is designed around **Privacy-by-Design**, **Multi-Tenancy**, and **Dynamic Modularity**:
- **Stateless JWT Security**: Short-lived access tokens, rotating refresh tokens, and strict role & organization authorization filters.
- **Dynamic Module Management**: Modules (Location, Audio, Camera, Devices, etc.) can be activated or deactivated in real-time by the Master Admin via REST APIs and reflected immediately in user dashboards and routes without changing frontend source code.
- **Strict Informed Consent**: Hardware capabilities (GPS, microphone, camera) strictly require user invitation, standard browser permissions, visible glowing active-session indicators, and immutable consent audit records. Silent, hidden, or carrier-level tracking is explicitly prevented.
- **Dual Persistence Profiles**:
  - `dev` profile: Instant local development with zero external dependencies (H2 in PostgreSQL mode, automatic database seeding).
  - `prod` profile: Enterprise PostgreSQL with connection pooling and automated Flyway migrations (`V1__initial_schema.sql`, `V2__seed_data.sql`).

```
                              ┌─────────────────────────────────────────┐
                              │            React Frontend (Vite)        │
                              │  - Tailwind CSS Glassmorphism           │
                              │  - Dynamic Module Navigation & Guard   │
                              │  - Leaflet GPS Interactive Map          │
                              │  - WebRTC Audio & Camera Controls       │
                              └────────────────────┬────────────────────┘
                                                   │
                          REST APIs (JWT)          │   WebSocket (STOMP / SockJS)
                                                   ▼
                              ┌─────────────────────────────────────────┐
                              │        Java Spring Boot Backend         │
                              │  - Spring Security 6 & JWT Auth Filter  │
                              │  - Dynamic Module Configuration Service │
                              │  - Device Registration & Consent Ledger │
                              │  - WebRTC SDP & ICE Signaling Relay     │
                              │  - OpenAPI 3.0 / Swagger UI             │
                              └────────────────────┬────────────────────┘
                                                   │
                                                   ▼
                              ┌─────────────────────────────────────────┐
                              │           PostgreSQL / Flyway           │
                              │  - Multi-tenant organizations & users   │
                              │  - Hardware beacons & consent records   │
                              │  - Immutable administrative audit logs  │
                              └─────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Frontend
- **React 19** with **Vite 8**
- **Tailwind CSS v4** (`@tailwindcss/vite`) with curated dark glassmorphism design tokens
- **React Router v7** with Dynamic Route Guards (`ProtectedRoute`, `DynamicModuleGuard`)
- **Lucide React** modern icons
- **Axios** with automatic JWT injection & token rotation interceptors
- **Leaflet & React Leaflet** for real-time GPS tracking and breadcrumb polylines
- **Recharts** for interactive telemetry charts (AreaChart, PieChart, BarChart)
- **WebRTC & Web Audio API** for encrypted peer-to-peer audio and front/rear video streaming

### Backend
- **Java 21 / 23**
- **Spring Boot 3.3.5**
- **Spring Security 6** with BCrypt password hashing and custom UserDetailsService
- **JJWT 0.12.6** for HMAC-SHA256 stateless access and refresh tokens
- **Spring Data JPA & Hibernate**
- **WebSocket (STOMP / SockJS)** for live GPS and WebRTC signaling
- **Flyway** database migrations
- **PostgreSQL 16** (production) & **H2** (zero-config dev mode)
- **SpringDoc OpenAPI 3.0** with interactive Swagger UI

---

## 3. User Roles & Access Control

| Role | Access Level | Description |
| :--- | :--- | :--- |
| **`ROLE_MASTER_ADMIN`** | Unrestricted Platform-wide | Onboard organizations, toggle dynamic modules system-wide, inspect all devices, manage subscription tiers, and view complete audit logs. |
| **`ROLE_ORG_ADMIN`** | Scoped Tenant Administrator | Manage members within their organization, issue onboarding invitations, assign permitted modules, and review organization device fleets. |
| **`ROLE_USER`** | Standard Operator / Device Owner | Access enabled modules, enroll personal hardware, grant/revoke GPS, mic, and camera permissions, and terminate active media sessions at any time. |

---

## 4. Default Seed Accounts (1-Click Login)

The platform automatically seeds the following verified accounts upon first start:

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Master Admin** | `admin@monitoring.local` | `Admin@123456` | Complete platform control, module flipping, tenant provisioning |
| **Org Admin** | `orgadmin@acme.local` | `OrgAdmin@123456` | Acme Global Operations tenant administrator |
| **Field Operator** | `operator@acme.local` | `User@123456` | Standard user with self-device management |

---

## 5. Modules Breakdown

### Module 1: Live Location Tracking
- Verified device selection and consent check prior to tracking.
- Browser HTML5 Geolocation API integration with automatic realistic telemetry simulation fallback for desktop machines.
- Interactive Leaflet map with custom pulsing beacon markers.
- Telemetry panel displaying Latitude, Longitude, Accuracy (±meters), Altitude, Speed, Battery %, and Timestamp.
- Consensual historical breadcrumb polyline rendering.
- Configurable update intervals (3s, 5s, 10s, 30s).
- Emergency "Stop & Revoke" button to kill sharing instantly.

### Module 2: Microphone Access & Audio Sessions
- Pre-call modal requiring explicit hardware permission.
- Native browser `getUserMedia({ audio: true })` request.
- Web Audio API real-time frequency analyser with animated audio waveform bars.
- Glowing high-visibility **"AUDIO ACTIVE"** indicator.
- Mute/Unmute microphone controls.
- WebRTC signaling pass-through via `/api/v1/media/sessions/{id}/signaling` and WebSocket topic `/topic/media/{id}`.
- Zero audio recordings saved to disk by default.

### Module 3: Front & Rear Camera Sessions
- Front vs. Rear camera selection (`facingMode: 'user'` vs `facingMode: { ideal: 'environment' }`).
- Lens switching button with smooth video feed transfer.
- Visible camera-active status pill with live session duration clock.
- Video mute, lens flip, and disconnect controls.
- Responsive viewport optimized for mobile and desktop.

### Module 4: Device Management Fleet
- Inventory of registered hardware, operating system platform, browser, and IP address.
- Network beacon showing real-time online/offline status.
- Hardware-level permission toggles for GPS, Audio, and Camera.
- Direct "Register Current Browser" enrollment modal.
- Immediate device access revocation and deletion actions.

### Module 5: Dynamic User Onboarding
- Admin creates an onboarding invitation specifying email and role.
- Generates a secure, 7-day expiring onboarding link (`/accept-invite/:token`).
- Token verification endpoint confirms validity before showing the form.
- User sets password, completes name and phone, and accepts privacy terms.
- User is automatically logged in and navigated to their tailored dashboard.

### Module 6: Dynamic Module Configuration
- Master Admin dashboard to view all platform modules.
- Single-click toggle switches to activate or deactivate modules system-wide.
- Real-time UI reaction without redeploying code or altering frontend builds.
- Configure minimum role access level and subscription tier requirements per module.

### Module 7: Dashboard & Analytics
- Live KPI cards: Total Users, Active Users, Registered Devices, Online Beacons, Live GPS Sessions, Active Media Calls.
- Recharts AreaChart: 7-day telemetry and session volume trends.
- Recharts PieChart: Consent compliance ratio.
- Real-time audit activity feed displaying tamper-evident administrative events.

---

## 6. REST API Endpoints

Interactive Swagger UI documentation is available at:
👉 `http://localhost:8080/swagger-ui.html`

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/login`: Authenticate with email and password, receives access token & refresh token.
- `POST /api/v1/auth/register`: Register new organization and admin account.
- `POST /api/v1/auth/refresh`: Rotate expired access token using valid refresh token.
- `POST /api/v1/auth/logout`: Invalidate refresh token session.
- `GET /api/v1/auth/me`: Inspect current authenticated profile.

### Dynamic Modules (`/api/v1/modules`)
- `GET /api/v1/modules`: Get authorized and active modules for current user.
- `GET /api/v1/admin/modules`: Get all system modules (Master Admin).
- `PATCH /api/v1/admin/modules/{id}/status?enabled={bool}`: Toggle module state.
- `PUT /api/v1/admin/modules/{id}`: Update module metadata and subscription rules.

### Users & Onboarding (`/api/v1/users`)
- `GET /api/v1/users`: List users with pagination and sorting.
- `POST /api/v1/users/invite`: Generate expiring invitation token.
- `GET /api/v1/invitations/verify/{token}`: Validate invitation token.
- `POST /api/v1/invitations/accept`: Complete profile, accept terms, and create account.
- `PATCH /api/v1/users/{id}/status?status={ACTIVE|SUSPENDED}`: Update account status.
- `DELETE /api/v1/users/{id}`: Delete user account.

### Devices (`/api/v1/devices`)
- `GET /api/v1/devices`: List authorized hardware devices.
- `POST /api/v1/devices/register`: Register client hardware/browser.
- `PUT /api/v1/devices/{id}/permissions`: Update device permission grants.
- `PATCH /api/v1/devices/{id}/revoke`: Immediately revoke device access.
- `POST /api/v1/devices/{id}/heartbeat`: Ping device online beacon.
- `DELETE /api/v1/devices/{id}`: Delete device record.

### Location Tracking (`/api/v1/location`)
- `POST /api/v1/location/sessions`: Start authorized location tracking session.
- `POST /api/v1/location/sessions/{sessionToken}/updates`: Push GPS telemetry coordinates.
- `GET /api/v1/location/sessions/{id}`: Get session metadata.
- `GET /api/v1/location/sessions/{id}/latest`: Get latest coordinates.
- `GET /api/v1/location/sessions/{id}/history`: Get breadcrumb points.
- `POST /api/v1/location/sessions/{id}/stop`: Terminate tracking session.

### Media Sessions (`/api/v1/media`)
- `POST /api/v1/media/sessions`: Initialize WebRTC audio or video session.
- `POST /api/v1/media/sessions/{id}/consent`: Confirm participant consent.
- `POST /api/v1/media/sessions/{id}/signaling`: Relay SDP offer/answer or ICE candidate.
- `POST /api/v1/media/sessions/{id}/terminate`: Terminate media session.

### Consent & Audit (`/api/v1/consents` & `/api/v1/admin/audit-logs`)
- `GET /api/v1/consents`: List auditable consent records.
- `POST /api/v1/consents`: Record informed consent for device capability.
- `DELETE /api/v1/consents/{id}`: Revoke prior consent immediately.
- `GET /api/v1/admin/audit-logs`: Query paginated administrative audit logs.

---

## 7. Local Development Setup

### Prerequisites
- **Java 21+** (`java -version`)
- **Maven** (or Maven Wrapper)
- **Node.js v18+** & **npm** (`node -v`)

### Step 1: Start the Spring Boot Backend
Open a terminal in `backend/`:
```bash
# In dev mode, Spring Boot uses in-memory H2 with PostgreSQL syntax and seeds initial data automatically
mvn spring-boot:run
```
The backend starts on `http://localhost:8080`.
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- H2 Console: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:monitoringdb`, user: `sa`, password: empty)

### Step 2: Start the React Frontend
Open a second terminal in `frontend/`:
```bash
npm install
npm run dev
```
The frontend starts on `http://localhost:5173`.
All `/api` and `/ws` calls are proxied to `http://localhost:8080`.

Log in with:
- Email: `admin@monitoring.local`
- Password: `Admin@123456`
(Or use the 1-click demo credential badges on the login screen!)

---

## 8. Docker Compose Deployment (Production)

To deploy the entire production stack with PostgreSQL, Redis, Spring Boot, React, and Nginx reverse proxy:

```bash
# 1. Clone or navigate to the project directory
cd "e:/Programming Jatin/TrakingApp"

# 2. Build and launch all containers
docker-compose up --build -d

# 3. Check running services
docker-compose ps
```

Services started:
- **`frontend`** (Nginx + React SPA): `http://localhost:80`
- **`backend`** (Spring Boot Java 21): `http://localhost:8080`
- **`postgres`** (PostgreSQL 16): `localhost:5432`
- **`redis`** (Redis 7 Cache): `localhost:6379`

To stop:
```bash
docker-compose down
```

---

## 9. Automated Testing

### Backend Unit & Integration Tests
Run JUnit 5 and Mockito tests in `backend/`:
```bash
mvn test
```
Verifies:
- Spring Boot Application Context and JPA wiring.
- BCrypt authentication, UserPrincipal role mapping, and JWT token generation.
- Dynamic module access filtering based on role hierarchy.
- Auditing event triggers.

### Frontend Production Build
Run Vite build verification in `frontend/`:
```bash
npm run build
```
Generates minified, tree-shaken static assets in `frontend/dist/`.

---

## 10. Compliance & Ethical Boundaries

- **No Silent Tracking**: The browser and operating system strictly dictate location, mic, and camera access. Permission prompts cannot be bypassed.
- **Auditable Records**: Every grant, revocation, session initiation, and administrative change is permanently recorded in `audit_logs` and `consent_records`.
- **Zero Media Retention by Default**: Audio and video streams are strictly peer-to-peer and temporary. No recording is saved unless explicit separate consent is logged.
