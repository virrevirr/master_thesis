const vscode = require('vscode');
const { randomUUID } = require('crypto');
const Session = require('./Session');
const { ensureUserName } = require('../user/userProfile');
const { promptForTaskDescription, promptForReflection } = require('../ui/prompts');
const { readSessions, writeSessions } = require('../storage/localFallback');

/**
 * Starts a new session
 * @param {vscode.ExtensionContext} context
 * @param {Object} sessionState - Object to hold current session reference
 * @returns {Promise<boolean>} True if session started successfully
 */
async function startSession(context, sessionState) {
	// Check if session already active
	if (sessionState.currentSession && sessionState.currentSession.isActive) {
		vscode.window.showWarningMessage('A session is already active.');
		return false;
	}

	// Get or prompt for user name
	const userName = await ensureUserName(context);
	if (!userName) {
		vscode.window.showWarningMessage('Session not started: user name is required.');
		return false;
	}

	// Prompt for task description
	const taskDescription = await promptForTaskDescription();
	if (!taskDescription) {
		return false;
	}

	// Create session
	const sessionId = randomUUID();
	sessionState.currentSession = new Session(sessionId, userName, taskDescription);

	// Save session to storage
	const storageData = readSessions();
	storageData.sessions.push(sessionState.currentSession.toJSON());
	writeSessions(storageData);

	vscode.window.showInformationMessage(`Session started: ${sessionId}`);
	return true;
}

/**
 * Stops the current session
 * @param {Object} sessionState - Object to hold current session reference
 * @returns {Promise<boolean>} True if session stopped successfully
 */
async function stopSession(sessionState) {
	// Check if session exists and is active
	if (!sessionState.currentSession || !sessionState.currentSession.isActive) {
		vscode.window.showWarningMessage('No active session to stop.');
		return false;
	}

	// Prompt for reflection
	const reflection = await promptForReflection();

	// Stop the current session with reflection
	sessionState.currentSession.stop(reflection);

	// Update session in storage
	const storageData = readSessions();
	const sessionIndex = storageData.sessions.findIndex(
		s => s.sessionId === sessionState.currentSession.sessionId
	);
	if (sessionIndex !== -1) {
		storageData.sessions[sessionIndex] = sessionState.currentSession.toJSON();
		writeSessions(storageData);
	}

	vscode.window.showInformationMessage(
		`Session stopped. Duration: ${sessionState.currentSession.getDuration()}ms`
	);
	return true;
}

module.exports = {
	startSession,
	stopSession
};
