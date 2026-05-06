const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { hasPermission, sendPermissionDenied } = require('../permissions');
const { sendCommandByName } = require('../rcon');
const { logCommand } = require('../auditLog');
const config = require('../config');
const fs = require('fs');
const path = require('path');

// Load lootbox configuration
const lootboxConfigPath = path.join(__dirname, '..', '..', 'lootboxes.json');
const lootboxConfig = JSON.parse(fs.readFileSync(lootboxConfigPath, 'utf8'));

/**
 * Get all lootbox type names
 * @returns {Array<string>} Array of lootbox type names
 */
function getLootboxTypes() {
    return Object.keys(lootboxConfig.lootboxTypes);
}

/**
 * Get lootbox configuration by type
 * @param {string} type - The lootbox type
 * @returns {Object|null} Lootbox configuration or null if not found
 */
function getLootboxConfig(type) {
    return lootboxConfig.lootboxTypes[type] || null;
}

/**
 * Build the RCON command for a lootbox
 * @param {string} playerid - Player EOS ID
 * @param {string} type - Lootbox type
 * @param {number} amount - Amount of lootboxes
 * @returns {string} The RCON command
 */
function buildLootboxCommand(playerid, type, amount) {
    const lootbox = getLootboxConfig(type);
    if (!lootbox) {
        throw new Error(`Unknown lootbox type: ${type}`);
    }

    // Format: scriptcommand GOATARK GiveLootBox <playerid> <amount> <itemRolls>,<hasDino>,<itemEntryID>,<dinoEntryID>
    return `scriptcommand GOATARK GiveLootBox ${playerid} ${amount} ${lootbox.itemRolls},${lootbox.hasDino},${lootbox.itemEntryID},${lootbox.dinoEntryID}`;
}

/**
 * Validate EOS ID format
 * @param {string} playerid - Player ID to validate
 * @returns {boolean} True if valid
 */
function validatePlayerId(playerid) {
    // Accept EOS IDs (32 hex characters) or numeric IDs
    const eosIdPattern = /^[0-9a-fA-F]{32}$/;
    const numericPattern = /^\d+$/;
    
    return eosIdPattern.test(playerid) || numericPattern.test(playerid);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lootbox')
        .setDescription('Give GOATARK lootboxes to a player')
        .addStringOption(option =>
            option.setName('playerid')
                .setDescription('Player EOS ID (e.g., 000270ce7aa540bca6c8674861f24208)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Lootbox type')
                .setRequired(true)
                .addChoices(
                    { name: 'GOAT Package', value: 'GOAT' },
                    { name: 'Premium Package', value: 'Premium' },
                    { name: 'R2G Package', value: 'R2G' },
                    { name: 'Killer Package', value: 'Killer' },
                    { name: 'Resource LootBox', value: 'Resource' },
                    { name: 'Gear LootBox', value: 'Gear' },
                    { name: 'Breeding Pair LootBox', value: 'Breeding' },
                    { name: 'Mixed LootBox', value: 'Mixed' }
                ))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of lootboxes (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addStringOption(option =>
            option.setName('server')
                .setDescription('Server to send the lootbox on (optional - sends to all if not specified)')
                .setRequired(false)
                .setAutocomplete(true)),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const serverNames = config.getServerNames(true); // Include "ALL"
        
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

        // Get parameters
        const playerid = interaction.options.getString('playerid').trim();
        const type = interaction.options.getString('type');
        const amount = interaction.options.getInteger('amount');
        const serverName = interaction.options.getString('server') || 'ALL';

        // Defer reply as RCON might take time
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Validate player ID
        if (!validatePlayerId(playerid)) {
            await interaction.editReply({
                content: '❌ Invalid player ID format. Please provide a valid EOS ID (32 hex characters) or numeric ID.'
            });
            return;
        }

        // Validate lootbox type
        const lootboxInfo = getLootboxConfig(type);
        if (!lootboxInfo) {
            await interaction.editReply({
                content: `❌ Unknown lootbox type: "${type}"`
            });
            return;
        }

        // Build RCON command
        let rconCommand;
        try {
            rconCommand = buildLootboxCommand(playerid, type, amount);
        } catch (error) {
            await interaction.editReply({
                content: `❌ Error building command: ${error.message}`
            });
            return;
        }

        // Send RCON command
        const results = await sendCommandByName(serverName, rconCommand);

        // Build response embed
        const embed = new EmbedBuilder()
            .setTitle('🎁 Lootbox Command Sent')
            .setColor(results.some(r => !r.success) ? 0xFF0000 : 0x00FF00)
            .addFields(
                { name: '👤 Player ID', value: `\`${playerid}\``, inline: true },
                { name: '📦 Lootbox Type', value: lootboxInfo.displayName, inline: true },
                { name: '🔢 Amount', value: amount.toString(), inline: true },
                { name: '📡 RCON Command', value: `\`\`\`\n${rconCommand}\n\`\`\``, inline: false }
            )
            .setTimestamp();

        // Add server results
        let resultText = '';
        if (serverName === 'ALL') {
            embed.setDescription(`**Sent to all servers:**`);
            for (const result of results) {
                if (result.success) {
                    resultText += `✅ **${result.serverName}**: Success\n`;
                } else {
                    resultText += `❌ **${result.serverName}**: ${result.error}\n`;
                }
            }
        } else {
            const result = results[0];
            if (result.success) {
                embed.setDescription(`✅ **Success on ${result.serverName}**`);
                if (result.response && result.response.trim() !== '' && result.response !== '(No response from server)') {
                    resultText = `**Server Response:**\n\`\`\`\n${result.response}\n\`\`\``;
                }
            } else {
                embed.setDescription(`❌ **Failed on ${result.serverName}**`);
                resultText = `**Error:** ${result.error}`;
            }
        }

        if (resultText) {
            // Truncate if too long for embed field
            if (resultText.length > 1024) {
                resultText = resultText.substring(0, 1021) + '...';
            }
            embed.addFields({ name: '📋 Results', value: resultText, inline: false });
        }

        await interaction.editReply({ embeds: [embed] });

        // Log to audit channel
        await logCommand(
            interaction.client,
            interaction,
            '/lootbox',
            {
                playerid,
                type: lootboxInfo.displayName,
                amount,
                serverName
            },
            results
        );
    }
};
