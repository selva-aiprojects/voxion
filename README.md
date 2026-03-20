# 🎙️ Voxion AI Voice Infrastructure

**Voxion** is a production-grade, sub-second latency AI Voice Engine designed for enterprise-scale customer support and personal assistant automation. 

Build, test, and deploy ultra-realistic AI voice assistants that handle real-world logic, CRM synchronization, and automated follow-up extraction.

---

## 🚀 One-Click Deployment (Render)

Voxion is optimized for **Render**. You can deploy the backend engine immediately using the pre-configured `render.yaml` blueprint.

### 📍 Steps to Deploy:
1.  **Fork/Clone** this repository to your GitHub.
2.  Log in to your **[Render Dashboard](https://dashboard.render.com/)**.
3.  Click **New +** -> **Blueprint**.
4.  Select this repository.
5.  **Configure Environment Variables**:
    *   `OPENAI_API_KEY`: Your (encrypted or raw) OpenAI key.
    *   `ENCRYPTION_KEY`: A 32-character string for secure API key storage.
    *   `DATABASE_URL`: Your PostgreSQL connection string (Railway, Supabase, or Render DB).
6.  **Deploy!** Your API & WebSocket engine will be live in minutes.

---

## 🏗 Project Architecture (Monorepo)

- **`apps/backend`**: NestJS Assistant Orchestration (STT -> LLM -> TTS -> Functional Tools).
- **`apps/dashboard`**: Next.js 15 Enterprise Console (Real-time Diagnostic HUD & Analytics).
- **`packages/database`**: Optimized Drizzle ORM schema for Phone Interaction Logs & Actions.
- **`packages/common`**: Shared TypeScript contracts for zero-latency communication.

---

## 🛠 Features (Standard Enterprise)

- **Sub-Second RTT**: High-performance WebSocket clustering for human-like response speeds.
- **Multimodal Intelligence**: GPT-4o powered reasoning and automated lead identification.
- **Action Extraction**: Business-critical task extraction (e.g., "High Priority Callback").
- **Voice Selection**: Professional human profiles (Voxion-Alloy, Aria, Indigo).
- **Diagnostic Console**: Real-time latency tracking and stream diagnostics.

---

## 📄 Documentation

- **[Intelligence Progress Tracker](./docs/progress.md)**: Real-time status of completion.
- **[Voice Infrastructure PRD](./docs/Enterprise_AI_Call_Assistant_PRD.md)**: Full enterprise requirements.

---

## ⚖️ License
Enterprise Evaluation License. &copy; 2026 Voxion AI Intelligence.
