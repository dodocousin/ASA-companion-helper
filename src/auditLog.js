const { EmbedBuilder } = require('discord.js');
const config = require('./config');

/**
 * Send an audit log to the configured audit channel
 * @param {import('discord.js').Client} client - Discord client
 * @param {import('discord.js').CommandInteraction} interaction - Command interaction
 * @param {string} commandName - Name of the command executed
 * @param {Object} commandParams - Parameters used in the command
 * @param {Array} results - Array of result objects from RCON
 */
async function logCommand(client, interaction, commandName, commandParams, results) {
    try {
        const channelId = config.discord.AuditLogChannelID;
        const channel = await client.channels.fetch(channelId);

        if (!channel || !channel.isTextBased()) {
            console.error('Audit log channel not found or is not a text channel');
            return;
        }

        // Determine embed color based on results
        let embedColor = 0x00FF00; // Green for success
        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;

        if (successCount === 0) {
            embedColor = 0xFF0000; // Red for all failures
        } else if (successCount < totalCount) {
            embedColor = 0xFFA500; // Orange for partial success
        }

        // Build the embed
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`🔧 Admin Command: ${commandName}`)
            .setDescription(`Executed by ${interaction.user.tag}`)
            .addFields(
                { name: 'User ID', value: interaction.user.id, inline: true },
                { name: 'Channel', value: `<#${interaction.channelId}>`, inline: true },
                { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setTimestamp();

        // Add command parameters
        const paramsText = Object.entries(commandParams)
            .map(([key, value]) => `**${key}:** ${value}`)
            .join('\n');
        
        if (paramsText) {
            embed.addFields({ name: 'Parameters', value: paramsText, inline: false });
        }

        // Add results summary
        embed.addFields({
            name: 'Results',
            value: `✅ Success: ${successCount}/${totalCount}`,
            inline: false
        });

        // Add per-server results
        for (const result of results) {
            const status = result.success ? '✅' : '❌';
            let value;

            if (result.success) {
                // Truncate long responses
                let response = result.response || '(No response)';
                if (response.length > 1000) {
                    response = response.substring(0, 997) + '...';
                }
                value = `${status} Success\n\`\`\`\n${response}\n\`\`\``;
            } else {
                value = `${status} Error: ${result.error}`;
            }

            // Discord field value limit is 1024 characters
            if (value.length > 1024) {
                value = value.substring(0, 1021) + '...';
            }

            embed.addFields({
                name: `Server: ${result.serverName}`,
                value: value,
                inline: false
            });
        }

        await channel.send({ embeds: [embed] });

    } catch (error) {
        console.error('Error sending audit log:', error.message);
    }
}

module.exports = {
    logCommand
};
