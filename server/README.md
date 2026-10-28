# AI Codebase Assistant — Backend Server

Node.js, Express, and TypeScript backend providing the RAG pipeline, vector search aggregation, and repository ingestion workflows.

## Features

- 🐙 **GitHub Repository Ingestion** via GitHub REST API with branch & commit SHA detection
- ✂️ **Smart Syntax-Aware Chunking** (functions/classes) with fallback line-window splitting
- 🛡️ **File Filtering & Hash Dedup** to skip binaries, build folders, and re-embed unchanged files
- 🔮 **Google Gemini Embeddings & LLM** (`text-embedding-004` & `gemini-2.0-flash`)
- 🍃 **MongoDB Atlas Vector Search** with tenant/repo isolation filters
- 🧠 **Architecture Summarizer** automatically generates high-level repo summaries and starter questions
- 🧪 **Comprehensive Vitest Suite** covering chunking, filtering, embeddings, ingestion, and retrieval

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Required |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `GEMINI_API_KEY` | Google AI Studio API key | Yes |
| `GITHUB_TOKEN` | GitHub Personal Access Token (raises rate limit to 5,000 req/hr) | Recommended |
| `PORT` | Express server port (Default: `3001`) | No |
| `CLIENT_URL` | Frontend origin allowed by CORS (Default: `http://localhost:5173`) | No |

## Development Scripts

```bash
# Start in watch/development mode
npm run dev

# Run test suite
npm test

# Build TypeScript to dist/
npm run build

# Start production server
npm start
```
