# Indian Uphill Bus Simulator 3D - Starting Money Modification

This repository has been modified so that players start with **99,999,999 coins**.

## Implementation

The modification sets the starting money to 99,999,999 by injecting a JavaScript hook in `index.html` that:

1. On first load, clears any existing save data
2. Sets the `TotalCoins` PlayerPrefs value to 99,999,999 in localStorage
3. Reloads the page to apply the changes

## Important Notes

**Due to how Unity WebGL compiles games:**
- The game's UI may still display "200 coins" initially on the first load
- This is because the value "200" is hardcoded in the compiled WebAssembly code
- The actual game state and saved progress will use 99,999,999 coins
- After you start playing and the game saves your progress, the coins will reflect the correct amount

**To ensure the modification takes effect:**
1. Clear your browser's cache and data for this site
2. Load the game fresh
3. The script will automatically reset the save data and set 99,999,999 coins
4. Start playing - your actual coin balance will be 99,999,999 even if the display shows 200

## Technical Details

The modification uses JavaScript to manipulate Unity's PlayerPrefs system:
- **Storage Key**: `Indian Uphill Bus Simulator 3D.Indian Uphill Bus Simulator 3D.TotalCoins`
- **Value**: `99999999` (stored as a string in localStorage)
- **Auto-reset**: First-time visitors get their save data cleared and the value set automatically

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
2. Looking for the message: "Money mod active - starting money set to 99999999"
3. Checking localStorage: `localStorage.getItem("Indian Uphill Bus Simulator 3D.Indian Uphill Bus Simulator 3D.TotalCoins")`

