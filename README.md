# CampusCart — Hyperlocal Campus Delivery Platform

CampusCart is a hyperlocal campus delivery platform designed to connect college students with nearby campus local shops and dedicated delivery partners.

---

## 🛠️ Tech Stack

### Frontend (Phase 1)
- **Framework:** React 18
- **Build Tool:** Vite
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Styling:** Vanilla CSS (Glassmorphic dark design system)

### Backend (Phase 1)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB & Mongoose
- **Development Tool:** Nodemon

---

## 📁 Project Structure

```
CampusCart/
│
├── client/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── RolePlaceholder.jsx
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx
│   │   ├── pages/
│   │   │   ├── Admin.jsx
│   │   │   ├── Delivery.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── Shopkeeper.jsx
│   │   │   └── Student.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── models/
│   ├── routes/
│   │   └── healthRoutes.js
│   ├── services/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── .gitignore
└── README.md
```

---

## 🔑 Environment Variables

### Backend Configuration (`server/.env`)
Create a `.env` file in the `server` directory based on `server/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/campuscart
CLIENT_URL=http://localhost:5173
```

### Frontend Configuration (`client/.env`)
Create a `.env` file in the `client` directory based on `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or a MongoDB Atlas URI)

### 1. Backend Setup & Run

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start server in development mode (using nodemon)
npm run dev

# Start server in production mode
npm start
```

### 2. Frontend Setup & Run

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build
```

---

## 📌 Current Status: Phase 1 Complete

**Phase 1 Focus:** Core Application & Base Architecture Setup
- Express backend server initialization with CORS, JSON parsing, & Dotenv
- MongoDB connection handler with graceful error reporting
- Centralized error-handling middleware (404 and 500 handlers)
- Health Check Endpoint (`GET /api/health`)
- Vite React frontend application with React Router
- Modular Axios client service configured via environment variables
- UI layout with landing page, responsive role cards, and role route placeholders (`/`, `/student`, `/shopkeeper`, `/delivery`, `/admin`)
- Frontend Error Boundary to protect runtime UI rendering

---

## 🔮 Future Development Roadmap

- **Phase 2:** Authentication & User Roles (JWT, Bcrypt, Role-Based Access Control)
- **Phase 3:** Shop & Product Inventory Management (Cloudinary image storage)
- **Phase 4:** Order Management & Hyperlocal Cart System
- **Phase 5:** Live Delivery Tracking & Real-Time Updates (Socket.IO & Firebase Notifications)
- **Phase 6:** Payment Gateway Integration (Razorpay)
- **Phase 7:** Admin Dashboard & Platform Governance
