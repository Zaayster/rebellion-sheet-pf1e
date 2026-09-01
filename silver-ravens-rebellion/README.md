# Silver Ravens Rebellion Sheet

A shared rebellion tracker for Foundry VTT v13 and the Pathfinder 1e system.

## Installation

1. Extract the `silver-ravens-rebellion` folder into Foundry's `Data/modules` directory.
2. Restart Foundry VTT.
3. Enable **Silver Ravens Rebellion Sheet** in the world's Manage Modules screen.
4. Open the Game Settings sidebar and click **Open Rebellion Sheet**.

The GM can edit and save the sheet. Players receive a synchronized read-only view. Data is stored as a world setting and persists with the world.

## Features in v0.1.0

- Rank, XP, treasury, actions, and public opinion
- Loyalty, Secrecy, Security, Notoriety, and Danger
- Editable teams and team status
- Editable missions with advisor, primary statistic, assigned team, and assigned PCs
- Event chance and severity d100 rolls
- Notes and a 50-entry activity log
- Module API for macros: `SilverRavensRebellion.open()`

## Backup

Back up the Foundry world normally. The rebellion data is stored inside that world's settings database.
