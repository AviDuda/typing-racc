import type { Err } from "./result";

export const writeAccessDeniedResponse: Err = {
	success: false,
	error: "Write access denied to this project",
	canTryAnotherApproach: false,
};

/**
 * Type guard to check if an unknown error is an Error object
 */
export function isError(error: unknown): error is Error {
	return error instanceof Error;
}

/**
 * Get a readable message from an error object
 */
export function getErrorMessage(error: unknown): string {
	if (isError(error)) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	return "Unknown error occurred";
}
