# TutHub

A tutor and learning management platform built with React 19, Vite, React Router, Drizzle ORM, Supabase, and Framer Motion.

## Structure

- `web-app/` — React frontend (Vite + React Router)
- `todo.md` — Project task list
- `schema (1).ts` — Database schema definition

## Getting Started

```bash
cd web-app
npm install
npm run dev     # start Vite dev server
npm run build   # production build
```

## Tech Stack

- React 19 + React Router 7
- Vite 5
- Drizzle ORM + PostgreSQL (via Supabase)
- Framer Motion, Lucide React icons

## MCP server

This application ships a dependency-free [Model Context Protocol](https://modelcontextprotocol.io)
server (`mcp-server/server.mjs`) exposing its core operations to agentic clients.
It speaks JSON-RPC 2.0 over stdio and adds no runtime dependencies.

Add the repository's [`.mcp.json`](.mcp.json) to your MCP client, or run:

```bash
node mcp-server/server.mjs
```

Protocol smoke tests:

```bash
python3 -m unittest discover -s tests -p "test_mcp_server.py" -v
```

See [docs/MCP.md](docs/MCP.md) and [mcp-server/README.md](mcp-server/README.md).
