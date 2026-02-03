const vscode = require('vscode');
const { startSession, stopSession } = require('./session/sessionController');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// Session state holder
	const sessionState = { currentSession: null };

	// Register toggle command
	const disposable = vscode.commands.registerCommand('incontrol.inControl', async function () {
		// Toggle between start and stop
		if (!sessionState.currentSession || !sessionState.currentSession.isActive) {
			await startSession(context, sessionState);
		} else {
			await stopSession(sessionState);
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
