const Rcon = require('rcon-srcds').default;
const config = require('./config');

/**
 * Command queue to prevent concurrent RCON operations
 */
class CommandQueue {
    constructor() {
        this.isProcessing = false;
        this.queue = [];
        this.maxQueueSize = 10;
    }

    async execute(fn) {
        // Check queue size
        if (this.queue.length >= this.maxQueueSize) {
            throw new Error('Command queue is full. Please wait and try again.');
        }

        // Add to queue
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        // If already processing or queue is empty, return
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const { fn, resolve, reject } = this.queue.shift();
            
            try {
                const result = await fn();
                resolve(result);
            } catch (error) {
                reject(error);
            }

            // Small delay between commands to prevent overwhelming servers
            await new Promise(r => setTimeout(r, 100));
        }

        this.isProcessing = false;
    }

    getQueueSize() {
        return this.queue.length;
    }

    isQueueBusy() {
        return this.isProcessing;
    }
}

// Global command queue
const commandQueue = new CommandQueue();

/**
 * Create a timeout promise
 * @param {number} ms - Timeout in milliseconds
 */
function createTimeout(ms) {
    return new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout - server did not respond')), ms)
    );
}

/**
 * Safely disconnect from RCON with timeout
 * @param {Object} rcon - RCON connection
 */
async function safeDisconnect(rcon) {
    if (!rcon) return;

    try {
        // Force disconnect within 1 second
        await Promise.race([
            rcon.disconnect(),
            new Promise(resolve => setTimeout(resolve, 1000))
        ]);
    } catch (e) {
        // Ignore disconnect errors, connection will be garbage collected
    }
}

/**
 * Execute RCON command with proper timeout and cleanup
 * @param {Object} server - Server object from config
 * @param {string} command - The RCON command to send
 * @returns {Promise<Object>} - Result object
 */
async function executeRconCommand(server, command) {
    const timeoutMs = config.rcon.TimeoutSeconds * 1000;
    let rcon = null;

    try {
        // Create RCON connection
        rcon = new Rcon({
            host: server.IP,
            port: server.Port,
            timeout: timeoutMs
        });

        // Wrap entire operation in timeout
        const result = await Promise.race([
            (async () => {
                await rcon.authenticate(server.Password);
                const response = await rcon.execute(command);
                await safeDisconnect(rcon);
                return {
                    success: true,
                    serverName: server.ServerName,
                    response: response || '(No response from server)'
                };
            })(),
            createTimeout(timeoutMs)
        ]);

        return result;

    } catch (error) {
        // Ensure connection is closed
        await safeDisconnect(rcon);

        // Handle specific error types
        let errorMessage = 'Unknown error';
        
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
            errorMessage = `Connection timeout (no response after ${config.rcon.TimeoutSeconds}s)`;
        } else if (error.message.includes('ECONNREFUSED')) {
            errorMessage = 'Server offline or unreachable';
        } else if (error.message.includes('authentication') || error.message.includes('password')) {
            errorMessage = 'Authentication failed - check RCON password';
        } else if (error.message.includes('ENOTFOUND')) {
            errorMessage = 'Server address not found';
        } else if (error.message.includes('ECONNRESET')) {
            errorMessage = 'Connection reset by server';
        } else {
            errorMessage = error.message;
        }

        return {
            success: false,
            serverName: server.ServerName,
            error: errorMessage
        };
    }
}

/**
 * Send an RCON command to a specific server (queued)
 * @param {Object} server - Server object from config
 * @param {string} command - The RCON command to send
 * @returns {Promise<Object>} - Result object with success status and data/error
 */
async function sendCommand(server, command) {
    return await commandQueue.execute(() => executeRconCommand(server, command));
}

/**
 * Send an RCON command to all servers in config
 * @param {string} command - The RCON command to send
 * @returns {Promise<Array>} - Array of result objects
 */
async function sendCommandToAll(command) {
    const servers = config.servers;
    
    // Execute all in parallel but each server operation is still queued internally
    const promises = servers.map(server => 
        commandQueue.execute(() => executeRconCommand(server, command))
    );
    
    return await Promise.all(promises);
}

/**
 * Send an RCON command to a server by name, or all servers if name is "ALL"
 * @param {string} serverName - Server name or "ALL"
 * @param {string} command - The RCON command to send
 * @returns {Promise<Array>} - Array of result objects
 */
async function sendCommandByName(serverName, command) {
    if (serverName === 'ALL') {
        return await sendCommandToAll(command);
    } else {
        const server = config.getServer(serverName);
        if (!server) {
            return [{
                success: false,
                serverName: serverName,
                error: 'Server not found in configuration'
            }];
        }
        const result = await sendCommand(server, command);
        return [result];
    }
}

/**
 * Get queue status
 */
function getQueueStatus() {
    return {
        queueSize: commandQueue.getQueueSize(),
        isProcessing: commandQueue.isQueueBusy()
    };
}

module.exports = {
    sendCommand,
    sendCommandToAll,
    sendCommandByName,
    getQueueStatus
};
