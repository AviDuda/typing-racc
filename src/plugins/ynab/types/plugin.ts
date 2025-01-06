/**
 * Plugin parameter types mapping
 */
export type YnabCommandType = {
	list_budgets: {
		command: "list_budgets";
		/**
		 * Whether to include accounts in the budget list
		 * @default false
		 */
		budgetsWithAccounts: boolean;
	};
	get_budget_month: {
		command: "get_budget_month";
		budgetId: string;
		budgetMonth: string;
	};
	get_budget_month_transactions: {
		command: "get_budget_month_transactions";
		budgetId: string;
		budgetMonth: string;
		transactionsSinceDate?: string;
		transactionType?: "uncategorized" | "unapproved";
	};
};

export type YnabCommandParams<T extends keyof YnabCommandType> =
	YnabCommandType[T];

export type YnabUserSettings = {
	accessToken: string;
};
