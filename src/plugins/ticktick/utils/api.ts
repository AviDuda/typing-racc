import type { TickTickUserSettings } from "../types/plugin";

/**
 * Check if an HTTP status code indicates a retriable error
 *
 * @param statusCode HTTP status code
 * @returns True if the error is potentially retriable
 */
export function isRetriableError(statusCode: number): boolean {
	// 401 = auth error (not retriable)
	// 500+ = server error (not retriable)
	// all other errors are potentially retriable
	return statusCode !== 401 && statusCode < 500;
}

/**
 * Build request headers for TickTick API.
 */
export function buildRequestHeaders(userSettings: TickTickUserSettings) {
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${userSettings.accessKey}`,
	};
}
