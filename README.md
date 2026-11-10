# Rivvo

![appLogo](client/public/logo.svg)

> **Connect. Share. Live.** — A full-stack social platform built with the MERN stack.

Rivvo is a modern, bilingual (English / العربية) social networking application featuring real-time messaging, stories, an explore feed, notifications, and a complete follower graph. It ships as a monorepo with a React + Vite frontend and a Node/Express + Socket.IO backend, both production-ready and deployable to Vercel and any Node host.

[![Frontend](https://img.shields.io/badge/frontend-React%2018-61DAFB?logo=react&logoColor=white)](#tech-stack)
[![Backend](https://img.shields.io/badge/backend-Node%20%2B%20Express-339933?logo=nodedotjs&logoColor=white)](#tech-stack)
[![Database](https://img.shields.io/badge/database-MongoDB-47A248?logo=mongodb&logoColor=white)](#tech-stack)
[![Realtime](https://img.shields.io/badge/realtime-Socket.IO-010101?logo=socketdotio&logoColor=white)](#tech-stack)
[![i18n](https://img.shields.io/badge/i18n-EN%20%7C%20AR-blue)](#internationalization)

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [API Reference](#api-reference)
8. [Socket.IO Events](#socketio-events)
9. [Database Models](#database-models)
10. [Internationalization](#internationalization)
11. [Theme System](#theme-system)
12. [Deployment](#deployment)
13. [Scripts](#scripts)
14. [Troubleshooting](#troubleshooting)
15. [Contributing](#contributing)
16. [License](#license)

---

## Features

### 🔐 Authentication
- Email / password registration and login with JWT
- Secure password hashing with **bcryptjs** (cost 10)
- Forgot / reset password flow via SMTP (Nodemailer)
- Token-based session persistence (`localStorage` + Bearer header)
- Rate-limited auth endpoints (100 req / 15 min)

### 📱 Posts & Feed
- Create text and image posts (up to 10MB per image, Cloudinary-hosted)
- Home feed with **For You** (all) and **Following** tabs
- Inline caption editing for the post owner
- Delete with confirmation (cascades to comments)
- Like, save, share (native share sheet with clipboard fallback)
- Comments with live per-post updates
- Caption tokenizer renders `#hashtags` → Explore and `@mentions` → profile

### 🧭 Explore
- Full-text search across people and posts
- Hashtag pages (`/explore?tag=vibes`)
- Popular / Latest sorting (popularity = likes + 2× comments)
- Trending hashtags extracted from the last 7 days
- Recent searches persisted in `localStorage`
- Infinite-scrolling grid with skeleton loading

### 📸 Stories
- 24-hour ephemeral stories (auto-expire via `expiresAt`)
- Uploaded via Cloudinary with progress state
- Instagram-style viewer with progress bars and auto-advance
- View tracking (`viewers[]`) drives the "viewed" ring state

### 💬 Real-time Messaging
- 1:1 conversations with live Socket.IO delivery
- Optimistic message bubbles (pending → sent → seen)
- Image attachments (Cloudinary) with thumbnails
- Typing indicators
- Read receipts (double-tick)
- Soft-delete (`deleted` flag, no data loss)
- Pagination with scroll anchoring (no jump when loading older messages)
- Presence (online / offline / last seen)
- Unread badges in navbar, sidebar, mobile nav, and conversation list

### 🔔 Notifications
- Like, comment, follow, and message notifications
- Real-time delivery over Socket.IO
- Unread count badge with `99+` cap
- Mark-as-read on click

### 👥 Social Graph
- Follow / unfollow with instant optimistic UI
- Followers / Following lists in a modal
- "Who to follow" suggestions (sorted by followers count)
- Public profiles with posts grid, stats, and counts

### 🌍 Internationalization
- English (LTR) and Arabic (RTL)
- Full translation coverage — frontend dictionary + backend `Accept-Language`
- Logical CSS properties (`inset-inline-end`, `margin-inline-start`) so layout mirrors correctly
- Localized date (`Intl.RelativeTimeFormat`) and numbers (`Intl.NumberFormat` with `notation: 'compact'`)

### 🎨 Theming
- Dark-first design with light theme toggle
- CSS variables for all tokens
- Persisted choice in `localStorage` (`rivvo_theme`)

---

## Tech Stack

### Frontend
| Layer | Choice |
|---|---|
| Framework | React 18 |
| Build | Vite 5 |
| Routing | React Router v6 |
| State | Redux Toolkit + React-Redux |
| HTTP | Axios (interceptors for auth + language) |
| Realtime | socket.io-client |
| Icons | react-icons/io5 |
| Fonts | Poppins (EN), Tajawal (AR) |

### Backend
| Layer | Choice |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Database | MongoDB + Mongoose 8 |
| Realtime | Socket.IO 4 |
| Auth | JWT (`jsonwebtoken`) + bcryptjs |
| Uploads | Multer (memory) → Cloudinary streaming |
| Email | Nodemailer (SMTP) |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan, custom logger |

### Infrastructure
- **Frontend host:** Vercel (static Vite build)
- **Backend host:** any Node 18+ host (Railway, Fly.io, Render, VPS)
- **Database:** MongoDB Atlas
- **Media:** Cloudinary
- **Email:** any SMTP provider (SendGrid, Mailgun, Gmail app password…)

---

## Architecture
