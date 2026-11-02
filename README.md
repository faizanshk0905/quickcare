# 🏥 QUICK CARE – Online Doctor Appointment Booking System

A complete, production-grade healthcare web application connecting patients with doctors through online appointment booking, AI-powered health assistance, video consultations, and digital prescriptions.

---

## 📋 Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Demo Credentials](#demo-credentials)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## ✨ Features

### Patient Portal
- 🔐 Register, login, manage profile & avatar
- 🔍 Search & filter doctors by specialization, experience, fees
- 📅 Book appointments with slot availability check
- 📹 Join video consultations (WebRTC)
- 💊 View & download digital prescriptions (PDF)
- 🔔 Real-time notifications (confirmation, reminders, updates)
- 🤖 AI health assistant (Gemini-powered with emergency detection)

### Doctor Portal
- 📋 Registration with admin verification workflow
- 📊 Dashboard with appointment stats
- ✅ Accept / reject / complete appointments
- 🗓️ Manage availability & time slots
- 💊 Create digital prescriptions post-consultation
- 📹 Start/host video consultation rooms

### Admin Portal
- 📈 System-wide dashboard statistics
- ✔️ Verify / reject doctor registrations
- 👥 Manage patients, doctors, appointments
- 📊 Reports and analytics
- ⚙️ System settings management

### Cross-cutting
- 🌍 Multilingual (English, Hindi, Marathi)
- ♿ Accessibility (font scaling, high contrast, text-to-speech)
- 🔒 JWT + Firebase Authentication
- 📱 Fully responsive (mobile-first)

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router 7 |
| Backend | Java 17, Spring Boot 3.2.5, Spring Security |
| Database | Cloud Firestore (in-memory fallback for dev) |
| Auth | Firebase Authentication + JWT |
| Storage | Firebase Storage |
| Notifications | Firebase Cloud Messaging |
| AI | Google Gemini API |
| Video | WebRTC (simple-peer) |
| PDF | jsPDF |
| API Docs | SpringDoc OpenAPI / Swagger UI |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│              React Frontend (Vite)               │
│  Patient Portal | Doctor Portal | Admin Portal   │
└──────────────────────┬───────────────────────────┘
                       │ HTTPS REST API (Axios)
                       ▼
┌──────────────────────────────────────────────────┐
│           Spring Boot Backend (Java 17)          │
│  Spring Security │ JWT │ Firebase Admin SDK       │
│  Controllers → Services → Repository              │
└──────┬────────────────┬────────────────┬─────────┘
       │                │                │
       ▼                ▼                ▼
 Firestore DB    Firebase Auth    Firebase Storage
                       │
                       ▼
               Gemini AI API (AiService)
```

---

## 🚀 Quick Start

### Prerequisites
- Java 17+ (`JAVA_HOME` set)
- Maven 3.8+
- Node.js 18+
- pnpm or npm

### 1. Clone the repository
```bash
git clone https://github.com/your-username/quick-care.git
cd quick-care
```

### 2. Configure the backend
```bash
cd backend
cp src/main/resources/firebase-service-account.json.example src/main/resources/firebase-service-account.json
# Edit firebase-service-account.json with your Firebase project credentials
cp .env.example .env
# Edit .env with your values
```

### 3. Build & run the backend
```bash
cd backend
mvn clean package -s settings.xml -DskipTests
java -jar target/quickcare-backend-1.0.0.jar
# Backend starts on http://localhost:8080
```

### 4. Configure the frontend
```bash
cd frontend
cp .env.example .env
# Edit .env with your values (Firebase config, backend URL)
```

### 5. Install & run the frontend
```bash
cd frontend
npm install
npm run dev
# Frontend starts on http://localhost:3000
```

### 6. Open in browser
Navigate to **http://localhost:3000**

---

## 🔑 Demo Credentials

> **Note:** These credentials are auto-seeded on backend startup (in-memory mode). Data resets on restart.

| Role    | Email                          | Password    |
|---------|-------------------------------|-------------|
| Patient | patient@quickcare.com          | patient123  |
| Doctor  | priya.deshmukh@quickcare.com   | doctor123   |
| Admin   | admin@quickcare.com            | admin123    |

**Additional seeded doctors:**
- `rajesh.kumar@quickcare.com` / `doctor123` (Cardiologist)
- `anita.sharma@quickcare.com` / `doctor123` (Pediatrician)
- `vikram.patel@quickcare.com` / `doctor123` (Orthopedic)
- `meera.nair@quickcare.com` / `doctor123` (Neurologist)

---

## 📡 API Endpoints

Base URL: `http://localhost:8080`

Swagger UI: **http://localhost:8080/swagger-ui.html**

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Patient registration | Public |
| POST | `/api/auth/register-doctor` | Doctor registration | Public |
| POST | `/api/auth/login` | Login (returns JWT) | Public |
| POST | `/api/auth/forgot-password` | Password reset email | Public |
| GET | `/api/auth/me` | Get current user profile | JWT |
| PUT | `/api/auth/profile` | Update profile | JWT |

### Doctors
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/doctors` | List all verified doctors | Public |
| GET | `/api/doctors/{id}` | Doctor profile | Public |
| GET | `/api/doctors/{id}/availability` | Get availability slots | Public |
| PUT | `/api/doctors/availability` | Update availability | Doctor |
| GET | `/api/doctors/dashboard` | Doctor dashboard stats | Doctor |

### Appointments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/appointments` | Book appointment | Patient |
| GET | `/api/appointments/my` | My appointments | JWT |
| PUT | `/api/appointments/{id}/status` | Update status | Doctor/Admin |
| PUT | `/api/appointments/{id}/cancel` | Cancel appointment | Patient |
| GET | `/api/appointments/{id}` | Appointment details | JWT |

### Prescriptions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/prescriptions` | Create prescription | Doctor |
| GET | `/api/prescriptions/patient/{id}` | Patient prescriptions | Patient/Doctor |
| GET | `/api/prescriptions/{id}` | Prescription details | JWT |

### AI Chat
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/ai/chat` | AI health assistant | Public |

### Video Consultation
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/video/create-room` | Create video room | Doctor |
| GET | `/api/video/join/{appointmentId}` | Get room token | JWT |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/dashboard` | System stats | Admin |
| GET | `/api/admin/doctors/pending` | Pending verifications | Admin |
| PUT | `/api/admin/doctors/{id}/verify` | Verify doctor | Admin |
| PUT | `/api/admin/doctors/{id}/reject` | Reject doctor | Admin |
| GET | `/api/admin/patients` | All patients | Admin |
| GET | `/api/admin/appointments` | All appointments | Admin |
| DELETE | `/api/admin/users/{id}` | Delete user | Admin |

### Notifications
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | My notifications | JWT |
| PUT | `/api/notifications/{id}/read` | Mark as read | JWT |
| PUT | `/api/notifications/read-all` | Mark all as read | JWT |

### Reviews
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/reviews` | Submit review | Patient |
| GET | `/api/reviews/doctor/{id}` | Doctor reviews | Public |

---

## 📁 Project Structure

```
quick-care/
├── README.md
├── .gitignore
├── docker-compose.yml
├── firebase.json
│
├── backend/                          # Spring Boot application
│   ├── pom.xml
│   ├── settings.xml                  # Maven mirror config
│   ├── .env.example
│   ├── src/main/
│   │   ├── java/com/quickcare/
│   │   │   ├── QuickCareApplication.java
│   │   │   ├── config/               # Firebase, Security, OpenAPI
│   │   │   ├── controller/           # REST controllers
│   │   │   ├── service/              # Business logic
│   │   │   ├── model/                # Domain models
│   │   │   ├── dto/                  # Data transfer objects
│   │   │   ├── repository/           # Firestore data access
│   │   │   ├── security/             # JWT, UserPrincipal, filter
│   │   │   └── exception/            # Custom exceptions, handler
│   │   └── resources/
│   │       ├── application.properties
│   │       └── firebase-service-account.json.example
│   └── target/
│       └── quickcare-backend-1.0.0.jar
│
└── frontend/                         # React + Vite application
    ├── package.json
    ├── vite.config.js
    ├── .env.example
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── i18n/                     # Multilingual (en, hi, mr)
        ├── context/                  # AuthContext, ThemeContext
        ├── services/                 # Axios API service modules
        ├── components/               # Reusable UI components
        └── pages/
            ├── auth/                 # Login, Register, ForgotPassword
            ├── patient/              # Patient portal pages
            ├── doctor/               # Doctor portal pages
            ├── admin/                # Admin portal pages
            └── public/              # Landing, About, Contact
```

---

## 🔧 Environment Variables

### Backend (`backend/.env`)
```properties
JWT_SECRET=your-super-secret-jwt-key-min-256-bits
GEMINI_API_KEY=your-google-gemini-api-key
FIREBASE_PROJECT_ID=your-firebase-project-id
```

### Frontend (`frontend/.env`)
```properties
VITE_API_URL=http://localhost:8080
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## 🚢 Deployment

### Frontend → Firebase Hosting
```bash
cd frontend
npm run build
npm install -g firebase-tools
firebase login
firebase deploy --only hosting
```

### Backend → Cloud (e.g., Google Cloud Run, Railway, Render)

**Docker:**
```bash
cd backend
docker build -t quickcare-backend .
docker run -p 8080:8080 \
  -e JWT_SECRET=your-secret \
  -e GEMINI_API_KEY=your-key \
  quickcare-backend
```

**Or use docker-compose from project root:**
```bash
docker-compose up --build
```

---

## 📄 License

MIT License — © 2025 QuickCare Team

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request
