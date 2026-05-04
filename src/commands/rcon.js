const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { hasPermission, sendPermissionDenied } = require('../permissions');
const { sendCommand } = require('../rcon');
const { logCommand } = require('../auditLog');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rcon')
        .setDescription('Send a raw RCON command to a specific server')
        .addStringOption(option =>
            option.setName('servername')
                .setDescription('The server to send the command to')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The RCON command to execute')
                .setRequired(true)),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const serverNames = config.getServerNames(false); // No "ALL" option for this command
        
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
        const command = interaction.options.getString('command');

        // Defer reply as RCON might take time
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Get server from config
        const server = config.getServer(serverName);
        if (!server) {
            await interaction.editReply({
                content: `❌ Server "${serverName}" not found in configuration.`
            });
            return;
        }

        // Send RCON command
        const result = await sendCommand(server, command);

        // Build response
        let response;
        if (result.success) {
            response = `✅ **Command sent to ${serverName}**\n\`\`\`\n${result.response}\n\`\`\``;
        } else {
            response = `❌ **Failed to send command to ${serverName}**\n**Error:** ${result.error}`;
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
            '/rcon',
            { serverName, command },
            [result]
        );
    }
};
