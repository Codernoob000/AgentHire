# AgentHire
# 🚀 AgentHire

AI-powered freelancer hiring platform with Algorand blockchain payments.

---

## 🎯 Project Overview

AgentHire allows clients to:

1. Post a project
2. Get AI-based freelancer recommendations
3. Hire freelancers
4. Secure payment using Algorand blockchain

---

## 🧠 Core Feature (MVP)

👉 AI Freelancer Selection + Blockchain Payment

Flow:

Client → AI recommends → Hire → Payment locked → Transaction ID generated

---

## 🏗 Tech Stack

* **Frontend:** React (in progress)
* **Backend:** FastAPI (Python)
* **Blockchain:** Algorand (Testnet)
* **AI Logic:** Rule-based scoring (skills + rating + experience)

---

## 📡 Backend Setup

### Run Backend

```bash
cd backend
uvicorn main:app --reload
```

Server runs at:
http://127.0.0.1:8000

````

---

## 📡 API Endpoints

### 🔹 POST /recommend

Get best freelancer based on project description

**Request:**
```json
{
  "description": "Need React developer"
}
````

**Response:**

```json
{
  "recommended_freelancer": "John",
  "rating": 4.8,
  "experience": 3,
  "match_score": 12.8
}
```

---

### 🔹 POST /hire

Hire freelancer and initiate payment

**Request:**

```json
{
  "freelancer": "John"
}
```

**Response:**

```json
{
  "message": "John hired successfully",
  "tx_id": "TXNJOHN123"
}
```

---

## 🧩 Project Structure

```
AgentHire/
├── frontend/
├── backend/
│   └── main.py
├── blockchain/
└── README.md
```

---

## 🔗 Integration Flow

Frontend → Backend → AI → Blockchain → Transaction ID → UI

---

## ⚠️ Current Status

* ✅ Backend APIs completed
* 🔄 Frontend integration in progress
* 🔄 Blockchain integration in progress

---

## 🏆 Demo Flow (For Judges)

1. User enters project
2. AI recommends freelancer
3. User clicks hire
4. Payment processed via blockchain
5. Transaction ID displayed

---

## 👥 Team Roles

* Frontend: UI + API integration
* Backend: AI logic + APIs
* Blockchain: Algorand payment

---

## 🔥 Future Improvements

* Real AI model (LLM-based matching)
* Smart contract escrow release
* Freelancer profiles database
* User authentication

---
