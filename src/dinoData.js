const fs = require('fs');
const path = require('path');

/**
 * Dino data loader with hot-reload support
 */
class DinoData {
    constructor() {
        this.dataPath = path.join(__dirname, '..', 'dinos.json');
        this.data = null;
        this.load();
    }

    /**
     * Load or reload the dino data from dinos.json
     */
    load() {
        try {
            const fileData = fs.readFileSync(this.dataPath, 'utf8');
            this.data = JSON.parse(fileData);
            console.log(`Dino data loaded successfully (${this.data.dinos.length} dinos)`);
            return true;
        } catch (error) {
            console.error('Error loading dinos.json:', error.message);
            throw error;
        }
    }

    /**
     * Reload the dino data file
     */
    reload() {
        return this.load();
    }

    /**
     * Get all dinos
     */
    get dinos() {
        return this.data.dinos;
    }

    /**
     * Get a specific dino by name
     * @param {string} dinoName - The name of the dino
     */
    getDino(dinoName) {
        return this.dinos.find(d => d.name === dinoName);
    }

    /**
     * Get dino blueprint by name
     * @param {string} dinoName - The name of the dino
     */
    getBlueprint(dinoName) {
        const dino = this.getDino(dinoName);
        return dino ? dino.blueprint : null;
    }

    /**
     * Get dino names for autocomplete
     */
    getDinoNames() {
        return this.dinos.map(d => d.name);
    }
}

// Export singleton instance
module.exports = new DinoData();
