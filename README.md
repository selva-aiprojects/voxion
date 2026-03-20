# 📞 AI Voice Call Assistant Platform (Vapi Engine)

This is an enterprise-grade AI Voice Call Assistant platform that answers phone calls, understands caller intent, and generates structured actions with follow-up workflows.

## 🏗 Project Structure

- `apps/backend`: NestJS API & AI Orchestration layer.
- `apps/dashboard`: Next.js web dashboard for data visualization and management.
- `packages/common`: Shared TypeScript interfaces and types.
- `packages/database`: Drizzle ORM schema and database configuration.
- `docs/`: Product Requirements and Technical Documentation.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Docker (for PostgreSQL)
- OpenAI API Key (or AWS Bedrock credentials)
- Deepgram API Key (for STT)
- ElevenLabs API Key (for TTS)

### Installation

1. Install dependencies from the root:
   ```bash
   npm install
   ```

2. Setup environment variables (coming soon).

3. Run in development mode:
   ```bash
   npm run dev
   ```

## 🛠 Features

- **Personal Mode**: AI call screening and summaries.
- **Organization Mode**: Multi-tenant routing and CRM integrations.
- **Real-time AI**: Sub-2s latency using WebSocket streaming.
- **Action Extraction**: Structured JSON output for automated follow-ups.

## 📄 Documentation

- [Product Requirements (PRD)](./docs/Enterprise_AI_Call_Assistant_PRD.md)
- [Development Plan](./docs/development_plan.md) (Work in Progress)
