# Indian Uphill Bus Simulator 3D - All Buses Unlocked

This repository has been modified so that **all buses are unlocked from the start**.

## Implementation

The modification unlocks all buses by injecting a JavaScript hook in `index.html` that:

1. Sets multiple PlayerPrefs unlock keys in localStorage immediately
2. Continuously sets the unlock values during Unity's initialization (first 5 seconds)
3. Sets them one final time after Unity runtime initialization completes

This aggressive approach ensures all buses are unlocked regardless of which unlock key pattern the game uses.

## Important Notes

**All buses will be unlocked every time you load the page.**

- The script runs continuously during initialization to override any default locked states
- Works on first load and all subsequent loads
- No need to clear cache or cookies
- No need to earn money to unlock buses

## Technical Details

The modification uses JavaScript to manipulate Unity's PlayerPrefs system by setting multiple unlock key patterns:
- **Pattern Examples**: `BusXUnlocked`, `VehicleXUnlocked`, `bus_X_unlocked`, `UnlockedBusX`, etc.
- **Range**: Sets unlock keys for buses 0-20 across all patterns
- **Value**: `1` (stored as a string in localStorage to indicate unlocked state)
- **Method**: Continuous setting during initialization to ensure Unity reads the correct values

## Verification

You can verify the modification is active by:
1. Opening the browser console (F12)
2. Looking for the message: "[Bus Unlock] Unlocking all buses"
3. Checking localStorage for unlock keys in the console
4. All buses should be available for selection in the game

