# Indian Uphill Bus Simulator 3D - Starting Money Modification

This repository has been modified so that players start with **999,999,999 coins**.

## Implementation

The modification sets the starting money to 999,999,999 by injecting a JavaScript hook in `index.html` that:

1. Sets the `TotalCoins` PlayerPrefs value to 999,999,999 in localStorage immediately
2. Continuously sets the value during Unity's initialization (first 5 seconds)
3. Sets it one final time after Unity runtime initialization completes

This aggressive approach ensures the value is set regardless of when Unity reads from localStorage.

## Important Notes

**The game will now start with 999,999,999 coins every time you load the page.**

- The script runs continuously during initialization to override any default values
- Works on first load and all subsequent loads
- No need to clear cache or cookies

## Technical Details

The modification uses JavaScript to manipulate Unity's PlayerPrefs system:
- **Storage Key**: `Indian Uphill Bus Simulator 3D.Indian Uphill Bus Simulator 3D.TotalCoins`
- **Value**: `999999999` (stored as a string in localStorage)
- **Method**: Continuous setting during initialization to ensure Unity reads the correct value

## Verification

You can verify the modification is active by:
1. Opening the browser console (F12)
2. Looking for the message: "[Money Mod] Setting starting money to 999999999"
3. Checking localStorage: `localStorage.getItem("Indian Uphill Bus Simulator 3D.Indian Uphill Bus Simulator 3D.TotalCoins")`

