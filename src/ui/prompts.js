const vscode = require('vscode');

/**
 * Prompts user for task description at session start
 * @returns {Promise<string|undefined>} Task description or undefined if cancelled
 */
async function promptForTaskDescription() {
	const taskDescription = await vscode.window.showInputBox({
		prompt: 'What task will you work on during this session?',
		placeHolder: 'Enter task description',
		ignoreFocusOut: true
	});

	// Session cannot start without task description
	if (!taskDescription) {
		vscode.window.showWarningMessage('Session not started: task description is required.');
		return undefined;
	}

	return taskDescription;
}

/**
 * Prompts user for reflection at session end
 * @returns {Promise<string|undefined>} Reflection text or undefined if cancelled
 */
async function promptForReflection() {
	const reflection = await vscode.window.showInputBox({
		prompt: 'How did the session go? What did you accomplish?',
		placeHolder: 'Enter your reflection (optional)',
		ignoreFocusOut: true,
		value: '',
		// Multi-line is not directly supported by InputBox, but we can use a longer placeholder
		// For true multi-line, would need QuickPick or custom webview
	});

	// Reflection is optional, so we allow empty/cancel
	return reflection || '';
}

module.exports = {
	promptForTaskDescription,
	promptForReflection
};
