import { getErrorMessage } from "../../../../utils/error";
import type { ResultAsync } from "../../../../utils/result";
import type { SchemaBudgetSummaryResponse } from "../../types/api";
import type { YnabCommandParams, YnabUserSettings } from "../../types/plugin";

/**
 * Get a budget list from YNAB
 */
export async function commandListBudgets(
	params: YnabCommandParams<"list_budgets">,
	userSettings: YnabUserSettings,
): ResultAsync<SchemaBudgetSummaryResponse> {
	try {
		let url = "https://api.ynab.com/v1/budgets";
		if (params.budgetsWithAccounts) {
			url += "?include_accounts=true";
		}
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${userSettings.accessToken}`,
			},
		});

		if (!response.ok) {
			return {
				success: false,
				error: `HTTP error! status: ${response.status}`,
				canTryAnotherApproach: response.status >= 500,
			};
		}

		const data = (await response.json()) as SchemaBudgetSummaryResponse;
		return { success: true, data: data.data };
	} catch (error) {
		return {
			success: false,
			error: `Failed to fetch budgets: ${getErrorMessage(error)}`,
			canTryAnotherApproach: true,
		};
	}
}
