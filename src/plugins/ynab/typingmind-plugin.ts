import type { OpenAiFunctionSpec } from "../../types/openai-function-spec";
import type { TypingMindGetPlugin } from "../../types/typingmind-plugin";
import type { TypingMindUserSettings } from "../../types/typingmind-user-settings";

const openaiSpec: OpenAiFunctionSpec = {
	name: "ynab_plugin",
	description: "YNAB plugin for TypingMind",
	parallel_tool_calls: false,
	parameters: {
		type: "object",
		required: ["command"],
		properties: {
			command: {
				description: "The command to execute",
				type: "string",
				enum: [
					"list_budgets",
					"get_budget_month",
					"get_budget_month_transactions",
				],
			},
			budgetsWithAccounts: {
				description: "Whether to include accounts in the budget list",
				type: "boolean",
				default: false,
			},
			budgetId: {
				description: "The budget ID",
				type: "string",
			},
			budgetMonth: {
				description:
					"The budget month. Format: YYYY-MM-DD or `current`",
				type: "string",
			},
			transactionsSinceDate: {
				description:
					"Filter transactions since this date. Format: YYYY-MM-DD",
				type: "string",
			},
			transactionType: {
				description: "Filter transactions by type",
				type: "string",
				enum: ["uncategorized", "unapproved"],
			},
		},
	},
};

const userSettings: TypingMindUserSettings = [
	{
		name: "accessToken",
		label: "YNAB API Personal Access Token",
		description:
			"See the plugin documentation for instructions on how to obtain this token.",
		type: "password",
		required: true,
	},
];

const getPluginConfig: TypingMindGetPlugin = (
	overviewMarkdown: string,
	code: string,
) => ({
	uuid: "876103dd-a83d-4e04-84cc-9a3c6a34b379",
	version: 1,
	title: "YNAB",
	emoji: "💸",
	// iconURL: "TODO",
	overviewMarkdown,
	implementationType: "javascript",
	outputType: "respond_to_ai",
	openaiSpec,
	userSettings,
	code,
});

export default getPluginConfig;
