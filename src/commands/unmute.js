const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { hasPermission, sendPermissionDenied } = require('../permissions');
const { sendCommandByName } = require('../rcon');
const { logCommand } = require('../auditLog');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a player on a server or all servers')
        .addStringOption(option =>
            option.setName('servername')
                .setDescription('The server to unmute on (or ALL for all servers)')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('eosid')
                .setDescription('The player EOS ID to unmute')
                .setRequired(true)),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const serverNames = config.getServerNames(true); // Include "ALL" option
        
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
        const eosid = interaction.options.getString('eosid');

        // Defer reply as RCON might take time
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Build RCON command
        const rconCommand = `unmute_eos ${eosid}`;

        // Send RCON command
        const results = await sendCommandByName(serverName, rconCommand);

        // Build response
        let response;
        if (serverName === 'ALL') {
            response = `**Unmute command sent to all servers for player ${eosid}**\n\n`;
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
                response = `✅ **Player unmuted on ${serverName}**\n**EOS ID:** ${eosid}\n\`\`\`\n${result.response}\n\`\`\``;
            } else {
                response = `❌ **Failed to unmute player on ${serverName}**\n**Error:** ${result.error}`;
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
            '/unmute',
            { serverName, eosid },
            results
        );
    }
};
