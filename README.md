# 🚀 DROPCHAT - Real-Time Communication Reimagined

**DROPCHAT** is a full-stack web application that delivers seamless real-time communication, blending cutting-edge technologies like WebRTC and Socket.IO for smooth messaging and audio/video calling. Designed with performance, user experience, and scalability in mind, DROPCHAT is more than just a chat app—it's a complete communication platform.

---

## 🌐 Overview

DROPCHAT combines a **React + Vite** frontend with a robust **Node.js + Express** backend and **MongoDB** for persistent data storage. The system is further enhanced with **Socket.IO** for real-time messaging, **WebRTC** for peer-to-peer media streaming, **Redis** for caching, and **Twilio** for SMS capabilities.

---

## ✨ Features

### 🖥️ Frontend

- ⚛️ **React + Vite**: Blazing-fast performance and modern developer experience.
- 🎨 **Tailwind CSS + Bootstrap**: Responsive, clean, and beautiful UI.
- 📡 **Firebase Authentication**: Secure user sign-up, login, and management.
- ⚙️ **Axios**: Smooth API communication.
- 🧭 **React Router DOM**: Intuitive and flexible routing.
- 🎬 **Framer Motion**: Delightful and interactive UI animations.
- 🔌 **Socket.IO Client**: Instant real-time updates for chats and calls.

### 🔒 Backend

- 🧠 **Express.js + Node.js**: Scalable REST API architecture.
- 📦 **MongoDB + Mongoose**: Flexible schema modeling and fast document storage.
- 🔐 **JWT**: Secure token-based authentication.
- ⚡ **Redis**: Session caching and message delivery optimization.
- 💬 **Socket.IO**: Real-time bidirectional communication for messaging and signaling.
- 📞 **Twilio Integration**: Send SMS alerts and notifications.
- 🔐 **CORS & Body-Parser**: Secure and clean API communication.

---

## 📹 WebRTC: Peer-to-Peer Calling

DROPCHAT introduces **WebRTC (Web Real-Time Communication)** for high-quality audio/video calling:

- 🔁 **Direct Peer Connections**: Enables P2P media stream exchange with minimal latency.
- 📞 **One-to-One Audio/Video Calls**: Easily initiate calls within chat windows.
- 🔄 **Negotiation via Socket.IO**: Efficient signaling with custom WebRTC offers/answers and ICE candidate exchange.
- 🧩 **Dynamic Stream Handling**: Real-time toggling of audio/video tracks.
- ✅ **Fallback & Error Handling**: Smart reconnection and UI feedback on call drops.
- 🔔 **In-App Call UI**: Ring tones, answer/decline interface, and on-call status.

---

## 🧰 Tech Stack

### Frontend

- `React`
- `Vite`
- `Tailwind CSS`
- `Bootstrap`
- `Axios`
- `Firebase`
- `Framer Motion`
- `React Router DOM`
- `Socket.IO-client`

### Backend

- `Node.js`
- `Express.js`
- `MongoDB`
- `Mongoose`
- `Redis`
- `JWT Authentication`
- `Twilio`
- `Firebase`
- `Socket.IO`
- `CORS`, `Body-Parser`

---

## ⚙️ Installation & Setup

### 🔧 Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB instance (local/cloud)

---

### 🧱 Backend Setup

```bash
cd backend
npm install
npm start
```

#### Create a `.env` file in `/backend`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
REDIS_URL=your_redis_url
TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```

---

### 🎨 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Usage

1. Start the backend server:

   ```bash
   npm start
   ```

2. Run the frontend:

   ```bash
   npm run dev
   ```

3. Open the app in your browser: `http://localhost:5173`

4. Register/Login using Firebase

5. Start chatting or initiate a voice/video call 🎧📹

---

## 📜 License

This project is licensed under the **MIT License**.  
Feel free to fork, improve, and contribute!

---

## 👨‍💻 Contributors

- **Anubhav Pandit** - Developer, Architect, and Maintainer

---

## 🌍 Let's DROP the Chat—Connect Smarter.

DROPCHAT is your go-to for real-time, reliable, and modern communication. Whether it's messaging, audio, or video—**DROPCHAT drops delays and lifts conversations.**
