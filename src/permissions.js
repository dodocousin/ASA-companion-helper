const { MessageFlags } = require('discord.js');
const config = require('./config');

/**
 * Check if a user has permission to use admin commands
 * @param {import('discord.js').GuildMember} member - The guild member to check
 * @returns {boolean} - True if the user has permission
 */
function hasPermission(member) {
    if (!member) {
        return false;
    }

    const allowedRoleIDs = config.discord.AllowedRoleIDs;
    
    // Check if user has any of the allowed roles
    const hasRole = member.roles.cache.some(role => 
        allowedRoleIDs.includes(role.id)
    );

    return hasRole;
}

/**
 * Send a permission denied message
 * @param {import('discord.js').CommandInteraction} interaction - The command interaction
 */
async function sendPermissionDenied(interaction) {
    await interaction.reply({
        content: '❌ You do not have permission to use this command.',
        flags: MessageFlags.Ephemeral
    });
}

module.exports = {
    hasPermission,
    sendPermissionDenied
};
