const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./src/config');

const commands = [];

// Load all command files
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Gather the SlashCommandBuilder#toJSON() output of each command's data
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command) {
        commands.push(command.data.toJSON());
        console.log(`[LOADED] ${command.data.name}`);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" property.`);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(config.discord.Token);

// Deploy commands
(async () => {
    try {
        console.log(`\n🔄 Started refreshing ${commands.length} application (/) commands.`);

        // Register commands to the guild
        const data = await rest.put(
            Routes.applicationGuildCommands(config.discord.ClientID, config.discord.GuildID),
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands to guild ${config.discord.GuildID}.\n`);
        
        // List registered commands
        console.log('Registered commands:');
        data.forEach(cmd => {
            console.log(`  - /${cmd.name}: ${cmd.description}`);
        });
        
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
    }
})();
