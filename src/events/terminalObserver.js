const vscode = require('vscode');
const { randomUUID } = require('crypto');
const Event = require('./Event');

/**
 * Observes terminal output and reconstructs Claude Code interactions in real time.
 * Uses VS Code's built-in terminal observation without PTY ownership.
 */
class TerminalObserver {
	constructor(sessionId, userName, onEventRecorded) {
		this.sessionId = sessionId;
		this.userName = userName;
		this.onEventRecorded = onEventRecorded;

		// Terminal state
		this.activeTerminals = new Set();
		this.outputBuffer = '';
		this.currentInteraction = null;
		this.eventBuffer = [];

		// Disposables
		this.disposables = [];

		// Claude Code markers
		this.CLAUDE_PROMPT_MARKER = '❯';
		this.PROMPT_PATTERN = /❯\s/;
	}

	/**
	 * Start observing terminals
	 */
	start() {
		console.log('[TerminalObserver] Starting terminal observation');

		// Subscribe to terminal data events
		const writeDataDisposable = vscode.window.onDidWriteTerminalData((e) => {
			this.handleTerminalData(e.terminal, e.data);
		});

		// Track terminal creation/closure
		const openTerminalDisposable = vscode.window.onDidOpenTerminal((terminal) => {
			console.log('[TerminalObserver] Terminal opened:', terminal.name);
			this.activeTerminals.add(terminal);
		});

		const closeTerminalDisposable = vscode.window.onDidCloseTerminal((terminal) => {
			console.log('[TerminalObserver] Terminal closed:', terminal.name);
			this.activeTerminals.delete(terminal);
		});

		// Track existing terminals
		vscode.window.terminals.forEach((terminal) => {
			this.activeTerminals.add(terminal);
		});

		this.disposables.push(writeDataDisposable, openTerminalDisposable, closeTerminalDisposable);
		console.log('[TerminalObserver] Now observing', this.activeTerminals.size, 'terminals');
	}

	/**
	 * Handle terminal output data
	 * @param {vscode.Terminal} terminal
	 * @param {string} data
	 */
	handleTerminalData(terminal, data) {
		// Log raw terminal output to console for verification
		console.log('[TerminalObserver] Raw terminal output:', data);

		// Only observe active session terminals
		if (!this.activeTerminals.has(terminal)) {
			return;
		}

		// Timestamp this chunk
		const timestamp = Date.now();

		// Add to buffer
		this.outputBuffer += data;

		// Process buffer for interaction boundaries
		this.processBuffer(timestamp);
	}

	/**
	 * Process output buffer to detect interaction boundaries
	 * @param {number} timestamp
	 */
	processBuffer(timestamp) {
		// Check for Claude prompt marker
		if (this.PROMPT_PATTERN.test(this.outputBuffer)) {
			console.log('[TerminalObserver] Detected Claude prompt marker');

			// If we have a current interaction, close it
			if (this.currentInteraction) {
				this.closeInteraction(timestamp);
			}

			// Start new interaction
			this.startInteraction(timestamp);
		}
	}

	/**
	 * Start a new interaction
	 * @param {number} timestamp
	 */
	startInteraction(timestamp) {
		// Extract prompt from buffer
		const promptMatch = this.outputBuffer.match(/❯\s+(.+?)(?:\r?\n|$)/);
		const userPrompt = promptMatch ? promptMatch[1].trim() : '';

		this.currentInteraction = {
			interactionId: randomUUID(),
			startTimestamp: timestamp,
			userPrompt: userPrompt,
			responseBuffer: '',
			events: []
		};

		console.log('[TerminalObserver] Started interaction:', this.currentInteraction.interactionId);
		console.log('[TerminalObserver] User prompt:', userPrompt);

		// Emit interaction_start event
		this.emitEvent('interaction_start', {
			interactionId: this.currentInteraction.interactionId,
			timestamp: timestamp
		});

		// Emit user_prompt event
		if (userPrompt) {
			this.emitEvent('user_prompt', {
				interactionId: this.currentInteraction.interactionId,
				prompt: userPrompt,
				source: 'claude_echo',
				timestamp: timestamp
			});
		}

		// Clear buffer after prompt line
		const promptEndIndex = this.outputBuffer.indexOf('\n', this.outputBuffer.indexOf('❯'));
		if (promptEndIndex !== -1) {
			this.outputBuffer = this.outputBuffer.substring(promptEndIndex + 1);
		}
	}

	/**
	 * Close current interaction
	 * @param {number} timestamp
	 */
	closeInteraction(timestamp) {
		if (!this.currentInteraction) {
			return;
		}

		console.log('[TerminalObserver] Closing interaction:', this.currentInteraction.interactionId);

		// Emit final response if any
		if (this.currentInteraction.responseBuffer) {
			this.emitEvent('claude_response', {
				interactionId: this.currentInteraction.interactionId,
				response: this.currentInteraction.responseBuffer,
				timestamp: timestamp
			});
		}

		// Emit interaction_end event
		this.emitEvent('interaction_end', {
			interactionId: this.currentInteraction.interactionId,
			duration: timestamp - this.currentInteraction.startTimestamp,
			timestamp: timestamp
		});

		// Flush event buffer
		this.flushEventBuffer();

		this.currentInteraction = null;
	}

	/**
	 * Emit an event (batched)
	 * @param {string} eventType
	 * @param {object} data
	 */
	emitEvent(eventType, data) {
		const event = new Event(
			randomUUID(),
			this.sessionId,
			this.userName,
			eventType,
			data
		);

		this.eventBuffer.push(event);

		// Flush buffer periodically or on interaction boundaries
		if (eventType === 'interaction_end' || this.eventBuffer.length >= 10) {
			this.flushEventBuffer();
		}
	}

	/**
	 * Flush event buffer to sync layer
	 */
	flushEventBuffer() {
		if (this.eventBuffer.length === 0) {
			return;
		}

		console.log('[TerminalObserver] Flushing', this.eventBuffer.length, 'events');

		// Forward all events to session
		this.eventBuffer.forEach((event) => {
			this.onEventRecorded(event);
		});

		this.eventBuffer = [];
	}

	/**
	 * Stop observing and cleanup
	 */
	stop() {
		console.log('[TerminalObserver] Stopping terminal observation');

		// Close any open interaction
		if (this.currentInteraction) {
			this.closeInteraction(Date.now());
			console.log('[TerminalObserver] Marked interaction as incomplete');
		}

		// Flush remaining events
		this.flushEventBuffer();

		// Dispose all listeners
		this.disposables.forEach((d) => d.dispose());
		this.disposables = [];

		this.activeTerminals.clear();
		this.outputBuffer = '';
	}

	/**
	 * Get current interaction status
	 * @returns {object|null}
	 */
	getCurrentInteraction() {
		return this.currentInteraction;
	}
}

module.exports = TerminalObserver;
