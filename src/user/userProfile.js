const vscode = require('vscode');

const USER_NAME_KEY = 'incontrol.userName';

/**
 * Gets the user name from global state
 * @param {vscode.ExtensionContext} context
 * @returns {string|undefined} User name if exists
 */
function getUserName(context) {
	return context.globalState.get(USER_NAME_KEY);
}

/**
 * Prompts user for their name and saves it to global state
 * @param {vscode.ExtensionContext} context
 * @returns {Promise<string|undefined>} User name or undefined if cancelled
 */
async function promptAndSaveUserName(context) {
	const userName = await vscode.window.showInputBox({
		prompt: 'What is your name?',
		placeHolder: 'Enter your name',
		ignoreFocusOut: true,
		validateInput: (value) => {
			if (!value || value.trim().length === 0) {
				return 'Name is required';
			}
			return null;
		}
	});

	if (userName) {
		await context.globalState.update(USER_NAME_KEY, userName.trim());
		console.log(`[UserProfile] User name saved: ${userName}`);
	}

	return userName?.trim();
}

/**
 * Gets user name from storage, or prompts if not exists
 * @param {vscode.ExtensionContext} context
 * @returns {Promise<string|undefined>} User name
 */
async function ensureUserName(context) {
	let userName = getUserName(context);

	if (!userName) {
		userName = await promptAndSaveUserName(context);
	}

	return userName;
}

module.exports = {
	getUserName,
	promptAndSaveUserName,
	ensureUserName
};
