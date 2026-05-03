# 🍳 Click & Cook – Smart Kitchen Companion

![Click & Cook Header](https://raw.githubusercontent.com/eishasohail/Click-and-Cook-/main/client/public/bg10.jpg)

### **Transform your pantry into a gourmet kitchen with the power of AI.**

Click & Cook is a high-fidelity, AI-driven culinary platform designed to eliminate food waste and inspire home chefs. By leveraging the **Google Gemini Pro** model, the platform generates creative, step-by-step recipes based on the ingredients you already have.

---

## ✨ Core Features

*   **🪄 AI Recipe Generator**: Input your available ingredients and dietary preferences to receive a personalized, world-class recipe in seconds.
*   **📚 My CookBook**: Save your favorite AI-generated masterpieces into a beautifully organized digital library.
*   **🎯 Personalized Picks**: A smart recommendation engine that learns your palate and suggests new dishes you'll love.
*   **📊 Chef Dashboard**: Track your culinary journey with real-time stats on recipes generated, saved, and active cooking days.
*   **🔐 Seamless Auth**: Secure login and signup, including **Google OAuth** for a friction-less experience.
*   **🌟 Live Community Reviews**: Share your experiences and see what other chefs are cooking up in our real-time feedback marquee.

---

## 🚀 Tech Stack

### **Frontend**
*   **React + Vite**: High-performance, modern frontend architecture.
*   **Redux Toolkit**: Centralized state management for auth and user data.
*   **Framer Motion**: Smooth, premium micro-animations and transitions.
*   **Tailwind CSS**: Utility-first styling for a sleek, responsive UI.
*   **Lucide React**: Clean, consistent iconography.

### **Backend**
*   **Node.js & Express**: Robust and scalable server-side logic.
*   **PostgreSQL**: Relational database for secure user and recipe storage.
*   **Google Gemini API**: Powering the advanced AI recipe generation and follow-up chat.

---

## 🛠 Installation & Setup

### **1. Clone the Repository**
```bash
git clone https://github.com/eishasohail/Click-and-Cook-.git
cd Click-and-Cook-
```

### **2. Backend Configuration**
1. Navigate to the `server` directory: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.template`:
   ```env
   DATABASE_URL=your_postgresql_url
   GEMINI_API_KEY=your_gemini_api_key
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```
4. Start the server: `npm start`

### **3. Frontend Configuration**
1. Navigate to the `client` directory: `cd ../client`
2. Install dependencies: `npm install`
3. Create a `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```
4. Start the development server: `npm run dev`

---

## 🎨 Design Philosophy

Click & Cook follows a **"Warm Gourmet"** aesthetic, utilizing a palette of deep reds (`#75070C`), earthy tones (`#F0E6DA`), and vibrant greens (`#4F6815`). The interface is designed to feel alive, with glassmorphism effects, dynamic gradients, and fluid interactions that make cooking feel like a premium experience.

---

## 📄 License

This project is part of a specialized portfolio evaluation. All rights reserved © 2026.

---

## 👥 Contributors
Ifra Rizwan
Menahil ALi
Maryam Rizwan
---

**Built with ❤️ by the Click & Cook Team.**
