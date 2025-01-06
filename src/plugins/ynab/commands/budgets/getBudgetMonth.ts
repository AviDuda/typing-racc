import { getErrorMessage } from "../../../../utils/error";
import type { ResultAsync } from "../../../../utils/result";
import { baseUrl } from "../../constants";
import type { SchemaMonthDetailResponse } from "../../types/api";
import type { YnabCommandParams, YnabUserSettings } from "../../types/plugin";

/**
 * Get a budget list from YNAB
 */
export async function commandGetBudgetMonth(
	params: YnabCommandParams<"get_budget_month">,
	userSettings: YnabUserSettings,
): ResultAsync<SchemaMonthDetailResponse["data"]> {
	try {
		const url = `${baseUrl}/budgets/${params.budgetId}/months/${params.budgetMonth}`;
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

		const data = (await response.json()) as SchemaMonthDetailResponse;
		return { success: true, data: data.data };
	} catch (error) {
		return {
			success: false,
			error: `Failed to fetch budget month: ${getErrorMessage(error)}`,
			canTryAnotherApproach: true,
		};
	}
}
