const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { hasPermission, sendPermissionDenied } = require('../permissions');
const config = require('../config');
const { reloadLootboxConfig } = require('./lootbox');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload_config')
        .setDescription('Reload the bot configuration from config.json and lootboxes.json'),

    async execute(interaction) {
        // Check permissions
        if (!hasPermission(interaction.member)) {
            await sendPermissionDenied(interaction);
            return;
        }

        try {
            // Reload main configuration
            config.reload();

            // Reload lootbox configuration
            reloadLootboxConfig();

            await interaction.reply({
                content: '✅ **Configuration reloaded successfully!**\n\n' +
                         `**Servers loaded:** ${config.servers.length}\n` +
                         `**Allowed roles:** ${config.discord.AllowedRoleIDs.length}\n` +
                         `**RCON timeout:** ${config.rcon.TimeoutSeconds}s\n` +
                         `**Lootbox config:** reloaded ✅`,
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            await interaction.reply({
                content: `❌ **Failed to reload configuration**\n**Error:** ${error.message}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
