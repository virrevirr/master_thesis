/**
 * Represents a recording session
 */
class Session {
    /**
     * @param {string} sessionId
     * @param {string} userName
     * @param {string} taskDescription
     */

    constructor(sessionId, userName, taskDescription) {
        this.sessionId = sessionId;
        this.userName = userName;
        this.taskDescription = taskDescription;
        this.startTimestamp = Date.now();
        this.endTimestamp = null;
        this.reflection = null;
        this.isActive = true;
        console.log(`[Session] Session created: ${sessionId} at ${new Date(this.startTimestamp).toISOString()}`);
        console.log(`[Session] User: ${userName}`);
        console.log(`[Session] Task: ${taskDescription}`);
    }

    /**
     * Stops the session
     * @param {string} reflection - User reflection about the session
     */
    stop(reflection = '') {
        if (this.isActive) {
            this.endTimestamp = Date.now();
            this.reflection = reflection;
            this.isActive = false;
            const duration = this.getDuration();
            console.log(`[Session] Session stopped: ${this.sessionId} at ${new Date(this.endTimestamp).toISOString()}`);
            console.log(`[Session] Duration: ${(duration / 60000).toFixed(2)}min`);
            if (reflection) {
                console.log(`[Session] Reflection: ${reflection}`);
            }
        }
    }

    /**
     * Gets the session duration in milliseconds
     * @returns {number|null} Duration or null if session is still active
     */
    getDuration() {
        if (this.endTimestamp) {
            return this.endTimestamp - this.startTimestamp;
        }
        return null;
    }

    /**
     * Returns session data as a plain object
     * @returns {Object}
     */
    toJSON() {
        return {
            sessionId: this.sessionId,
            userName: this.userName,
            taskDescription: this.taskDescription,
            startTimestamp: this.startTimestamp,
            endTimestamp: this.endTimestamp,
            reflection: this.reflection,
            isActive: this.isActive
        };
    }
}


module.exports = Session;
