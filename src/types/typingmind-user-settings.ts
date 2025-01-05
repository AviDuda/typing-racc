/**
 * Structure of user settings for a TypingMind plugin (typingmind-user-settings.json)
 *
 * @see https://docs.typingmind.com/plugins/build-a-typingmind-plugin
 */
export type TypingMindUserSettings = TypingMindUserSetting[];

/**
 * Structure of a single user setting for a TypingMind plugin
 */
type TypingMindUserSetting = {
	/**
	 * Identifier used to retrieve user input
	 */
	name: string;

	/**
	 * Display label shown to users for the input field
	 */
	label: string;

	/**
	 * Indicates if the field must be filled
	 * @default false
	 */
	required?: boolean;

	/**
	 * Additional information shown below the label
	 */
	description?: string;

	/**
	 * Specifies the expected input data type
	 * @default "text"
	 */
	type?: "text" | "password" | "email" | "number" | "enum";

	/**
	 * Text shown in empty input field
	 */
	placeholder?: string;

	/**
	 * Available options when type is 'enum'
	 */
	values?: string[];

	/**
	 * Default value if user input is not provided
	 */
	defaultValue?: string | number;
};
