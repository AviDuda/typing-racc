/**
 * Successful result
 * @param data - Data to return
 */
export function Ok<T>(data: T): Ok<T> {
	return { success: true, data };
}

/**
 * Error result
 * @param error - Error message
 * @param canTryAnotherApproach - Whether AI can try another approach
 */
export function Err(error: string, canTryAnotherApproach = true): Err {
	return { success: false, error, canTryAnotherApproach };
}

/**
 * Object representing a successful result
 */
export type Ok<TData> = { success: true; data: TData };

/**
 * Object representing an error result
 */
export type Err = {
	success: false;
	error: string;
	canTryAnotherApproach?: boolean;
};

/**
 * Union type representing both successful and error results
 */
export type Result<T> = Ok<T> | Err;

/**
 * Union type representing both successful and error results, wrapped in a Promise
 */
export type ResultAsync<T> = Promise<Result<T>>;
