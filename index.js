const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./src/config');
const cooldowns = require('./src/cooldowns');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// Collection to store commands
client.commands = new Collection();

// Load all command files
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`[COMMAND] Loaded: ${command.data.name}`);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing required "data" or "execute" property.`);
    }
}

// Bot ready event
client.once(Events.ClientReady, (readyClient) => {
    console.log(`\n========================================`);
    console.log(`✅ Bot is ready!`);
    console.log(`🤖 Logged in as: ${readyClient.user.tag}`);
    console.log(`📊 Serving ${readyClient.guilds.cache.size} guild(s)`);
    console.log(`⚙️  Loaded ${client.commands.size} command(s)`);
    console.log(`🖥️  Managing ${config.servers.length} server(s)`);
    console.log(`========================================\n`);
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async interaction => {
    // Handle autocomplete interactions
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
        
        if (!command.autocomplete) {
            return;
        }
        
        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error(`Error handling autocomplete for ${interaction.commandName}:`, error);
        }
        return;
    }
    
    // Handle command interactions
    if (!interaction.isChatInputCommand()) return;
    
    const command = client.commands.get(interaction.commandName);
    
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    
    try {
        // Check cooldown
        const cooldownCheck = cooldowns.checkCooldown(interaction.user.id, interaction.commandName);
        if (cooldownCheck.onCooldown) {
            const timeMessage = cooldowns.getTimeRemainingMessage(cooldownCheck.remainingMs);
            await interaction.reply({
                content: `⏱️ ${timeMessage}`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // Set cooldown before executing command
        cooldowns.setCooldown(interaction.user.id, interaction.commandName);

        // Guard: skip if the interaction token has already expired (>2.8s since creation)
        // This happens when Discord reconnects or the gateway delivers the event late
        const interactionAge = Date.now() - interaction.createdTimestamp;
        if (interactionAge > 2800) {
            cooldowns.clearCooldown(interaction.user.id, interaction.commandName);
            console.warn(`⚠️ Interaction /${interaction.commandName} arrived too late (${interactionAge}ms after creation), token likely expired. Skipping.`);
            return;
        }

        console.log(`[COMMAND] ${interaction.user.tag} used /${interaction.commandName} in ${interaction.guild.name}`);
        await command.execute(interaction);
        
    } catch (error) {
        console.error(`❌ Error executing ${interaction.commandName}:`, error);
        
        // Clear cooldown on error so user can retry
        cooldowns.clearCooldown(interaction.user.id, interaction.commandName);

        // If the interaction token expired (Discord error 10062), we cannot reply at all.
        // This can happen after a gateway reconnect or if the event was delivered too late.
        // Just log a clean warning and skip — no point trying to reply to a dead token.
        if (error.code === 10062) {
            console.warn(`⚠️ Interaction /${interaction.commandName} token expired (10062). The user can retry the command.`);
            return;
        }
        
        // Determine error message
        let errorContent = '❌ There was an error executing this command!';
        
        if (error.message.includes('queue is full')) {
            errorContent = '❌ The command queue is full. Please wait a moment and try again.';
        } else if (error.message.includes('timeout')) {
            errorContent = '❌ The operation timed out. The server may be offline or not responding.';
        } else if (error.message.includes('RCON')) {
            errorContent = '❌ RCON connection error. Please check server status.';
        }
        
        const errorMessage = {
            content: errorContent,
            flags: MessageFlags.Ephemeral
        };
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        } catch (followUpError) {
            console.error('❌ Could not send error message to user:', followUpError);
        }
    }
});

// Enhanced error handling to prevent crashes
client.on(Events.Error, error => {
    console.error('❌ Discord client error:', error);
});

client.on(Events.Warn, warning => {
    console.warn('⚠️  Discord client warning:', warning);
});

// Global error handlers - prevent bot from crashing
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('❌ Reason:', reason);
    // Log but don't crash the bot
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Log but don't crash the bot
});

// Graceful shutdown handler
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down bot gracefully...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down bot gracefully...');
    client.destroy();
    process.exit(0);
});

// Login to Discord
console.log('🔄 Starting bot...\n');
client.login(config.discord.Token).catch(error => {
    console.error('❌ Failed to login:', error.message);
    process.exit(1);
});
