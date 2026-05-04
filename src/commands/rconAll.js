const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { hasPermission, sendPermissionDenied } = require('../permissions');
const { sendCommandToAll } = require('../rcon');
const { logCommand } = require('../auditLog');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rcon_all')
        .setDescription('Send a raw RCON command to all servers')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The RCON command to execute')
                .setRequired(true)),

    async execute(interaction) {
        // Check permissions
        if (!hasPermission(interaction.member)) {
            await sendPermissionDenied(interaction);
            return;
        }

        const command = interaction.options.getString('command');

        // Defer reply as RCON might take time
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Send RCON command to all servers
        const results = await sendCommandToAll(command);

        // Build response with per-server summary
        let response = '**Command sent to all servers**\n\n';
        
        for (const result of results) {
            if (result.success) {
                response += `✅ **${result.serverName}**: Success\n`;
                // Show first 100 chars of response
                let serverResponse = result.response || '(No response)';
                if (serverResponse.length > 100) {
                    serverResponse = serverResponse.substring(0, 97) + '...';
                }
                response += `\`\`\`\n${serverResponse}\n\`\`\`\n`;
            } else {
                response += `❌ **${result.serverName}**: ${result.error}\n\n`;
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
            '/rcon_all',
            { command },
            results
        );
    }
};
