/**
 * User cooldown manager to prevent command spam
 */
class CooldownManager {
    constructor() {
        this.cooldowns = new Map();
        this.defaultCooldownMs = 2000; // 2 seconds default
        this.cleanupInterval = 60000; // Cleanup every minute
        
        // Periodic cleanup of old cooldowns
        setInterval(() => this.cleanup(), this.cleanupInterval);
    }

    /**
     * Check if user is on cooldown for a command
     * @param {string} userId - Discord user ID
     * @param {string} commandName - Command name
     * @param {number} cooldownMs - Cooldown time in ms (optional)
     * @returns {Object} - { onCooldown: boolean, remainingMs: number }
     */
    checkCooldown(userId, commandName, cooldownMs = null) {
        const key = `${userId}-${commandName}`;
        const lastUse = this.cooldowns.get(key);
        const cooldown = cooldownMs || this.defaultCooldownMs;

        if (!lastUse) {
            return { onCooldown: false, remainingMs: 0 };
        }

        const elapsed = Date.now() - lastUse;
        const remaining = cooldown - elapsed;

        if (remaining > 0) {
            return { 
                onCooldown: true, 
                remainingMs: remaining 
            };
        }

        return { onCooldown: false, remainingMs: 0 };
    }

    /**
     * Set cooldown for a user and command
     * @param {string} userId - Discord user ID
     * @param {string} commandName - Command name
     */
    setCooldown(userId, commandName) {
        const key = `${userId}-${commandName}`;
        this.cooldowns.set(key, Date.now());
    }

    /**
     * Clear cooldown for a user and command
     * @param {string} userId - Discord user ID
     * @param {string} commandName - Command name
     */
    clearCooldown(userId, commandName) {
        const key = `${userId}-${commandName}`;
        this.cooldowns.delete(key);
    }

    /**
     * Clear all cooldowns for a user
     * @param {string} userId - Discord user ID
     */
    clearUserCooldowns(userId) {
        for (const key of this.cooldowns.keys()) {
            if (key.startsWith(userId + '-')) {
                this.cooldowns.delete(key);
            }
        }
    }

    /**
     * Cleanup old cooldowns (older than 5 minutes)
     */
    cleanup() {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        for (const [key, timestamp] of this.cooldowns.entries()) {
            if (timestamp < fiveMinutesAgo) {
                this.cooldowns.delete(key);
            }
        }
    }

    /**
     * Get formatted time remaining message
     * @param {number} ms - Milliseconds remaining
     * @returns {string} - Formatted message
     */
    getTimeRemainingMessage(ms) {
        const seconds = Math.ceil(ms / 1000);
        return `Please wait ${seconds} second${seconds !== 1 ? 's' : ''} before using this command again.`;
    }
}

// Export singleton instance
module.exports = new CooldownManager();
