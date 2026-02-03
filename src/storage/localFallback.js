const fs = require('fs');
const path = require('path');

const storageFilePath = path.join(__dirname, 'sessionStorage');

/**
 * Reads sessions from the storage file
 */
function readSessions() {
	try {
		const data = fs.readFileSync(storageFilePath, 'utf8');
		const json = JSON.parse(data);
		console.log(`[Storage] Read ${json.sessions.length} sessions from file`);
		return json;
	} catch (error) {
		console.error('[Storage] Error reading sessions:', error);
		return { sessions: [] };
	}
}

/**
 * Writes sessions to the storage file
 */
function writeSessions(data) {
	try {
		fs.writeFileSync(storageFilePath, JSON.stringify(data, null, 2), 'utf8');
		console.log(`[Storage] Wrote ${data.sessions.length} sessions to file`);
	} catch (error) {
		console.error('[Storage] Error writing sessions:', error);
	}
}

module.exports = {
	readSessions,
	writeSessions
};
