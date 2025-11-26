# Indian Uphill Bus Simulator 3D - Starting Money Modification

This repository has been modified so that players start with **999,999,999 coins**.

## Implementation

The modification sets the starting money to 999,999,999 by injecting a JavaScript hook in `index.html` that:

1. On first load, clears any existing save data
2. Sets the `TotalCoins` PlayerPrefs value to 999,999,999 in localStorage
3. Reloads the page to apply the changes

## Important Notes

**Due to how Unity WebGL compiles games:**
- The game's UI may still display "200 coins" initially on the first load
- This is because the value "200" is hardcoded in the compiled WebAssembly code
- The actual game state and saved progress will use 999,999,999 coins
- After you start playing and the game saves your progress, the coins will reflect the correct amount

**To ensure the modification takes effect:**
1. Simply refresh the page - the script automatically detects money amount changes
2. The script will reset the save data and set 999,999,999 coins
3. Start playing - your actual coin balance will be 999,999,999 even if the display shows 200

**Note:** If you previously visited with an older version, the script will automatically detect the change and reset your game data to apply the new starting money amount.

## Technical Details

The modification uses JavaScript to manipulate Unity's PlayerPrefs system:
- **Storage Key**: `Indian Uphill Bus Simulator 3D.Indian Uphill Bus Simulator 3D.TotalCoins`
- **Value**: `999999999` (stored as a string in localStorage)
- **Auto-reset**: Automatically resets when the starting money amount changes
- **Version tracking**: Uses a versioned flag (`_moneyModApplied_999999999`) to detect changes

## Why Not Modify the Binary?

Changing the hardcoded initial display value would require:
- Decompiling the WebAssembly binary
- Finding and replacing the specific value (risky - the value "200" appears 203 times)
- Recompiling without breaking the game
- This approach was tested and caused game crashes

The current JavaScript solution is **safer, more maintainable, and doesn't risk breaking the game**.

## Verification

You can verify the modification is active by:
1. Opening the browser console (F12)
2. Looking for the message: "Money mod active - starting money set to 999999999"
3. Checking localStorage: `localStorage.getItem("Indian Uphill Bus Simulator 3D.Indian Uphill Bus Simulator 3D.TotalCoins")`

