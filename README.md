# Indian Uphill Bus Simulator 3D - All Buses Unlocked + Multiplayer

This repository has been modified so that **all buses are unlocked from the start** and includes a **full multiplayer system** for playing with friends with synchronized bus positions!

## Features

### 🚌 All Buses Unlocked
All buses are automatically unlocked when you load the game - no need to earn money or complete challenges. The unlock system:
- Sets unlock keys for 50+ buses using multiple key patterns
- Provides unlimited in-game currency (999,999,999)
- Unlocks all levels and premium features
- Persists across game sessions via localStorage

### 🎮 Multiplayer World Sharing System
Play with friends using peer-to-peer WebRTC connections! The enhanced multiplayer features include:
- **Real-time Bus Synchronization** - See other players' buses in your world
- **Position Tracking** - Visual indicators show where other players are driving
- **Create/Join Rooms** - Host a game or join a friend's room
- **Real-time Chat** - Communicate with other players
- **Player Presence** - See who's online in your room with their bus status
- **No Server Required** - Direct peer-to-peer connections

## How to Use Multiplayer

### Creating a Room (Host)
1. Enter your player name in the multiplayer panel (top-right corner)
2. Click "Create Room"
3. Click "Show Connection Info" to get your connection code
4. Share the connection code with friends (via Discord, text, etc.)
5. When a friend connects and gives you their response, click "Enter Peer's Response" and paste it
6. Once connected, you'll see their bus position in your world!

### Joining a Room (Guest)
1. Enter your player name in the multiplayer panel
2. Click "Join Room"
3. Paste the host's connection info in the text area
4. Click "Connect"
5. Copy your response and send it back to the host
6. Once the host enters your response, you'll be connected and can see each other's buses!

### Chat
Once connected, use the chat box at the bottom of the multiplayer panel to communicate with other players.

### World Sharing
When connected in multiplayer:
- You'll see colored indicators showing where other players' buses are located
- Bus positions are synchronized 20 times per second for smooth tracking
- Each player has a unique color for easy identification

## Technical Implementation

### Bus Unlock System
The modification uses JavaScript to manipulate Unity's PlayerPrefs system by setting multiple unlock key patterns:
- **Unlock Patterns**: 25+ different key patterns including `BusXUnlocked`, `VehicleXUnlocked`, `bus_X_unlocked`, etc.
- **Bus Range**: Sets unlock keys for buses 0-50 across all patterns
- **Currency Keys**: Sets Money, Coins, Cash, Gold, Gems, Credits to 999,999,999
- **Global Flags**: Sets AllBusesUnlocked, UnlockAll, PremiumUnlocked, VIP, etc.
- **Value Formats**: Multiple formats (`1`, `_int`, `_h`) to cover different Unity implementations
- **Method**: Continuous setting during initialization (100 attempts over 10 seconds) plus post-init unlocking

### Multiplayer System
The multiplayer system uses:
- **WebRTC** for peer-to-peer connections (no server required)
- **Data Channels** for real-time message passing
- **STUN servers** for NAT traversal (5 Google public STUN servers for reliability)
- **BusSyncManager** for real-time bus position synchronization

The system supports:
- Up to 8 players per room
- Real-time chat messaging
- Player presence tracking
- **Bus position synchronization at 20 updates/second**
- Visual bus indicators showing other players' positions
- Automatic cleanup when players disconnect

### World Synchronization
The BusSyncManager enables "running in each other's worlds" by:
- Broadcasting local bus position, rotation, and velocity to all peers
- Receiving and rendering remote player bus positions
- Using position interpolation for smooth visual updates
- Creating visual indicators for remote buses with player names and colors
- Dispatching custom events for Unity game integration

## Verification

### Bus Unlock
You can verify the bus unlock modification is active by:
1. Opening the browser console (F12)
2. Looking for the messages:
   - "[Bus Unlock] Unlocking all buses"
   - "[Bus Unlock] All bus unlock keys and currency have been set"
3. All buses should be available for selection in the game

### Multiplayer
You can verify the multiplayer system is active by:
1. Looking for the multiplayer panel in the top-right corner
2. Opening the browser console (F12)
3. Looking for the messages:
   - "[Multiplayer] System initialized"
   - "[BusSync] Started bus state synchronization" (when in a room)

## Files

- `index.html` - Main game page with enhanced bus unlock script and multiplayer integration
- `multiplayer.js` - Complete multiplayer system with bus synchronization
- `Build/` - Unity WebGL game build files
- `TemplateData/` - Unity template assets (styles, loading screen)

## API for Developers

The multiplayer system exposes APIs for external use:

```javascript
// Get the multiplayer manager
const mp = window.multiplayerManager;

// Get all connected players
mp.getPlayers();

// Get remote bus states for custom rendering
mp.getRemoteBusStates();

// Broadcast custom game state
mp.broadcastGameState({ score: 100, level: 5 });

// Listen for game state updates
window.addEventListener('multiplayerGameState', (e) => {
  console.log('Game state from peer:', e.detail);
});
```
