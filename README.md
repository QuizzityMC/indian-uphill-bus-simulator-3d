# Indian Uphill Bus Simulator 3D - All Buses Unlocked + Multiplayer

This repository has been modified so that **all buses are unlocked from the start** and includes a **multiplayer system** for playing with friends!

## Features

### 🚌 All Buses Unlocked
All buses are automatically unlocked when you load the game - no need to earn money or complete challenges.

### 🎮 Multiplayer System
Play with friends using peer-to-peer WebRTC connections! Features include:
- **Create/Join Rooms** - Host a game or join a friend's room
- **Real-time Chat** - Communicate with other players
- **Player Presence** - See who's online in your room
- **No Server Required** - Direct peer-to-peer connections

## How to Use Multiplayer

### Creating a Room (Host)
1. Enter your player name in the multiplayer panel (top-right corner)
2. Click "Create Room"
3. Click "Show Connection Info" to get your connection code
4. Share the connection code with friends (via Discord, text, etc.)
5. When a friend connects and gives you their response, click "Enter Peer's Response" and paste it

### Joining a Room (Guest)
1. Enter your player name in the multiplayer panel
2. Click "Join Room"
3. Paste the host's connection info in the text area
4. Click "Connect"
5. Copy your response and send it back to the host
6. Once the host enters your response, you'll be connected!

### Chat
Once connected, use the chat box at the bottom of the multiplayer panel to communicate with other players.

## Technical Implementation

### Bus Unlock System
The modification uses JavaScript to manipulate Unity's PlayerPrefs system by setting multiple unlock key patterns:
- **Pattern Examples**: `BusXUnlocked`, `VehicleXUnlocked`, `bus_X_unlocked`, `UnlockedBusX`, etc.
- **Range**: Sets unlock keys for buses 0-20 across all patterns
- **Value**: `1` (stored as a string in localStorage to indicate unlocked state)
- **Method**: Continuous setting during initialization to ensure Unity reads the correct values

### Multiplayer System
The multiplayer system uses:
- **WebRTC** for peer-to-peer connections (no server required)
- **Data Channels** for real-time message passing
- **STUN servers** for NAT traversal (Google's public STUN servers)

The system supports:
- Up to 8 players per room
- Real-time chat messaging
- Player presence tracking
- Automatic reconnection handling

## Verification

### Bus Unlock
You can verify the bus unlock modification is active by:
1. Opening the browser console (F12)
2. Looking for the message: "[Bus Unlock] Unlocking all buses"
3. All buses should be available for selection in the game

### Multiplayer
You can verify the multiplayer system is active by:
1. Looking for the multiplayer panel in the top-right corner
2. Opening the browser console (F12)
3. Looking for the message: "[Multiplayer] System initialized"

## Files

- `index.html` - Main game page with bus unlock script and multiplayer integration
- `multiplayer.js` - Complete multiplayer system implementation
- `Build/` - Unity WebGL game build files
- `TemplateData/` - Unity template assets (styles, loading screen)

