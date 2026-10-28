# 🎙️ Voice4Ace — 30-Second Vocal DNA Analyzer & AI Song Matcher

[![MLH Hackathon](https://img.shields.io/badge/MLH-Hackathon_Submission-E73427?style=for-the-badge)](https://mlh.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Gemma_4-FF6F00?style=for-the-badge)](https://ollama.com/)

> **Discover the mathematical blueprint of your voice in 30 seconds.**  
> **Voice4Ace** captures a 30-second vocal sample, extracts acoustic biomarkers using **Librosa**, and pairs your unique vocal profile with tailored song recommendations using a custom-configured **Ollama (Gemma 4)** model—all guided by **Ace Bot**, an interactive 3D mascot built with **Three.js**.

---

## ✨ Key Features

* **⏱️ 30-Second Vocal DNA Profiling:** Captures vocal audio and uses **Librosa** to extract fundamental frequency ($F_0$), vocal range, timbre brightness (spectral centroid), pitch stability, and MFCC acoustic signatures.
* **🤖 Interactive 3D Mascot (Ace Bot):** A real-time 3D companion rendered with **Three.js** that reacts dynamically to voice input, processing states, and vocal results.
* **🧠 Custom Ollama Modelfile Integration:** Uses a specialized `modelfile` built on **Gemma 4** to translate raw DSP audio metrics into human-readable vocal archetypes and song matches locally.
* **⚡ Full-Stack Vite + FastAPI Architecture:** Low-latency asynchronous **FastAPI** backend (`main.py`) paired with a responsive **React + TypeScript + Vite** frontend.

---

## 🛠️ Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend & 3D** | React, TypeScript, Vite, Three.js, Lucide React, CSS3 |
| **Backend API** | Python, FastAPI, Uvicorn |
| **Audio Signal Processing** | Librosa, NumPy, SoundFile |
| **Local AI Inference** | Ollama (`gemma4` with custom `modelfile`) |
| **Deployment & Tooling** | Vercel (Frontend), Git, Oxlint |

---

## 📂 Project Structure

```text
Voice4Ace/
├── backend/
│   ├── main.py              # FastAPI server, Librosa DSP pipeline & Ollama API integration
│   ├── modelfile            # Custom Ollama Modelfile (vocal coach system prompt & parameters)
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── src/                 # React + TypeScript components & Three.js Ace Bot 3D scene
│   ├── index.html           # Main HTML entry point
│   ├── package.json         # Frontend scripts and dependencies
│   ├── tsconfig.json        # TypeScript compiler configuration
│   └── vite.config.ts       # Vite bundler configuration
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
* **Python** (3.10+)
* **Node.js** (v18+)
* **Ollama** installed locally ([ollama.com](https://ollama.com/))

### 1. Clone the Repository
```bash
git clone [https://github.com/Ujjwal-Jain-sys/Voice4Ace.git](https://github.com/Ujjwal-Jain-sys/Voice4Ace.git)
cd Voice4Ace
```

### 2. Configure the Custom Ollama Model
Inside the `backend/` directory, build the custom model using the included `modelfile`:
```bash
cd backend
ollama create voice4ace -f modelfile
```
*(Or ensure `gemma4` is pulled and running via `ollama run gemma4`.)*

### 3. Start the FastAPI Backend
In the `backend/` folder, install the Python dependencies and start the Uvicorn server:
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*The backend API will run at `http://localhost:8000` (Interactive Swagger docs at `http://localhost:8000/docs`).*

### 4. Start the React + Three.js Frontend
Open a new terminal in the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser to interact with **Ace Bot** and analyze your voice!*

---

## 👨‍💻 Contributors

* **Ujjwal Jain** — *Architecture, Audio DSP Pipeline, 3D Integration & Full-Stack Development* — [@Ujjwal-Jain-sys](https://github.com/Ujjwal-Jain-sys)

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full details.