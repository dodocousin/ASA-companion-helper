const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { hasPermission, sendPermissionDenied } = require('../permissions');
const { sendCommandByName } = require('../rcon');
const { logCommand } = require('../auditLog');
const config = require('../config');
const dinoData = require('../dinoData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spawndino')
        .setDescription('Spawn a dinosaur on a server with custom stats')
        .addStringOption(option =>
            option.setName('servername')
                .setDescription('The server to spawn on (or ALL for all servers)')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('dino')
                .setDescription('The dinosaur to spawn')
                .setRequired(true)
                .setAutocomplete(true))
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Dino level (e.g., 150)')
                .setRequired(true)
                .setMinValue(1))
        .addStringOption(option =>
            option.setName('maturity')
                .setDescription('Maturity % (0-100 or ? for random)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('imprint')
                .setDescription('Imprint % (0-100 or ? for random)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('gender')
                .setDescription('Dino gender')
                .setRequired(true)
                .addChoices(
                    { name: 'Male', value: 'Male' },
                    { name: 'Female', value: 'Female' },
                    { name: 'Random', value: 'Random' }
                ))
        .addStringOption(option =>
            option.setName('neutered')
                .setDescription('Is the dino neutered?')
                .setRequired(true)
                .addChoices(
                    { name: 'Yes', value: 'Yes' },
                    { name: 'No', value: 'No' }
                ))
        .addStringOption(option =>
            option.setName('hp')
                .setDescription('HP stat points (number or ? for random)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('stamina')
                .setDescription('Stamina stat points (number or ? for random)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('oxygen')
                .setDescription('Oxygen stat points (number or ? for random)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('food')
                .setDescription('Food stat points (number or ? for random)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('water')
                .setDescription('Water stat points (number or ? for random)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('weight')
                .setDescription('Weight stat points (number or ? for random)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('melee')
                .setDescription('Melee stat points (number or ? for random)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('speed')
                .setDescription('Speed stat points (number or ? for random)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('crafting')
                .setDescription('Crafting stat points (number or ? for random)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('player')
                .setDescription('Player EOS ID to spawn for (optional - spawns at your location if omitted)')
                .setRequired(false)),

    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'servername') {
            const focusedValue = focusedOption.value;
            const serverNames = config.getServerNames(true); // Include "ALL"
            
            const filtered = serverNames.filter(name =>
                name.toLowerCase().includes(focusedValue.toLowerCase())
            );

            await interaction.respond(
                filtered.slice(0, 25).map(name => ({ name: name, value: name }))
            );
        } else if (focusedOption.name === 'dino') {
            const focusedValue = focusedOption.value;
            const dinoNames = dinoData.getDinoNames();
            
            const filtered = dinoNames.filter(name =>
                name.toLowerCase().includes(focusedValue.toLowerCase())
            );

            await interaction.respond(
                filtered.slice(0, 25).map(name => ({ name: name, value: name }))
            );
        }
    },

    async execute(interaction) {
        // Check permissions
        if (!hasPermission(interaction.member)) {
            await sendPermissionDenied(interaction);
            return;
        }

        // Get all parameters
        const serverName = interaction.options.getString('servername');
        const dinoName = interaction.options.getString('dino');
        const level = interaction.options.getInteger('level');
        const maturity = interaction.options.getString('maturity');
        const imprint = interaction.options.getString('imprint');
        const gender = interaction.options.getString('gender');
        const neutered = interaction.options.getString('neutered');
        const hp = interaction.options.getString('hp');
        const stamina = interaction.options.getString('stamina');
        const oxygen = interaction.options.getString('oxygen');
        const food = interaction.options.getString('food');
        const water = interaction.options.getString('water');
        const weight = interaction.options.getString('weight');
        const melee = interaction.options.getString('melee');
        const speed = interaction.options.getString('speed');
        const crafting = interaction.options.getString('crafting');
        const player = interaction.options.getString('player') || '?'; // Default to ? if not provided

        // Defer reply as RCON might take time
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Validate dino exists
        const blueprint = dinoData.getBlueprint(dinoName);
        if (!blueprint) {
            await interaction.editReply({
                content: `❌ Dino "${dinoName}" not found in database.`
            });
            return;
        }

        // Validate stat parameters (must be number or ?)
        const stats = { maturity, imprint, hp, stamina, oxygen, food, water, weight, melee, speed, crafting };
        for (const [statName, statValue] of Object.entries(stats)) {
            if (statValue !== '?') {
                const num = parseInt(statValue);
                if (isNaN(num) || num < 0) {
                    await interaction.editReply({
                        content: `❌ Invalid value for ${statName}: "${statValue}". Must be a number or "?"`
                    });
                    return;
                }
            }
        }

        // Convert gender to RCON format
        let genderValue;
        if (gender === 'Male') {
            genderValue = '0';
        } else if (gender === 'Female') {
            genderValue = '1';
        } else { // Random
            genderValue = '?';
        }

        // Convert neutered to RCON format
        const neuteredValue = neutered === 'Yes' ? '1' : '0';

        // Build RCON command
        // scriptcommand PCS.SpawnDino {eosid} {bp path} {level} {Maturity} {imprint} {gender} {Neuter} {HP} {Stamina} {Oxygen} {Food} {Water} {Weight} {Melee} {Speed} {Crafting}
        const rconCommand = `scriptcommand PCS.SpawnDino ${player} ${blueprint} ${level} ${maturity} ${imprint} ${genderValue} ${neuteredValue} ${hp} ${stamina} ${oxygen} ${food} ${water} ${weight} ${melee} ${speed} ${crafting}`;

        // Send RCON command
        const results = await sendCommandByName(serverName, rconCommand);

        // Build response
        let response;
        if (serverName === 'ALL') {
            response = `**SpawnDino command sent to all servers**\n**Dino:** ${dinoName}\n**Level:** ${level}\n\n`;
            for (const result of results) {
                if (result.success) {
                    response += `✅ **${result.serverName}**: Success\n`;
                } else {
                    response += `❌ **${result.serverName}**: ${result.error}\n`;
                }
            }
        } else {
            const result = results[0];
            if (result.success) {
                response = `✅ **Dino spawned on ${serverName}**\n` +
                           `**Dino:** ${dinoName}\n` +
                           `**Level:** ${level}\n` +
                           `**Gender:** ${gender}\n` +
                           `**Maturity:** ${maturity}%\n` +
                           `**Imprint:** ${imprint}%\n` +
                           `\`\`\`\n${result.response}\n\`\`\``;
            } else {
                response = `❌ **Failed to spawn dino on ${serverName}**\n**Error:** ${result.error}`;
            }
        }

        // Send response (truncate if too long)
        if (response.length > 2000) {
            response = response.substring(0, 1997) + '...';
        }

        await interaction.editReply({ content: response });

        // Log to audit channel
        await logCommand(
            interaction.client,
            interaction,
            '/spawndino',
            { 
                serverName, 
                dino: dinoName, 
                level, 
                gender,
                maturity,
                imprint,
                neutered,
                player: player === '?' ? 'self' : player
            },
            results
        );
    }
};
