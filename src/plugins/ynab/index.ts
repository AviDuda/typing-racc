import { commandGetBudgetMonth } from "./commands/budgets/getBudgetMonth";
import { commandGetBudgetMonthTransactions } from "./commands/budgets/getBudgetMonthTransactions";
import { commandListBudgets } from "./commands/budgets/listBudgets";
import type {
	YnabCommandParams,
	YnabCommandType,
	YnabUserSettings,
} from "./types/plugin";

/**
 * Main entrypoint for the YNAB plugin for TypingMind.
 */
export function ynab_plugin<TCommand extends keyof YnabCommandType>(
	params: YnabCommandParams<TCommand>,
	userSettings: YnabUserSettings,
) {
	switch (params.command) {
		case "list_budgets": {
			return commandListBudgets(params, userSettings);
		}
		case "get_budget_month": {
			return commandGetBudgetMonth(params, userSettings);
		}
		case "get_budget_month_transactions": {
			return commandGetBudgetMonthTransactions(params, userSettings);
		}

		default: {
			return { success: false, error: "Unknown command" };
		}
	}
}
