# Lootbox Command Guide

## Overview
The `/lootbox` command allows administrators to easily give GOATARK lootboxes to players on your ARK Survival Ascended servers.

## Command Usage

### Basic Command Format
```
/lootbox playerid:<eos_id> type:<lootbox_type> amount:<number> [server:<server_name>]
```

### Parameters
- **playerid** (required): Player's EOS ID (32 hex characters) or numeric ID
  - Example EOS ID: `000270ce7aa540bca6c8674861f24208`
  - Example numeric ID: `123456789`

- **type** (required): Lootbox type - choose from:
  - **GOAT Package** - 13 item rolls
  - **Premium Package** - 12 item rolls
  - **R2G Package** - 13 item rolls
  - **Killer Package** - 7 item rolls
  - **Resource LootBox** - 4 item rolls
  - **Gear LootBox** - 4 item rolls
  - **Breeding Pair LootBox** - Includes a breeding dino pair
  - **Mixed LootBox** - 4 item rolls + dino

- **amount** (required): Number of lootboxes (1-100)

- **server** (optional): Specific server name or "ALL"
  - If not specified, defaults to ALL servers

### Examples

**Give 1 GOAT lootbox to a player on all servers:**
```
/lootbox playerid:000270ce7aa540bca6c8674861f24208 type:GOAT amount:1
```

**Give 5 Premium lootboxes to a player on a specific server:**
```
/lootbox playerid:000270ce7aa540bca6c8674861f24208 type:Premium amount:5 server:MyServer
```

**Give 10 Resource lootboxes:**
```
/lootbox playerid:000270ce7aa540bca6c8674861f24208 type:Resource amount:10 server:ALL
```

## Response
The bot will reply with an embed showing:
- ✅ Player ID
- ✅ Lootbox type
- ✅ Amount given
- ✅ The exact RCON command sent
- ✅ Success/error status for each server

## Permissions
Only users with the configured admin/moderator roles can use this command (same permission system as other admin commands).

## Behind the Scenes
The command translates your selection into the proper RCON format:
```
scriptcommand GOATARK GiveLootBox <playerid> <amount> <itemRolls>,<hasDino>,<itemEntryID>,<dinoEntryID>
```

**Note:** The command does NOT include "cheat" prefix as this is not needed for this script command.

## Adding New Lootbox Types

To add new lootbox types, edit the `lootboxes.json` file:

### Step 1: Add to lootboxes.json
```json
{
  "lootboxTypes": {
    "NewType": {
      "displayName": "New Type Package",
      "itemRolls": 10,
      "hasDino": 0,
      "itemEntryID": "New_Package",
      "dinoEntryID": "0"
    }
  }
}
```

### Step 2: Add to command choices
Edit `src/commands/lootbox.js` and add your new type to the choices array:
```javascript
.addChoices(
    { name: 'GOAT Package', value: 'GOAT' },
    { name: 'Premium Package', value: 'Premium' },
    // ... existing choices ...
    { name: 'New Type Package', value: 'NewType' }  // Add this line
)
```

### Step 3: Redeploy commands
Run the deploy script to update Discord:
```bash
node deploy-commands.js
```

### Step 4: Restart the bot
Restart your bot to load the new configuration.

## Configuration Reference

### lootboxes.json Structure
```json
{
  "lootboxTypes": {
    "TYPE_KEY": {
      "displayName": "Human-readable name",
      "itemRolls": <number>,           // Number of item rolls
      "hasDino": <0 or 1>,              // 0 = no dino, 1 = includes dino
      "itemEntryID": "Item_Entry_ID",   // Item entry ID (use "0" if none)
      "dinoEntryID": "Dino_Entry_ID"    // Dino entry ID (use "0" if none)
    }
  }
}
```

### Example Configurations

**Item-only lootbox:**
```json
"Resource": {
  "displayName": "Resource LootBox",
  "itemRolls": 4,
  "hasDino": 0,
  "itemEntryID": "Resource_LootBox",
  "dinoEntryID": "0"
}
```

**Dino-only lootbox:**
```json
"Breeding": {
  "displayName": "Breeding Pair LootBox",
  "itemRolls": 0,
  "hasDino": 1,
  "itemEntryID": "0",
  "dinoEntryID": "Breeding_Pair_LootBox"
}
```

**Mixed (items + dino) lootbox:**
```json
"Mixed": {
  "displayName": "Mixed LootBox",
  "itemRolls": 4,
  "hasDino": 1,
  "itemEntryID": "Gear_Resources_LootBox",
  "dinoEntryID": "Dinos_LootBox"
}
```

## Troubleshooting

### "Invalid player ID format"
- Ensure the EOS ID is 32 hexadecimal characters
- Or use a numeric player ID if your system supports it

### "Unknown lootbox type"
- Make sure the type exists in `lootboxes.json`
- Verify you've redeployed commands after adding new types

### "Server not found"
- Check that the server name matches exactly what's in your config
- Server names are case-sensitive

### "Permission denied"
- User must have one of the allowed roles configured in your bot

## Files Modified/Created
- ✅ `lootboxes.json` - Lootbox configuration file
- ✅ `src/commands/lootbox.js` - Command implementation
- ✅ This guide - Documentation

## Deployment

To activate the new command:

1. **Ensure the bot is stopped**
2. **Deploy the commands:**
   ```bash
   node deploy-commands.js
   ```
3. **Start the bot:**
   ```bash
   node index.js
   ```

The command will now be available in Discord and will automatically appear in your slash command menu!
