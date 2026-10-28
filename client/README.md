# AI Codebase Assistant — Web Client

A modern, responsive React interface built with TypeScript, Vite, and Tailwind CSS for indexing GitHub repositories and querying them with AI-powered answers and source citations.

## Features

- ⚡ **Vite + React 18 + TypeScript** for rapid development and solid type safety
- 🎨 **Tailwind CSS UI** with dark mode aesthetics, glassmorphism cards, and responsive layout
- 💬 **Interactive Chat & Query History** with markdown rendering, syntax highlighting, and copy-code actions
- 📌 **Interactive Source Citations** with file badges, line numbers, and direct GitHub links
- 📊 **Architecture Overview Card** displaying tech stack badges, key modules, and one-click starter questions
- 🔄 **Real-Time Indexing Status** with animated progress indicator and polling

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` (or configure your environment variables):

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Express server URL | `http://localhost:3001` |

### 3. Run Development Server

```bash
npm run dev
```

The client will be running at [http://localhost:5173](http://localhost:5173).

### 4. Build for Production

```bash
npm run build
```
