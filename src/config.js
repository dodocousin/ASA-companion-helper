const fs = require('fs');
const path = require('path');

/**
 * Configuration loader with hot-reload support
 */
class Config {
    constructor() {
        this.configPath = path.join(__dirname, '..', 'config.json');
        this.config = null;
        this.load();
    }

    /**
     * Load or reload the configuration from config.json
     */
    load() {
        try {
            const data = fs.readFileSync(this.configPath, 'utf8');
            this.config = JSON.parse(data);
            console.log('Configuration loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading config.json:', error.message);
            throw error;
        }
    }

    /**
     * Reload the configuration file
     */
    reload() {
        return this.load();
    }

    /**
     * Get Discord configuration
     */
    get discord() {
        return this.config.Discord;
    }

    /**
     * Get RCON configuration
     */
    get rcon() {
        return this.config.Rcon;
    }

    /**
     * Get all servers
     */
    get servers() {
        return this.config.Servers;
    }

    /**
     * Get a specific server by name
     * @param {string} serverName - The name of the server
     */
    getServer(serverName) {
        return this.servers.find(s => s.ServerName === serverName);
    }

    /**
     * Get server names for autocomplete
     * @param {boolean} includeAll - Whether to include "ALL" option
     */
    getServerNames(includeAll = false) {
        const names = this.servers.map(s => s.ServerName);
        if (includeAll) {
            names.unshift('ALL');
        }
        return names;
    }
}

// Export singleton instance
module.exports = new Config();
