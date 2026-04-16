# 💸 Micro-Invest App — Spare Change Rounding System

A mobile-first web app that simulates a UPI-style payment experience and automatically invests spare change using round-up logic.

---

## 🎯 What This Project Does

* Simulates a **payment app (like GPay/PhonePe)**
* Rounds up transactions (₹187 → ₹200)
* Stores spare change (₹13)
* Automatically invests when threshold is reached
* Shows insights via dashboard

---

## 🧠 System Overview

### 🔁 Flow

```text
Scan / Pay → Enter Amount → Round-Up → Confirm → Enter PIN
→ Debit → Store Spare → Check Threshold → Auto Invest → Dashboard Update
```

---

## 🏗️ Architecture

### 🔵 Frontend (React — Mobile First)

* Payment UI (Scan, Pay, Round-up)
* User Dashboard (Charts + Settings)
* Investment View (Bucket allocation)
* Admin Dashboard (Monitoring)

---

### 🟢 Backend (Node.js + Express)

* Bank Simulation
* Payment Gateway Logic
* Round-Up Engine
* Investment Engine

---

### 🟣 Database (MongoDB)

Collections:

* BankAccount
* Transaction
* SparePool
* RoundUpSetting
* InvestmentAllocation

---

## 📁 Project Structure

```bash
/micro-invest-app
  /backend
    /models
    /routes
    /controllers
    /seed
    server.js

  /frontend
    /pages
    /components
    /api
```

---

## 🏦 MongoDB Schemas

### 1. BankAccount

```js
{
  accountNumber: String,
  name: String,
  email: String,
  phone: String,
  pin: String, // plain text (demo only)
  balance: Number,
  createdAt: Date
}
```

---

### 2. Transaction

```js
{
  fromAccount: String,
  toAccount: String,
  amount: Number,
  roundUpAmount: Number,
  type: "debit" | "credit",
  status: "success" | "failed",
  timestamp: Date
}
```

---

### 3. SparePool

```js
{
  accountId: String,
  totalSpare: Number,
  pendingInvestment: Number,
  investedTotal: Number,
  lastUpdated: Date
}
```

---

### 4. RoundUpSetting

```js
{
  accountId: String,
  enabled: Boolean,
  roundLevel: Number, // 5 / 10 / 20 / 50
  minAmount: Number,
  maxAmount: Number,
  threshold: Number,
  cycle: "weekly" | "monthly"
}
```

---

### 5. InvestmentAllocation

```js
{
  accountId: String,

  gold: Number,
  etf: Number,
  indexFund: Number,
  debtFund: Number,

  conditionalRule: {
    ifSpareGt: Number,
    thenBucket: String
  },

  history: []
}
```

---

## ⚡ Core Logic (Most Important Part)

### Round-Up Calculation

```js
function getRoundUp(amount, roundLevel) {
  return Math.ceil(amount / roundLevel) * roundLevel - amount;
}
```

---

### With Constraints

```js
function getSpare(amount, settings) {
  const spare = Math.ceil(amount / settings.roundLevel) * settings.roundLevel - amount;

  if (!settings.enabled) return 0;
  if (spare < settings.minAmount) return 0;
  if (spare > settings.maxAmount) return settings.maxAmount;

  return spare;
}
```

---

## 💳 Payment Flow (Backend)

```text
1. Validate account + PIN
2. Fetch settings
3. Calculate spare
4. Total = amount + spare
5. Deduct from sender
6. Credit receiver
7. Save transaction
8. Add spare → SparePool
9. Check threshold → trigger investment
```

---

## 🔁 Auto-Invest Logic

```js
if (sparePool.totalSpare >= settings.threshold) {
  moveToInvestment();
  sparePool.totalSpare = 0;
}
```

---

## 🌐 API Endpoints

### Auth (Simple)

```http
POST /login
```

---

### Payment

```http
POST /payment/pay
GET  /payment/history
```

---

### Bank

```http
GET /bank/balance
```

---

### Settings

```http
POST /settings/update
GET  /settings
```

---

### Dashboard

```http
GET /dashboard
```

---

## 📱 Frontend Pages

* Home (Scan / Pay)
* Pay (Enter Amount)
* Round-Up Modal ⭐
* PIN Screen
* Success Screen
* Dashboard
* Investment View
* Admin Dashboard

---

## ⭐ Key UX Feature (Judge Winning Moment)

When user enters:

```text
₹187
```

Show:

```text
Rounded to ₹200
Spare Change ₹13
```

👉 This is your **core innovation moment**

---

## 🧪 Demo Plan

1. Seed user with ₹5000

2. Do payments:

   * ₹187 → ₹200
   * ₹92 → ₹100
   * ₹56 → ₹60

3. Show:

   * Spare accumulation
   * Auto-invest trigger
   * Dashboard charts updating

---

## 🧰 Setup Instructions

### Backend

```bash
cd backend
npm install
npm run dev
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

### ngrok (Mobile Demo)

```bash
ngrok http 5173
```

---

## 🔥 Design Decisions (Keep It Simple)

* No JWT / No bcrypt
* PIN stored as plain string
* LocalStorage for session
* Fake QR = account number string
* No real bank API

---

## ⛔ What NOT to Build

* Real payments
* OTP login
* Complex security
* Multi-user scaling

---

## 🚀 Build Phases

### Phase 1 (Day 1)

* Bank simulation
* Login
* Balance + transactions

### Phase 2

* Payment flow
* Round-up modal

### Phase 3

* Spare pool
* Dashboard charts

### Phase 4

* Admin dashboard

---

## 👨‍💻 Author

**NAVEENKUMAR T**

---

## 💡 Final Thought

This project is not about backend complexity.

It’s about:

> “Making investing invisible, automatic, and effortless.”

---
