# Rivvo

**Connect. Share. Live.**

A real-time social media app: profiles, posts, likes/comments, follow system, 24h stories, notifications, and private messaging with online/offline presence via Socket.IO.

## Stack

- **Client:** React (Vite), React Router, Redux Toolkit, Axios, Socket.IO client
- **Server:** Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT auth, Cloudinary (media)

## Getting started

```bash
cp .env.example .env      # fill in JWT_SECRET, MONGO_URI, Cloudinary keys
npm install                # installs root + client + server via workspaces
npm run dev                # runs client (5173) and server (5000) together
```

Or with Docker:

```bash
docker compose up --build
```

## Structure

- `client/src/components/` — UI grouped by domain (post, story, chat, profile, notifications, layout, common)
- `client/src/pages/` — routed pages, incl. `auth/`
- `client/src/context/` — Auth, Socket, Theme providers
- `client/src/store/` — Redux Toolkit slices
- `server/models/` — Mongoose schemas (User, Post, Comment, Story, Follow, Conversation, Message, Notification)
- `server/socket/` — Socket.IO event handlers (chat, presence, notifications)
- `server/controllers` + `server/routes` — REST API, mirrored 1:1

## Status

This is a scaffolded skeleton: folder structure, models, routes/controllers wired end-to-end, and component stubs are in place. Business logic inside components and some controllers is marked `// TODO`.
