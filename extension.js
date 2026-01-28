const vscode = require('vscode');
const Session = require('./session');
const { randomUUID } = require("crypto");
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

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// activated as soon as the extension is loaded and only run once
	let currentSession = null;

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('incontrol.inControl', function () {
		// The code you place here will be executed every time your command is executed

		// Example: Start a session
		if (!currentSession || !currentSession.isActive) {
			const sessionId = randomUUID();
			currentSession = new Session(sessionId);

			// Save session to storage
			const storageData = readSessions();
			storageData.sessions.push(currentSession.toJSON());
			writeSessions(storageData);

			vscode.window.showInformationMessage(`Session started: ${sessionId}`);
		}
		else {
			// Stop the current session
			currentSession.stop();

			// Update session in storage
			const storageData = readSessions();
			const sessionIndex = storageData.sessions.findIndex(s => s.sessionId === currentSession.sessionId);
			if (sessionIndex !== -1) {
				storageData.sessions[sessionIndex] = currentSession.toJSON();
				writeSessions(storageData);
			}

			vscode.window.showInformationMessage(`Session stopped. Duration: ${currentSession.getDuration()}ms`);
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {
	console.log('[Extension] InControl extension is now deactivated');
}

module.exports = {
	activate,
	deactivate
}
