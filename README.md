# ARK Discord RCON Bot

A powerful Discord bot for managing ARK Survival Ascended server clusters through RCON commands. Built with Node.js and discord.js v14.

## Features

- ✅ **Slash Commands** - Modern Discord slash command interface
- 🔐 **Role-Based Permissions** - Restrict commands to specific Discord roles
- 🖥️ **Multi-Server Support** - Manage multiple ARK servers from one bot
- 📝 **Audit Logging** - Track all admin commands in a dedicated channel
- 🔄 **Hot-Reload Config** - Update configuration without restarting
- ⚡ **Autocomplete** - Server names and dino names autocomplete in commands
- 🛡️ **Error Handling** - Graceful handling of connection issues and timeouts
- 🔒 **Secure** - RCON passwords never exposed in logs or Discord
- 🦖 **Dino Spawning** - Spawn 150+ creatures with custom stats (requires mod)
- 🔇 **Mute / Unmute Integration** - Player mute commands available only when using the author's private ARK plugin
- ⏱️ **Cooldown System** - Prevents command spam (2-second cooldown)
- 🚦 **Command Queue** - Prevents bot crashes from concurrent operations
- 💪 **Crash Prevention** - Enterprise-grade error handling, bot never crashes
- ⏰ **Hard Timeout** - All commands timeout after 5 seconds (configurable)

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/rcon` | Send raw RCON command to a specific server | `/rcon servername:"Astraeos" command:"ListPlayers"` |
| `/rcon_all` | Send raw RCON command to all servers | `/rcon_all command:"SaveWorld"` |
| `/broadcast` | Broadcast message to server(s) | `/broadcast servername:"ALL" text:"Server restart in 10 minutes"` |
| `/mute` | Mute a player by EOS ID ⚠️ **Requires private plugin** | `/mute servername:"The Island" eosid:"0002abc..."` |
| `/unmute` | Unmute a player by EOS ID ⚠️ **Requires private plugin** | `/unmute servername:"ALL" eosid:"0002abc..."` |
| `/addpoints` | Add points to a player | `/addpoints servername:"Astraeos" eosid:"0002abc..." quantity:500` |
| `/spawndino` | Spawn a dino with custom stats ⚠️ **Requires Mod** | `/spawndino servername:"Astraeos" dino:"Rex" level:150 ...` |
| `/lootbox` | Give GOATARK lootboxes to players ⚠️ **Requires GOATARK Mod** | `/lootbox playerid:"0002abc..." type:GOAT amount:1 server:"ALL"` |
| `/reload_config` | Reload bot configuration | `/reload_config` |

## ⚠️ Important: Requirements by Command

### `/lootbox` Command

The `/lootbox` command **ONLY works on servers running the GOATARK mod with GOATARK servers**.

This command uses the custom `scriptcommand GOATARK GiveLootBox` provided by the GOATARK mod system. The command will not function on vanilla ARK Survival Ascended servers or servers without the GOATARK mod installed.

**Supported Lootbox Types:**
- GOAT Package, Premium Package, R2G Package, Killer Package
- Resource LootBox, Gear LootBox, Breeding Pair LootBox, Mixed LootBox

See `LOOTBOX_GUIDE.md` for detailed usage instructions and how to add custom lootbox types.

### `/spawndino` Command

The `/spawndino` command **ONLY works if your ARK server has the following mod installed:**

**[Pelayori's Cryo Storage](https://www.curseforge.com/ark-survival-ascended/mods/pelayoris-cryo-storage)**

This command uses the `PCS.SpawnDino` script command provided by the mod. Without this mod installed on your server, the command will not function.

### `/mute` and `/unmute` Commands

The `/mute` and `/unmute` commands **ONLY work with the author's private ARK server plugin**.

These commands rely on custom server-side RCON commands provided by that private plugin. They are **not vanilla ARK Survival Ascended RCON commands**, and they will not work on a normal ASA server unless that private plugin is installed and configured.

If you are using this bot without the private plugin, you can remove or ignore the `/mute` and `/unmute` command files.

### Vanilla-Compatible Commands

The following commands work with standard ARK Survival Ascended RCON and do not require extra mods or private plugins:

- `/rcon`
- `/rcon_all`
- `/broadcast`
- `/reload_config`

`/addpoints` may also require a custom server-side plugin or system depending on how your ARK server handles points.

## Installation

### Prerequisites

- **Node.js** v16.9.0 or higher
- **npm** (comes with Node.js)
- **Discord Bot Token** (see setup instructions below)
- **ARK servers** with RCON enabled
- **Optional**: Pelayori's Cryo Storage mod (for `/spawndino` command)
- **Optional / Private**: Author's private ARK plugin (required for `/mute` and `/unmute`)

### Step 1: Install Node.js

Download and install Node.js from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node --version
npm --version
```

### Step 2: Clone or Download Project

Download this project to your desired location.

### Step 3: Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install:
- `discord.js` v14.14.1
- `rcon-srcds` v2.0.2

## Discord Bot Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and give it a name
3. Go to the **"Bot"** section in the left sidebar
4. Click **"Add Bot"** and confirm
5. Under **Token**, click **"Reset Token"** and copy it (you'll need this for config.json)
6. Under **Privileged Gateway Intents**, enable:
   - ✅ SERVER MEMBERS INTENT

### 2. Invite Bot to Your Server

1. Go to **"OAuth2"** → **"URL Generator"** in the left sidebar
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select bot permissions:
   - ✅ Send Messages
   - ✅ Use Slash Commands
   - ✅ Read Message History
4. Copy the generated URL and open it in your browser
5. Select your server and authorize the bot

### 3. Get Discord IDs

Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)

- **Guild ID**: Right-click your server icon → Copy ID
- **Role IDs**: Server Settings → Roles → Right-click role → Copy ID
- **Channel ID**: Right-click audit log channel → Copy ID
- **Client ID**: Discord Developer Portal → Your Application → Application ID

## Configuration

### Edit config.json

Open `config.json` and fill in your details:

```json
{
  "Discord": {
    "Token": "YOUR_BOT_TOKEN_HERE",
    "ClientID": "YOUR_CLIENT_ID_HERE",
    "GuildID": "YOUR_GUILD_ID_HERE",
    "AllowedRoleIDs": [
      "ADMIN_ROLE_ID_1",
      "ADMIN_ROLE_ID_2"
    ],
    "AuditLogChannelID": "AUDIT_CHANNEL_ID_HERE"
  },
  "Rcon": {
    "TimeoutSeconds": 5
  },
  "Servers": [
    {
      "ServerName": "Astraeos",
      "IP": "192.168.0.49",
      "Port": 27000,
      "Password": "YOUR_RCON_PASSWORD"
    },
    {
      "ServerName": "The Island",
      "IP": "192.168.0.49",
      "Port": 27002,
      "Password": "YOUR_RCON_PASSWORD"
    },
    {
      "ServerName": "Ragnarok",
      "IP": "192.168.0.49",
      "Port": 27004,
      "Password": "YOUR_RCON_PASSWORD"
    }
  ]
}
```

### Configuration Options

#### Discord Section
- **Token**: Your Discord bot token
- **ClientID**: Your Discord application client ID
- **GuildID**: Your Discord server (guild) ID
- **AllowedRoleIDs**: Array of role IDs that can use the bot commands
- **AuditLogChannelID**: Channel ID where audit logs will be sent

#### RCON Section
- **TimeoutSeconds**: RCON connection timeout in seconds (default: 5)
  - Controls max time for RCON operations
  - Prevents bot from hanging on offline servers
  - Recommended: 5-10 seconds

#### Servers Section
- **ServerName**: Display name for the server (used in commands)
- **IP**: Server IP address
- **Port**: RCON port (not the game port)
- **Password**: RCON password for the server

## Deploying Slash Commands

Before running the bot, you need to register the slash commands with Discord:

```bash
npm run deploy
```

Or:

```bash
node deploy-commands.js
```

You should see output like:
```
[LOADED] rcon
[LOADED] rcon_all
[LOADED] broadcast
[LOADED] spawndino
...
✅ Successfully reloaded 8 application (/) commands to guild XXXXX.
```

**Note**: You only need to run this once, or after adding/modifying commands.

## Running the Bot

Start the bot with:

```bash
npm start
```

Or:

```bash
node index.js
```

You should see:
```
[COMMAND] Loaded: rcon
[COMMAND] Loaded: rcon_all
[COMMAND] Loaded: spawndino
...
Dino data loaded successfully (150 dinos)
========================================
✅ Bot is ready!
🤖 Logged in as: YourBotName#1234
📊 Serving 1 guild(s)
⚙️  Loaded 8 command(s)
🖥️  Managing 3 server(s)
========================================
```

### Running in Background (Optional)

**Windows**: Use `pm2` or run as a Windows Service

```bash
npm install -g pm2
pm2 start index.js --name ark-bot
pm2 save
pm2 startup
```

**Linux**: Use `systemd`, `pm2`, or `screen`

## Usage Examples

### Basic Commands

```
/rcon servername:"Astraeos" command:"ListPlayers"
/rcon_all command:"SaveWorld"
/broadcast servername:"ALL" text:"Server restart in 10 minutes!"
```

### Player Management

> ⚠️ `/mute` and `/unmute` require the author's private ARK plugin. They are not vanilla ASA RCON commands.

```
/mute servername:"The Island" eosid:"0002abc123def456"
/unmute servername:"ALL" eosid:"0002abc123def456"
/addpoints servername:"Ragnarok" eosid:"0002abc123def456" quantity:1000
```

### Dino Spawning (Requires Pelayori's Cryo Storage Mod)

**All stats random:**
```
/spawndino servername:"Astraeos" dino:"Rex" level:150 maturity:100 imprint:0 gender:Random neutered:No hp:? stamina:? oxygen:? food:? water:? weight:? melee:? speed:? crafting:?
```

**Specific stats:**
```
/spawndino servername:"The Island" dino:"Gigantoraptor" level:150 maturity:100 imprint:100 gender:Female neutered:Yes hp:50 stamina:30 oxygen:20 food:10 water:10 weight:40 melee:60 speed:25 crafting:0
```

**Spawn on all servers:**
```
/spawndino servername:"ALL" dino:"Rex" level:190 maturity:100 imprint:100 gender:Male neutered:No hp:60 stamina:40 oxygen:? food:? water:? weight:50 melee:70 speed:? crafting:?
```

### GOATARK Lootboxes (Requires GOATARK Mod)

> ⚠️ `/lootbox` requires servers running the GOATARK mod. This command will not work on vanilla ARK servers.

**Give 1 GOAT lootbox to a player on all servers:**
```
/lootbox playerid:"000270ce7aa540bca6c8674861f24208" type:GOAT amount:1 server:"ALL"
```

**Give 5 Premium lootboxes to a specific server:**
```
/lootbox playerid:"000270ce7aa540bca6c8674861f24208" type:Premium amount:5 server:"Astraeos"
```

**Give multiple Resource lootboxes:**
```
/lootbox playerid:"000270ce7aa540bca6c8674861f24208" type:Resource amount:10 server:"The Island"
```

**Available lootbox types:** GOAT, Premium, R2G, Killer, Resource, Gear, Breeding, Mixed

For detailed lootbox documentation and how to add custom types, see `LOOTBOX_GUIDE.md`.

### Configuration

```
/reload_config
```

## Stability & Crash Prevention

The bot includes enterprise-grade stability features:

### 🚦 Command Queue System
- **Only one RCON command executes at a time**
- Prevents concurrent operations that could crash the bot
- Max queue size: 10 commands
- 100ms delay between commands

### ⏱️ Per-User Cooldowns
- **2-second cooldown** per user per command
- Prevents command spam
- User-friendly messages: `⏱️ Please wait X seconds`
- Cooldown cleared on errors (so users can retry)

### ⏰ Hard Timeouts
- **Guaranteed timeout** within configured seconds (default: 5s)
- No more hanging on offline servers
- Proper connection cleanup
- Detailed error messages

### 💪 Global Error Handlers
- **Bot never crashes** from unhandled errors
- All errors logged but don't stop the bot
- Graceful shutdown support (SIGINT/SIGTERM)
- Enhanced error messages for users

### 📊 Error Feedback
Users get helpful messages instead of silent failures:
- `❌ Queue is full` - Too many pending commands
- `❌ Operation timed out` - Server offline/not responding
- `❌ RCON connection error` - Connection issues
- `⏱️ Please wait X seconds` - Cooldown active

## Managing Dinos (dinos.json)

The bot includes a database of 150+ ARK creatures in `dinos.json`. You can easily add new dinos:

### Adding New Creatures

Edit `dinos.json` and add entries:

```json
{
  "name": "NewDino",
  "blueprint": "Blueprint'/Game/Path/To/Dino_BP.Dino_BP'"
}
```

**No bot restart needed!** New dinos appear in autocomplete immediately.

### Current Dinos Included

Rex, Gigantoraptor, Wyverns (Fire/Lightning/Poison), Rock Drake, Basilisk, and 140+ more!

## Adding New Commands

The bot is designed for easy extensibility. To add a new command:

### Step 1: Create Command File

Create a new file in `src/commands/`, e.g., `src/commands/mycommand.js`:

```javascript
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { hasPermission, sendPermissionDenied } = require('../permissions');
const { sendCommandByName } = require('../rcon');
const { logCommand } = require('../auditLog');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mycommand')
        .setDescription('Description of my command')
        .addStringOption(option =>
            option.setName('servername')
                .setDescription('The server name')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('parameter')
                .setDescription('A parameter')
                .setRequired(true)),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const serverNames = config.getServerNames(true); // true = include "ALL"
        
        const filtered = serverNames.filter(name =>
            name.toLowerCase().includes(focusedValue.toLowerCase())
        );

        await interaction.respond(
            filtered.slice(0, 25).map(name => ({ name: name, value: name }))
        );
    },

    async execute(interaction) {
        // Check permissions
        if (!hasPermission(interaction.member)) {
            await sendPermissionDenied(interaction);
            return;
        }

        const serverName = interaction.options.getString('servername');
        const parameter = interaction.options.getString('parameter');

        // Defer reply
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Build RCON command
        const rconCommand = `YourRconCommand ${parameter}`;

        // Send RCON command
        const results = await sendCommandByName(serverName, rconCommand);

        // Build response
        let response;
        if (serverName === 'ALL') {
            response = '**Command sent to all servers**\n\n';
            for (const result of results) {
                response += result.success 
                    ? `✅ **${result.serverName}**: Success\n`
                    : `❌ **${result.serverName}**: ${result.error}\n`;
            }
        } else {
            const result = results[0];
            response = result.success
                ? `✅ **Success on ${serverName}**\n\`\`\`\n${result.response}\n\`\`\``
                : `❌ **Failed on ${serverName}**\n**Error:** ${result.error}`;
        }

        await interaction.editReply({ content: response });

        // Log to audit channel
        await logCommand(
            interaction.client,
            interaction,
            '/mycommand',
            { serverName, parameter },
            results
        );
    }
};
```

### Step 2: Redeploy Commands

Run the deployment script to register the new command:

```bash
npm run deploy
```

### Step 3: Restart Bot

Restart the bot to load the new command:

```bash
# Stop the bot (Ctrl+C)
npm start
```

The bot will automatically load all `.js` files in the `src/commands/` directory.

## Troubleshooting

### Bot not responding to commands

1. Make sure you deployed commands: `npm run deploy`
2. Check bot has proper permissions in Discord server
3. Verify bot is online (green status)
4. Check console for errors

### Permission denied errors

1. Verify your Discord role ID is in `AllowedRoleIDs` in config.json
2. Make sure you have the role assigned
3. Try `/reload_config` if you just updated config.json

### Cooldown messages

If you see `⏱️ Please wait X seconds`:
- This is normal - prevents command spam
- Wait for the cooldown to expire
- Default: 2 seconds between commands

### RCON connection errors

**"Connection timeout (no response after 5s)"**
- Server is offline or not responding
- Check RCON port is correct (not the game port)
- Verify server is running
- Check firewall settings

**"Authentication failed - check RCON password"**
- Verify RCON password in config.json
- Check RCON is enabled on the ARK server

**"Server offline or unreachable"**
- Ping the server IP to verify connectivity
- Check ARK server is running
- Verify RCON port is open

**"Connection reset by server"**
- Server may be restarting
- RCON may be overloaded
- Try again in a few seconds

### Audit logs not appearing

1. Verify `AuditLogChannelID` is correct
2. Check bot has permission to send messages in that channel
3. Check console for audit log errors

### /mute or /unmute not working

These commands require the author's private ARK server plugin. They will not work on a vanilla ARK Survival Ascended server.

1. Verify that the private plugin is installed on the ARK server
2. Verify that the plugin exposes the required mute/unmute RCON commands
3. Restart the ARK server after installing or updating the plugin
4. If you do not have access to the private plugin, remove or ignore the `/mute` and `/unmute` commands

### /spawndino not working

**Most common issue:** Server doesn't have Pelayori's Cryo Storage mod installed

1. Verify the mod is installed on your ARK server
2. Ensure the mod is loaded (check server mods list)
3. Restart ARK server after installing the mod
4. Test with a simple spawn first

## Project Structure

```
ark-discord-rcon-bot/
├── package.json                 # Dependencies and scripts
├── config.example.json          # Example configuration file
├── config.json                  # Local configuration file (do not commit)
├── dinos.json                   # Dino database (150+ creatures)
├── lootboxes.json               # Lootbox configuration (8 types)
├── index.js                     # Main bot file
├── deploy-commands.js           # Command registration script
├── README.md                    # This file
├── LOOTBOX_GUIDE.md             # Detailed lootbox documentation
└── src/
    ├── config.js                # Config loader
    ├── permissions.js           # Permission checker
    ├── rcon.js                  # RCON handler with queue & timeout
    ├── auditLog.js              # Audit logging
    ├── cooldowns.js             # Cooldown manager
    ├── dinoData.js              # Dino database loader
    └── commands/
        ├── rcon.js              # /rcon command
        ├── rconAll.js           # /rcon_all command
        ├── broadcast.js         # /broadcast command
        ├── mute.js              # /mute command
        ├── unmute.js            # /unmute command
        ├── addpoints.js         # /addpoints command
        ├── spawndino.js         # /spawndino command (requires mod)
        ├── lootbox.js           # /lootbox command (requires GOATARK mod)
        └── reloadConfig.js      # /reload_config command
```

## Security Best Practices

1. **Never share your bot token** - Keep it secret
2. **Never commit config.json** - Add to .gitignore
3. **Use strong RCON passwords** - Recommended 20+ characters
4. **Limit bot permissions** - Only give necessary Discord permissions
5. **Restrict role access** - Only trusted admins should have access
6. **Review audit logs** - Regularly check who is using commands
7. **Keep node_modules private** - Don't share when transferring project

## Support

For issues or questions:
1. Check the console output for error messages
2. Verify your configuration is correct
3. Ensure all prerequisites are installed
4. Check Discord.js documentation: https://discord.js.org/
5. Verify mod requirements for `/spawndino`

## License

MIT License - Free to use and modify

## Credits

Built with:
- [discord.js](https://discord.js.org/) - Discord API wrapper
- [rcon-srcds](https://www.npmjs.com/package/rcon-srcds) - RCON client library

**Mod Requirement:**
- [Pelayori's Cryo Storage](https://www.curseforge.com/ark-survival-ascended/mods/pelayoris-cryo-storage) - Required for `/spawndino` command

---

**Enjoy managing your ARK server cluster! 🦖**
