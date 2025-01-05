import type { OpenAiFunctionSpec } from "./openai-function-spec";
import type { TypingMindUserSettings } from "./typingmind-user-settings";

/**
 * TypingMind plugin configuration generator
 */
export type TypingMindGetPlugin = (
	overviewMarkdown: string,
	code: string,
) => TypingMindPlugin;

/**
 * TypingMind plugin configuration (plugin.json)
 *
 * @see https://docs.typingmind.com/plugins/share-import-plugins
 */
export type TypingMindPlugin = {
	/** Version number for plugin updates */
	version: number;
	/** Unique identifier for the plugin */
	uuid: string;
	/** URL to plugin's icon */
	iconURL?: string;
	/** Fallback emoji if iconURL is unavailable */
	emoji?: string;
	/** Display name of the plugin */
	title: string;
	/** Description of the plugin */
	overviewMarkdown?: string;
	/** Source code of the plugin */
	code: string;
	/** Date when plugin was last synced */
	syncedAt?: string | null;
	/** User settings in JSON string format */
	userSettings: TypingMindUserSettings;
	/** OpenAI specification in JSON string format */
	openaiSpec: OpenAiFunctionSpec;
	/** Implementation type */
	implementationType: "http" | "javascript";
	/** HTTP action configuration in JSON string format */
	httpAction?: {
		/** Unique identifier, preferably UUID */
		id: string;
		/** HTTP request method */
		method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
		/** Request URL */
		url: string;
		/** Indicates if request has headers */
		hasHeaders: boolean;
		/** Request headers in JSON format */
		requestHeaders?: Record<string, string | number>;
		/** Indicates if request has body */
		hasBody: boolean;
		/** Request body in JSON format */
		requestBody?: Record<string, unknown>;
		/** Request body format, either "json" or "form-data" */
		requestBodyFormat: "json" | "form-data";
		/** Indicates if result transformation is needed */
		hasResultTransform: boolean;
		/** Result transformation configuration */
		resultTransform?: {
			engine: "handlebars" | "jmes";
			templateString?: string;
			expression?: string;
		};
	};
	/** Output type */
	outputType: "respond_to_ai" | "render_markdown" | "render_html";
};
