# Next.js Multiplayer Game Lobby

A real-time multiplayer game lobby system built with Next.js App Router, Tailwind CSS, and Socket.io.

## Features

- **Real-time Room Management**: Create, browse, filter, and join custom game rooms.
- **Matchmaking Queue**: ELO-based auto-matchmaking system that pairs players of similar skill levels.
- **In-Room Chat**: Real-time messaging with quick emoji reactions.
- **Player Ready State**: Coordinate game start with host controls and player ready toggles.
- **Game Settings Configuration**: Custom match modes, max players, and round timers.
- **User Profiles**: Track player stats, win rates, and ELO ratings.
- **Robust Reconnection**: Seamless session recovery on network drops.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server (runs both Next.js and Socket.io server):
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.
