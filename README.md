# 💰 MoniqoFi — AI-Powered Personal Finance Platform

> A full-stack, cross-platform personal finance app with AI coaching, real-time transaction tracking, budget management, and financial health scoring.

![MoniqoFi](https://img.shields.io/badge/MoniqoFi-v1.0.0-7C3AED?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?style=for-the-badge&logo=supabase)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

---

## � Live Deployment

**Frontend (Web App)**: [https://moniqofi-f56l.vercel.app](https://moniqofi-f56l.vercel.app) ✅ **Live on Vercel**

**Backend API**: Coming soon on Railway 🚀

**Demo Credentials**:
- Email: `priya@moniqofi.com`
- Password: `Demo@123`

---

## �📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Docker Setup](#docker-setup)
- [Kubernetes Deploy](#kubernetes-deploy)
- [Mobile (EAS Build)](#mobile-eas-build)
- [Deployment](#deployment)

---

## 🔍 Overview

MoniqoFi is a comprehensive personal finance platform built for the Indian market with global capabilities. It combines:

- **Real-time transaction notifications** via Android Notification Listener (UPI, Google Pay, PhonePe, Paytm, bank SMS)
- **AI Financial Coach** powered by Groq (Llama 3.3) for personalized advice
- **Financial Health Score** with AI-powered analysis
- **Personality-based investing** profiles
- **Bank account linking** via Plaid (US markets) + India AA (Account Aggregator)
- **Budget management** with overspend alerts
- **Goal tracking** with progress visualization
- **Investment simulation** engine

---

## ✨ Features

### 🏦 Banking & Transactions
- Auto-capture UPI/bank transactions from Android notifications
- Manual transaction entry & CSV import
- Connect bank accounts via Plaid (sandbox/development/production)
- India Account Aggregator (AA) integration
- Transaction categorization and search

### 🧠 AI Features
- **AI Financial Coach** — chat-based coach using Groq (Llama 3.3-70B)
- **Financial Health Score** — 0-100 score with category breakdown
- **Spending Personality** — Identifies financial personality type
- **Investment Simulation** — Monte Carlo-style scenario modeling

### 📊 Analytics
- Interactive spending charts (Chart.js + Recharts)
- Budget vs. actual tracking
- Subscription management & renewal alerts
- Financial goals with milestone tracking

### 📱 Mobile (Android/iOS)
- Expo SDK 52, React Native 0.76
- Dark glassmorphism UI with animated gradients
- Offline-capable with AsyncStorage
- Push notifications
- Biometric-ready secure storage

### 🌐 Web Dashboard
- Next.js 16 with App Router
- 3D animated hero (Three.js / React Three Fiber)
- Framer Motion animations
- Full TypeScript + Tailwind CSS v4

---

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │  Mobile App     │    │   Backend API   │
│   Next.js 16    │───▶│  React Native   │───▶│  Express.js 5   │
│   TypeScript    │    │  Expo SDK 52    │    │  Node.js        │
│   Tailwind v4   │    │  Android/iOS    │    │  Port 5000      │
└─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                        │
                              ┌─────────────────────────┼──────────────────────┐
                              │                         │                      │
                     ┌────────┴───────┐   ┌────────────┴──────┐  ┌────────────┴──┐
                     │  Supabase      │   │  Groq AI           │  │  Plaid        │
                     │  PostgreSQL    │   │  Llama 3.3-70B     │  │  Banking API  │
                     └────────────────┘   └───────────────────┘  └───────────────┘
```

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| PostgreSQL (Supabase) | Primary database |
| JWT (jsonwebtoken) | Authentication |
| bcrypt | Password hashing |
| Groq SDK (Llama 3.3) | AI Coach |
| Google Generative AI | Additional AI features |
| Plaid | US bank account linking |
| Nodemailer | Email (password reset, verification) |
| Multer | CSV file uploads |
| Helmet + express-rate-limit | Security |

### Frontend (Web)
| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations |
| Three.js + React Three Fiber | 3D hero section |
| Chart.js + Recharts | Data visualization |
| react-plaid-link | Plaid Link integration |

### Mobile
| Technology | Purpose |
|---|---|
| React Native 0.76 | Cross-platform mobile |
| Expo SDK 52 | Build & native modules |
| React Navigation 7 | Navigation |
| react-native-reanimated 3 | Animations |
| react-native-svg | SVG rendering |
| expo-secure-store | Secure credential storage |
| expo-document-picker | CSV file import |
| expo-linear-gradient | Gradient UI |
| react-native-chart-kit | Mobile charts |

---

## 📁 Project Structure

```
MoniqoFi/
├── backend/                    # Express.js REST API
│   ├── src/
│   │   ├── app.js              # Entry point, middleware, routes
│   │   ├── config/
│   │   │   └── db.js           # PostgreSQL pool (Supabase)
│   │   ├── controllers/        # Route handlers
│   │   │   ├── authController.js
│   │   │   ├── transactionController.js
│   │   │   ├── budgetController.js
│   │   │   ├── goalController.js
│   │   │   ├── healthScoreController.js
│   │   │   ├── coachController.js
│   │   │   ├── personalityController.js
│   │   │   ├── simulationController.js
│   │   │   └── subscriptionController.js
│   │   ├── routes/             # Express routers
│   │   ├── middleware/
│   │   │   └── authMiddleware.js  # JWT verification
│   │   └── models/             # DB query helpers
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # Next.js 16 web app
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page (3D hero)
│   │   ├── dashboard/          # Main dashboard
│   │   ├── login/              # Auth pages
│   │   ├── register/
│   │   ├── coach/              # AI Coach chat
│   │   ├── goals/
│   │   ├── health-score/
│   │   ├── personality/
│   │   ├── simulation/
│   │   ├── subscriptions/
│   │   └── components/
│   │       ├── Sidebar.tsx
│   │       └── MoniqoLogo.tsx  # Wallet SVG logo
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── mobile/                     # React Native / Expo app
│   ├── App.js                  # Entry point + ErrorBoundary
│   ├── app.json                # Expo config
│   ├── src/
│   │   ├── screens/            # All app screens
│   │   │   ├── LoginScreen.js
│   │   │   ├── DashboardScreen.js
│   │   │   ├── AIBrainScreen.js
│   │   │   ├── LiveFeedScreen.js
│   │   │   ├── CoachScreen.js
│   │   │   ├── GoalsScreen.js
│   │   │   ├── HealthScoreScreen.js
│   │   │   ├── PersonalityScreen.js
│   │   │   ├── SimulationScreen.js
│   │   │   ├── SubscriptionsScreen.js
│   │   │   ├── ProfileScreen.js
│   │   │   └── ConnectedAccountsScreen.js
│   │   ├── navigation/
│   │   │   └── AppNavigator.js # Tab + Stack navigator
│   │   ├── context/
│   │   │   └── AuthContext.js  # Auth state + JWT storage
│   │   ├── api/
│   │   │   └── client.js       # Axios wrapper
│   │   ├── hooks/
│   │   │   └── useNotificationListener.js
│   │   ├── components/
│   │   │   ├── GlassCard.js
│   │   │   ├── GradientBG.js
│   │   │   └── MoniqoLogo.js
│   │   ├── theme/
│   │   │   └── colors.js
│   │   └── utils/
│   │       └── format.js
│   ├── assets/                 # App icons (generated from SVG)
│   │   ├── icon.png            # 1024×1024 launcher icon
│   │   ├── adaptive-icon.png   # Android adaptive icon
│   │   ├── splash-icon.png     # Splash screen
│   │   └── favicon.png         # Web favicon
│   ├── plugins/
│   │   └── withNotificationListener.js  # Custom Expo plugin
│   ├── scripts/
│   │   └── generate-icons.js   # SVG → PNG icon generator
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml          # Full stack Docker setup
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Groq](https://console.groq.com) API key (free)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (for mobile)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/moniqofi.git
cd moniqofi
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your values in .env (see Environment Variables section)
npm run dev
# API running at http://localhost:5000
```

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local → set NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
# Web app at http://localhost:3000
```

### 4. Mobile setup

```bash
cd mobile
npm install
cp .env.example .env
# Edit .env → set EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000
npx expo start
# Scan QR with Expo Go app or use simulator
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
# Server
NODE_ENV=development
PORT=5000

# Database — Supabase PostgreSQL
# Get from: Supabase → Project Settings → Database → URI
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Auth
JWT_SECRET=your_64_char_random_secret

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Email — Gmail App Password
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_16_char_app_password

# AI Coach — Groq (free at console.groq.com)
GROQ_API_KEY=gsk_your_groq_api_key

# Plaid (optional — US bank linking)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox
PLAID_COUNTRY_CODES=US
PLAID_WEBHOOK_URL=https://your-backend.railway.app/api/plaid/webhook
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Mobile (`mobile/.env`)

```env
# Android emulator uses 10.0.2.2, device uses your LAN IP
EXPO_PUBLIC_API_URL=http://192.168.1.x:5000
```

---

## 📡 API Reference

Base URL: `http://localhost:5000`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/login` | ❌ | Login, returns JWT |
| `POST` | `/api/auth/forgot-password` | ❌ | Send reset email |
| `POST` | `/api/auth/reset-password` | ❌ | Reset with token |
| `GET` | `/api/auth/me` | ✅ | Get current user profile |
| `GET` | `/api/transactions` | ✅ | List transactions (paginated) |
| `POST` | `/api/transactions` | ✅ | Add transaction |
| `DELETE` | `/api/transactions/:id` | ✅ | Delete transaction |
| `POST` | `/api/transactions/import` | ✅ | Import CSV |
| `GET` | `/api/budgets` | ✅ | Get all budgets |
| `POST` | `/api/budgets` | ✅ | Create/update budget |
| `GET` | `/api/goals` | ✅ | List goals |
| `POST` | `/api/goals` | ✅ | Create goal |
| `PUT` | `/api/goals/:id` | ✅ | Update goal progress |
| `GET` | `/api/health-score` | ✅ | Get financial health score |
| `GET` | `/api/personality` | ✅ | Get spending personality |
| `POST` | `/api/simulation` | ✅ | Run investment simulation |
| `GET` | `/api/subscriptions` | ✅ | List subscriptions |
| `POST` | `/api/coach` | ✅ | Chat with AI coach |
| `POST` | `/api/plaid/create-link-token` | ✅ | Initiate Plaid Link |
| `POST` | `/api/plaid/exchange-token` | ✅ | Exchange public token |
| `GET` | `/api/aa/accounts` | ✅ | India AA accounts |

> ✅ = Requires `Authorization: Bearer <jwt>` header

---

## 🐳 Docker Setup

### Run everything with Docker Compose

```bash
# From project root
docker-compose up --build

# Services:
#   Backend  → http://localhost:5000
#   Frontend → http://localhost:3000
```

### Build individual images

```bash
# Backend
docker build -t moniqofi-backend ./backend

# Frontend
docker build -t moniqofi-frontend ./frontend
```

See [docker-compose.yml](docker-compose.yml) for full configuration.

---

## ☸️ Kubernetes Deploy

Kubernetes manifests are in the [`k8s/`](k8s/) folder:

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check pods
kubectl get pods -n moniqofi

# Get service URLs
kubectl get services -n moniqofi
```

**Manifests included:**
- `k8s/namespace.yaml` — Dedicated namespace
- `k8s/backend-deployment.yaml` — Backend pods + HPA
- `k8s/frontend-deployment.yaml` — Frontend pods
- `k8s/services.yaml` — ClusterIP + LoadBalancer
- `k8s/ingress.yaml` — Nginx ingress with TLS
- `k8s/secrets.yaml` — Template for secrets (fill before applying)
- `k8s/configmap.yaml` — Non-secret config

---

## 📱 Mobile (EAS Build)

The mobile app uses [Expo Application Services (EAS)](https://expo.dev) for builds.

### Build APK (Android)

```bash
cd mobile
npm install -g eas-cli
eas login

# Dev/testing build
eas build -p android --profile local-test

# Production build
eas build -p android --profile production
```

### Build profiles (`eas.json`)

| Profile | Type | Use case |
|---|---|---|
| `local-test` | `apk` | Install on device for testing |
| `preview` | `apk` | Internal distribution |
| `production` | `aab` | Google Play Store |

### Generate app icons

```bash
cd mobile
node scripts/generate-icons.js
# Renders wallet SVG → 4 PNG icons in assets/
```

---

## 🚢 Deployment

### Recommended Stack

| Service | Platform | Cost |
|---|---|---|
| Backend API | [Railway](https://railway.app) | Free tier available |
| Frontend | [Vercel](https://vercel.com) | Free tier |
| Database | [Supabase](https://supabase.com) | Free 500MB |
| Mobile | [EAS Build](https://expo.dev) | Free tier |

### Backend → Railway

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
# Set env vars in Railway dashboard
```

### Frontend → Vercel

```bash
npm install -g vercel
cd frontend
vercel --prod
# Set NEXT_PUBLIC_API_URL to your Railway backend URL
```

---

## 🔒 Security

- JWT tokens with configurable expiry
- bcrypt password hashing (salt rounds: 12)
- Helmet.js security headers
- Rate limiting: 100 req/15min (global), 15 req/15min (auth)
- CORS whitelist
- Request size limits (10KB JSON)
- No secrets in codebase (`.env` in `.gitignore`)

---

## 📜 License

MIT License — see [LICENSE](LICENSE)

---

## 👤 Author

**MoniqoFi Team**

---

*Built with ❤️ using Next.js, React Native, Express.js, and AI*
