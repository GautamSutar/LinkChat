# 🔗 LinkChat - https://linkchat-seven.vercel.app/

**Connect Instantly, Chat Anonymously. Real-time anonymous chat and video calls.**

LinkChat is a full-stack web application designed to connect people from around the world for spontaneous conversations. It provides a platform for anonymous users to engage in real-time text chat and initiate secure, peer-to-peer video calls.

![LinkChat Welcome](/landing.png)
![LinkChat Chat](/chat.png)
![LinkChat Video](/video.png)

## ✨ Features

-   **Real-Time Text Chat:** Instant messaging with a randomly connected partner.
-   **Anonymous User Matching:** Connect with a new stranger for each session.
-   **Peer-to-Peer (P2P) Video Calls:** High-quality, low-latency video and audio streaming directly between users using WebRTC.
-   **Secure Authentication:** User accounts and WebSocket connections are secured using JWT (JSON Web Tokens).
-   **Live Connection Status:** The UI provides real-time feedback on the connection status.
-   **Responsive Design:** A clean and modern interface that works seamlessly on both desktop and mobile devices.

## 🛠️ Tech Stack

-   **Backend:**
    -   Python, Django, Django REST Framework
    -   Django Channels for WebSocket handling
    -   Daphne / Uvicorn as the ASGI server
    -   Redis for the Channel Layer message broker
-   **Frontend:**
    -   React, TypeScript
    -   Vite for a fast development experience
    -   Tailwind CSS for styling
-   **Real-time Communication:**
    -   **WebSockets:** For signaling and text chat.
    -   **WebRTC:** For peer-to-peer audio and video communication.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have the following software installed on your machine:
-   Python 3.13.2
-   Node.js and npm
-   Redis Server

### 📦 Installation & Setup

**1. Clone the repository:**
```bash
git clone https://github.com/GautamSutar/LinkChat.git
cd linkchat
```

**2. Backend Setup:**
```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
# On Windows (Git Bash / PowerShell):
python -m venv venv
source venv/Scripts/activate

# On macOS / Linux:
python3 -m venv venv
source venv/bin/activate

# Install the required Python packages
pip install -r requirements.txt

# Create a .env file from the example and add your secret key
cp .env.example .env
# now open .env and set your DJANGO_SECRET_KEY

# Apply database migrations
python manage.py makemigrations
python manage.py migrate
```

**2. Frontend Setup:**
# Navigate to the frontend directory from the root
cd frontend

# Install the required npm packages
npm install

# Create a .env file for environment variables like your backend API URL
cp .env.example .env

▶️ **Running the Application**
You will need **two separate terminals** running concurrently to start the backend and frontend servers.
**Terminal 1: Start the Backend ASGI Server**
Make sure your Redis server is running first!
# From the /backend directory with the venv activated
# This command runs the server that handles both HTTP and WebSocket traffic
daphne -p 8001 core.asgi:application
Your backend API and WebSocket server will now be running on http://localhost:8001.

**Terminal 2: Start the Frontend Development Server**
# From the /frontend directory
npm run dev
Your frontend application will now be available at http://localhost:5173 (or another port specified by Vite).

🌐 **Deployment**
To run the backend server in a production-like environment or make it accessible on your local network, use the following command. This binds the server to all available network interfaces.
# From the /backend directory
daphne -b 0.0.0.0 -p 8000 core.asgi:application

🤝 **Contributing**
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.
Fork the Project
Create your Feature Branch (git checkout -b feature/AmazingFeature)
Commit your Changes (git commit -m 'Add some AmazingFeature')
Push to the Branch (git push origin feature/AmazingFeature)
Open a Pull Request

📜 **License**
Distributed under the MIT License. See LICENSE for more information.