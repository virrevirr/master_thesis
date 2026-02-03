/**
 * Represents an event during a session
 */
class Event {
	/**
	 * @param {string} eventId
	 * @param {string} sessionId
	 * @param {string} userName
	 * @param {string} eventType - Type of event (terminal, diff, inference)
	 * @param {Object} data - Event-specific data
	 */
	constructor(eventId, sessionId, userName, eventType, data) {
		this.eventId = eventId;
		this.sessionId = sessionId;
		this.userName = userName;
		this.eventType = eventType;
		this.timestamp = Date.now();
		this.data = data;
	}

	/**
	 * Returns event data as a plain object
	 * @returns {Object}
	 */
	toJSON() {
		return {
			eventId: this.eventId,
			sessionId: this.sessionId,
			userName: this.userName,
			eventType: this.eventType,
			timestamp: this.timestamp,
			data: this.data
		};
	}
}

module.exports = Event;
