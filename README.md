# Indian Uphill Bus Simulator 3D

## Starting Money Modification

This game has been modified so that players start with **99,999,999 coins** instead of the default 200 coins.

### How It Works

The modification uses JavaScript hooks in `index.html` to set the starting money value:

1. **localStorage**: Sets the `TotalCoins` value to 99,999,999 in browser localStorage
2. **PlayerPrefs Hook**: Intercepts Unity's initialization to inject the money value
3. **IndexedDB**: Ensures the value is persisted in Unity's file system

###  Implementation Details

The starting money is set through the following mechanisms:

- **JavaScript Hook**: The `index.html` file contains a script that runs before the Unity game loads
- **PlayerPrefs Key**: `Indian Uphill Bus Simulator 3D.Indian Uphill Bus Simulator 3D.TotalCoins`
- **Value**: 99999999 (99,999,999)

### Note

Due to how Unity WebGL games compile and load, the initial display may still show the default value (200 coins) briefly. However, the saved/persistent value will be 99,999,999 coins. This means:

- On first load, you may see 200 coins initially
- Once you play and the game saves your progress, you'll have 99,999,999 coins
- On subsequent loads, you'll start with 99,999,999 coins from the saved data

To force the modification to take effect immediately, clear your browser's localStorage and IndexedDB for this site before loading the game for the first time.

### Technical Constraints

Modifying the hardcoded initial value in a compiled Unity WebGL game requires:
- Decompiling/modifying the WebAssembly binary (complex and error-prone)
- Or access to the original Unity project source code

The current JavaScript-based approach is the safest and most maintainable solution that doesn't risk breaking the game.
