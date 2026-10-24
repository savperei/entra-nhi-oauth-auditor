# Entra NHI & OAuth Auditor

> **Notice:** The initial application is pre-configured to operate strictly in **Synthetic / Dummy Data Mode** (`USE_SYNTHETIC_DATA=true`). It does **not** connect to real Microsoft Entra ID tenants, production Azure directories, or live OAuth providers.

A full-stack monorepo designed to audit Microsoft Entra ID Non-Human Identities (NHI)—such as Service Principals, App Registrations, and Managed Identities—and detect risky OAuth permission grants, excessive privileges, and expiring credentials.

---

## 📁 Monorepo Structure

```text
entra-nhi-oauth-auditor/
├── backend/
│   ├── .env                      # Local environment configuration (USE_SYNTHETIC_DATA=true)
│   ├── .env.example              # Example environment template
│   ├── requirements.txt          # Python dependencies (FastAPI, uvicorn, etc.)
│   ├── rules/                    # Audit rule definitions (YAML)
│   │   └── risk_rules.yaml
│   ├── templates/                # Jinja2 audit report templates
│   │   └── audit_report.html.jinja2
│   └── src/
│       ├── __init__.py
│       ├── api/                  # FastAPI routers and app entry point
│       │   ├── __init__.py
│       │   └── main.py
│       ├── dummy_data/           # Synthetic identities and audit findings
│       │   ├── __init__.py
│       │   └── synthetic_identities.py
│       ├── inventory/            # Identity inventory discovery & query service
│       │   ├── __init__.py
│       │   └── service.py
│       ├── analyzers/            # OAuth permission & scope evaluation logic
│       │   ├── __init__.py
│       │   └── oauth_analyzer.py
│       ├── risk_engine/          # Risk calculation & rule evaluation engine
│       │   ├── __init__.py
│       │   └── scorer.py
│       └── reporting/            # Audit reporting & summary generation
│           ├── __init__.py
│           └── generator.py
├── frontend/
│   ├── package.json              # Frontend npm dependencies and scripts
│   ├── vite.config.ts            # Vite build configuration
│   ├── tsconfig.json             # TypeScript configuration
│   ├── tailwind.config.js        # Tailwind CSS styling configuration
│   ├── postcss.config.js         # PostCSS configuration
│   ├── index.html                # Vite HTML shell
│   └── src/
│       ├── main.tsx              # React Vite entry point
│       ├── App.tsx               # React Router DOM configuration
│       ├── types/                # TypeScript interface definitions
│       │   └── index.ts
│       ├── styles/               # Global styles and theme tokens
│       │   └── globals.css
│       ├── services/             # Axios API client
│       │   └── api.ts
│       ├── hooks/                # Custom React data fetching hooks
│       │   └── useApi.ts
│       ├── components/           # Reusable UI components (Navbar, Layout, RiskBadge)
│       │   ├── Layout.tsx
│       │   ├── Navbar.tsx
│       │   └── RiskBadge.tsx
│       └── pages/                # Application views / routes
│           ├── DashboardPage.tsx     # Route: /dashboard
│           ├── IdentitiesPage.tsx    # Route: /identities
│           ├── IdentityDetailPage.tsx# Route: /identities/:id
│           └── FindingsPage.tsx      # Route: /findings
├── .gitignore                    # Standard Python, Node, Vite, env exclusions
└── README.md                     # Monorepo documentation & setup guide
```

---

## 🚀 Application URLs

| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Vite + React + Tailwind Web Dashboard |
| **Backend API Root** | [http://127.0.0.1:8000](http://127.0.0.1:8000) | FastAPI Base Service |
| **API Health Endpoint** | [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health) | Service Health & Synthetic Mode Status |
| **Interactive API Docs**| [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Swagger UI for interactive API testing |

---

## ⚙️ Backend Setup & Startup Instructions

### Prerequisites
- Python 3.10+ (tested on Python 3.12)
- `pip` package manager

### 1. Navigate to the backend directory
```bash
cd backend
```

### 2. Create and activate a Python virtual environment (recommended)
**On Windows (PowerShell):**
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

**On macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install required Python packages
```bash
pip install -r requirements.txt
```

### 4. Verify environment configuration
Ensure `backend/.env` exists (copy from `.env.example` if needed):
```bash
USE_SYNTHETIC_DATA=true
```

### 5. Launch the FastAPI backend
From the `backend` directory, run:
```bash
uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8000
```

---

## 💻 Frontend Setup & Startup Instructions

### Prerequisites
- Node.js 18+ (tested on Node v22)
- `npm` package manager

### 1. Navigate to the frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Launch the development server
```bash
npm run dev
```

The frontend will start at [http://localhost:5173](http://localhost:5173).

---

## 🛣️ Frontend Routes

- `/dashboard` — High-level security posture, summary metrics, and risk overview.
- `/identities` — Searchable catalog of Non-Human Identities (Service Principals, App Registrations, Managed Identities).
- `/identities/:id` — Granular identity audit detail, OAuth permissions analysis, and credential hygiene.
- `/findings` — Prioritized security findings with severity ratings and remediation guidance.

---

## 🔒 Synthetic Data Mode

All telemetry, identities, application credentials, and OAuth consent grants used in this initial application are entirely **synthetic**. No production credentials or Entra ID access tokens are queried or stored.

