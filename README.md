# KnightChess Frontend

A world-class chess platform frontend built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- 🎨 **Professional Dark Theme UI/UX** - Beautiful, modern, and eye-catching design
- ♟️ **Interactive Chess Board** - Full chess game functionality with move validation
- 🏆 **Tournaments** - Create and join chess tournaments
- 👥 **Social Features** - Friends, chat, and groups
- 📊 **Leaderboard** - Track ratings and rankings
- 🔔 **Real-time Notifications** - Stay updated with game invites and messages
- ⚡ **Fast & Responsive** - Built with Vite for optimal performance
- 🎯 **Type-Safe** - Full TypeScript support

## Tech Stack

- **React 19** - Latest React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing
- **Chess.js** - Chess game logic
- **Axios** - HTTP client
- **React Hot Toast** - Beautiful notifications

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```bash
VITE_API_URL=http://localhost:3000/api
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── services/      # API service layer
├── store/         # Zustand state management
├── types/         # TypeScript type definitions
└── App.tsx        # Main app component with routing
```

## Features Overview

### Authentication
- User registration and login
- JWT token-based authentication
- Protected routes

### Games
- Create custom games with time controls
- Join existing games
- Interactive chess board
- Move history
- Game resignation

### Tournaments
- Create tournaments
- Join tournaments
- View tournament standings
- Multiple tournament formats

### Social
- Friend requests and management
- Real-time chat
- User profiles
- Activity feed

### Statistics
- Personal statistics dashboard
- Win/loss/draw records
- Rating tracking
- Leaderboard rankings

## API Integration

The frontend integrates with the KnightChess backend API gateway running on port 3000. Make sure the backend services are running before starting the frontend.

## Development

The project uses:
- **ESLint** for code linting
- **TypeScript** for type checking
- **Vite** for fast HMR (Hot Module Replacement)

## License

Private project - All rights reserved
