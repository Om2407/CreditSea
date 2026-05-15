# 💳 LoanFlow — Loan Management System

A full-stack Loan Management System built with the MERN stack and Next.js, featuring a multi-step borrower portal, 4-module operations dashboard, Business Rule Engine, role-based access control, and complete loan lifecycle management.

---

## 🧰 Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend  | Node.js + Express.js + TypeScript |
| Database | MongoDB + Mongoose |
| Auth     | JWT + bcrypt |
| File Upload | Multer (PDF/JPG/PNG, max 5MB) |

---

## ✨ Features
- Multi-step borrower application with live loan calculator
- Server-side Business Rule Engine (BRE) with 4 validation rules  
- Role-based access control — 6 roles, frontend + backend enforced
- Complete loan lifecycle: Applied → Sanctioned → Disbursed → Closed
- Payment tracking with UTR validation and auto-loan closure
- Salary slip file upload (PDF/JPG/PNG, max 5MB)
- Seeded demo accounts for all roles — evaluator-ready

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd lms
```

### 2. Server Setup

```bash
cd server
cp .env.example .env
# Edit .env with your MONGO_URI if needed
npm install
```

### 3. Seed the Database

```bash
npm run seed
```

This creates one account per role (see credentials below).

### 4. Start Server

```bash
npm run dev
# Server runs on http://localhost:5000
```

### 5. Client Setup

```bash
cd ../client
cp .env.example .env.local
npm install
npm run dev
# App runs on http://localhost:3000
```

---

## 🔐 Login Credentials

| Role        | Email                  | Password       |
|-------------|------------------------|----------------|
| Admin       | admin@lms.com          | admin123       |
| Sales       | sales@lms.com          | sales123       |
| Sanction    | sanction@lms.com       | sanction123    |
| Disbursement| disburse@lms.com       | disburse123    |
| Collection  | collection@lms.com     | collection123  |
| Borrower    | borrower@lms.com       | borrower123    |

---

## 🗺️ Application Flow

### Borrower Journey
1. **Sign Up / Login** → account created as `borrower` role
2. **Personal Details** → BRE runs on server (age, salary, PAN, employment)
3. **Upload Salary Slip** → PDF/JPG/PNG, max 5MB
4. **Loan Configuration** → sliders for amount (₹50K–₹5L) and tenure (30–365 days)
5. **Apply** → loan created with `applied` status

### Operations Dashboard
| Module       | Role Access         | Actions |
|--------------|---------------------|---------|
| Sales        | Admin, Sales        | View all leads, track application stage |
| Sanction     | Admin, Sanction     | Approve or reject applied loans |
| Disbursement | Admin, Disbursement | Mark sanctioned loans as disbursed |
| Collection   | Admin, Collection   | Record payments, auto-close when fully paid |

### Loan Status Lifecycle
```
APPLIED → SANCTIONED → DISBURSED → CLOSED
            ↘ REJECTED
```

---

## 🧠 Business Rule Engine (BRE)

The BRE runs **server-side** (client-side is preview only, not authoritative).

| Rule         | Rejection Condition                     |
|--------------|----------------------------------------|
| Age          | Outside 23–50 years                    |
| Salary       | Below ₹25,000/month                   |
| PAN          | Not matching `^[A-Z]{5}[0-9]{4}[A-Z]$` |
| Employment   | Applicant is Unemployed                |

---

## 💰 Loan Math

```
SI = (P × R × T) / (365 × 100)
Total Repayment = P + SI

Where:
  P = Principal (loan amount)
  R = 12% per annum (fixed)
  T = Tenure in days
```

---

## 📁 Project Structure

```
lms/
├── server/
│   ├── src/
│   │   ├── config/         # DB connection, multer
│   │   ├── controllers/    # auth, loan, payment, dashboard
│   │   ├── middleware/     # authenticate, authorize (RBAC)
│   │   ├── models/         # User, Loan, Payment
│   │   ├── routes/         # auth, loan, payment, dashboard, user
│   │   └── utils/          # BRE engine, JWT helper, seed script
│   ├── uploads/            # Uploaded salary slips
│   └── .env.example
│
└── client/
    ├── app/
    │   ├── auth/           # login, signup
    │   ├── borrower/       # dashboard, apply (multi-step)
    │   └── dashboard/      # admin overview, sales, sanction, disbursement, collection
    ├── components/ui/      # Shared UI components
    ├── context/            # AuthContext
    ├── lib/                # api client, utils
    └── types/              # TypeScript types
```

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint       | Description       |
|--------|---------------|-------------------|
| POST   | /api/auth/signup | Register borrower |
| POST   | /api/auth/login  | Login all roles   |
| GET    | /api/auth/me     | Get current user  |

### Loans
| Method | Endpoint                       | Role      | Description |
|--------|-------------------------------|-----------|-------------|
| POST   | /api/loans/personal-details   | Borrower  | Submit details + BRE |
| POST   | /api/loans/upload-salary-slip | Borrower  | Upload salary slip |
| POST   | /api/loans/apply              | Borrower  | Apply for loan |
| GET    | /api/loans/my-loans           | Borrower  | My loan history |
| GET    | /api/loans/:id                | All       | Loan details |
| PATCH  | /api/loans/:id/sanction       | Admin/Sanction | Approve or reject |
| PATCH  | /api/loans/:id/disburse       | Admin/Disbursement | Disburse funds |

### Payments
| Method | Endpoint                 | Role            | Description |
|--------|-------------------------|-----------------|-------------|
| POST   | /api/payments           | Admin/Collection| Record payment |
| GET    | /api/payments/loan/:id  | All             | Payment history |

### Dashboard
| Method | Endpoint                    | Role              |
|--------|-----------------------------|-------------------|
| GET    | /api/dashboard/stats        | Admin             |
| GET    | /api/dashboard/sales        | Admin, Sales      |
| GET    | /api/dashboard/sanction     | Admin, Sanction   |
| GET    | /api/dashboard/disbursement | Admin, Disbursement|
| GET    | /api/dashboard/collection   | Admin, Collection |

---

## 🛡️ RBAC Design

- JWT payload contains `{ id, role, name, email }`
- `authenticate` middleware verifies the token on all protected routes
- `authorize(...roles)` middleware checks the role; returns **403** if unauthorized
- Frontend hides unavailable nav items AND backend enforces — hiding menu is not enough
- Borrowers cannot access `/dashboard` routes (redirected automatically)

---

## 📦 Environment Variables

### Server (`server/.env`)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/lms_db
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### Client (`client/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

Built with ❤️ by Om Gupta | MERN + Next.js
