# Unity WebGL Game Decompilation Guide

This document explains how to decompile and modify the Unity WebGL game assets for "Indian Uphill Bus Simulator 3D".

## Decompilation Results Summary

I successfully decompressed and analyzed the game assets using UnityPy. Here are the key findings:

### Discovered Game Objects
- **Buses**: `Bus_1E` through `Bus_7E` (7 buses total)
- **IAP Unlock**: `IAPUnloackAllBus` (note: typo in original game code!)
- **Levels**: `Level_01` through `Level_20` (20 levels)
- **UI Objects**: `UnlockAllBus`, `VehicleShop`, `Garage`, `GaragePanel`, `Shop`

### Discovered PlayerPrefs Keys (from strings analysis)
| Key | Type | Description |
|-----|------|-------------|
| `TotalCoins` | int | Player's total coins/currency |
| `SelectedBus` | int | Currently selected bus index |
| `NumOfLevelsUnlocked` | int | Number of unlocked levels |
| `LevelAllUnlock` | int/bool | Flag to unlock all levels |
| `Current_Level` | int | Current level |
| `LifeMaxDistanceTravelled` | float | Maximum distance achievement |
| `UnlockedCharacterName` | string | Name of unlocked character |
| `IsTutorialCompleted` | int/bool | Tutorial completion flag |

## File Structure

The Unity WebGL build consists of these files in the `Build/` directory:

| File | Description | Size (compressed) |
|------|-------------|-------------------|
| `IndianUphillBusSimulator3D-1_0.data.unityweb` | Game assets (textures, models, audio, scripts) | ~24 MB |
| `IndianUphillBusSimulator3D-1_0.wasm.code.unityweb` | WebAssembly binary (compiled C# code) | ~6.7 MB |
| `IndianUphillBusSimulator3D-1_0.wasm.framework.unityweb` | Unity framework JavaScript | ~549 KB |
| `UnityLoader.js` | Unity WebGL loader | ~157 KB |
| `IndianUphillBusSimulator3D-1_0.json` | Build configuration | ~494 B |

All `.unityweb` files are **gzip compressed**.

## Decompression Steps

### Step 1: Decompress the Data File
```bash
# Copy and decompress the data file
cp Build/IndianUphillBusSimulator3D-1_0.data.unityweb data.gz
gunzip data.gz
mv data IndianUphillBusSimulator3D-1_0.data
```

### Step 2: Decompress the WASM Code
```bash
cp Build/IndianUphillBusSimulator3D-1_0.wasm.code.unityweb wasm.gz
gunzip wasm.gz
# Results in a WebAssembly binary module
```

## Data File Format

The decompressed data file uses the `UnityWebData1.0` format:

```
Header: "UnityWebData1.0\0"
File entries:
  - Offset (4 bytes)
  - Length (4 bytes)
  - Filename length (4 bytes)
  - Filename (variable)
  - Data...
```

### Contents Found in Data File
- `Resources/unity_default_resources` - Default Unity resources
- `Managed/mono/2.0/machine.config` - Mono configuration
- `Il2CppData/Metadata/global-metadata.dat` - IL2CPP metadata (contains type info)
- `boot.config` - Boot configuration
- `data.unity3d` - Main game asset bundle
- `resources.resource` - Resources
- `sharedassets0.resource` - Shared assets 0
- `sharedassets1.resource` - Shared assets 1

## Tools Required for Full Decompilation

### For Unity Assets (.unity3d, .resource files)
1. **AssetStudio** (https://github.com/Perfare/AssetStudio)
   - Extract textures, models, audio, scripts
   - View and export assets
   
2. **Unity Asset Bundle Extractor (UABE)** (https://github.com/SeriousCache/UABE)
   - Modify asset bundles
   - Replace textures/models
   - Edit serialized data

### For IL2CPP Metadata (global-metadata.dat)
1. **Il2CppDumper** (https://github.com/Perfare/Il2CppDumper)
   - Extracts class/method information from IL2CPP builds
   - Generates header files for reverse engineering
   
2. **Cpp2IL** (https://github.com/SamboyCoding/Cpp2IL)
   - More advanced IL2CPP analysis
   - Can reconstruct some IL code

### For WebAssembly Analysis
1. **wasm2wat** (from wabt toolkit)
   - Convert WASM binary to text format
   - `wasm2wat game.wasm -o game.wat`

2. **Ghidra** with WASM plugin
   - Full disassembly and decompilation
   - Function analysis

## Modifying the Game

### Option 1: Modify PlayerPrefs via JavaScript (Limited)
The game stores data in localStorage. While this won't unlock vehicles permanently, it can give unlimited coins:

```javascript
// Set in browser console or inject via index.html
localStorage.setItem('Indian Uphill Bus Simulator 3D.Indian Uphill Bus Simulator 3D.TotalCoins', '999999999');
localStorage.setItem('Indian Uphill Bus Simulator 3D.Indian Uphill Bus Simulator 3D.NumOfLevelsUnlocked', '100');
localStorage.setItem('Indian Uphill Bus Simulator 3D.Indian Uphill Bus Simulator 3D.LevelAllUnlock', '1');
```

**Note**: This may not work reliably because the game's unlock logic is compiled into the WASM binary.

### Option 2: Modify Asset Bundles (Recommended)
1. Extract `data.unity3d` and `sharedassets*.resource` using AssetStudio
2. Find vehicle unlock data in serialized MonoBehaviour scripts
3. Modify the unlock conditions or prices
4. Repack using UABE or Unity's AssetBundle building

### Option 3: Patch WASM Binary (Advanced)
1. Disassemble WASM to WAT format
2. Find the unlock check functions (look for PlayerPrefs.GetInt calls)
3. Patch the comparison instructions to always return true
4. Reassemble and recompress

## Recompression

After modifications, recompress the files:

```bash
# Compress with gzip using Unix-style header
gzip -9 -n IndianUphillBusSimulator3D-1_0.data
mv IndianUphillBusSimulator3D-1_0.data.gz IndianUphillBusSimulator3D-1_0.data.unityweb
```

## Unity Version

The game was built with **Unity 2018.3.11f1** (found in data file header).

## Limitations

1. **WASM Compilation**: The C# game logic is compiled to WebAssembly via IL2CPP. Direct C# modification is not possible without full recompilation.

2. **Asset Bundle Encryption**: If asset bundles are encrypted (this game doesn't appear to use encryption), additional steps would be needed.

3. **Server Validation**: The game communicates with Y8's achievement system. Some progress may be server-validated.

## Security Considerations

This documentation is for educational purposes. Modifying game files may:
- Violate terms of service
- Prevent online features from working
- Cause instability or crashes

Always keep backups of original files.
