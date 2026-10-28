# Voice4Ace 🎙️🤖

An intelligent vocal DNA analyzer and song-matching web platform featuring an interactive 3D mascot, Ace Bot. Built for the hackathon.

## 🚀 Overview
Voice4Ace captures short vocal inputs, extracts acoustic and musical features (pitch, timbre, spectral metrics) using Librosa, and passes them to a recommendation pipeline to map vocal signatures to compatible songs. The interface incorporates an interactive 3D companion rendered with Three.js.

## 🛠️ Tech Stack
- **Frontend:** React, TypeScript, Three.js / React Three Fiber, Tailwind CSS
- **Backend:** Python, FastAPI, Uvicorn
- **Audio Analysis:** Librosa, NumPy, SoundFile
- **Inference & AI:** Ollama / Local LLM Pipeline

## 📁 Project Structure
- `/frontend` - Web client and 3D mascot interface
- `/backend` - FastAPI endpoints and audio feature extraction pipeline

## ⚙️ Running Locally
1. **Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload

2. **Frontend:**
   ```Bash
   cd frontend
   npm install
   npm run dev

## 📜 License
This project is licensed under the MIT License - see the [LICENSE file](https://github.com/Ujjwal-Jain-sys/Voice4Ace/blob/main/LICENSE) for details.