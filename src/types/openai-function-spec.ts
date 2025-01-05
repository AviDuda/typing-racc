/**
 * OpenAI function specification
 *
 * @see https://platform.openai.com/docs/guides/function-calling
 */
export type OpenAiFunctionSpec = {
	/** Function name, must be unique across all plugins */
	name: string;
	/** Function description */
	description: string;
	/**
	 * Toggles whether the function can be called in parallel
	 * @default true
	 */
	parallel_tool_calls?: boolean;
	/** Function parameters */
	parameters: JsonSchema;
};

type JsonSchema = {
	/** JSON schema version */
	$schema?: string;
	/** JSON schema type */
	type: "object";
	/** Function parameters */
	properties: {
		/** Parameter name */
		[key: string]: JsonSchemaProperty;
	};
	/** Required parameters */
	required?: string[];
	/**
	 * Allow additional properties
	 * @default true
	 */
	additionalProperties?: boolean;
	/** Default values for parameters */
	default?: {
		[key: string]: unknown;
	};
	/** Examples for parameters */
	examples?: {
		[key: string]: unknown;
	};
	/** Additional metadata */
	[key: string]: unknown;
};

type JsonSchemaProperty = {
	/** Parameter description */
	description: string;
	/** Parameter type */
	type: "string" | "number" | "integer" | "boolean" | "array" | "object";
	/** Default value */
	default?: unknown;
	/** Minimum value */
	minimum?: number;
	/** Maximum value */
	maximum?: number;
	/** Minimum length */
	minLength?: number;
	/** Maximum length */
	maxLength?: number;
	/** Enumerated values */
	enum?: unknown[];
	/** Array items */
	items?: JsonSchemaProperty;
	/** Additional properties */
	additionalProperties?: JsonSchemaProperty;
	/** Additional metadata */
	[key: string]: unknown;
};
