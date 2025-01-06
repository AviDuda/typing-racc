import { getErrorMessage } from "../../../../utils/error";
import type { ResultAsync } from "../../../../utils/result";
import { baseUrl } from "../../constants";
import type { SchemaMonthDetailResponse } from "../../types/api";
import type { YnabCommandParams, YnabUserSettings } from "../../types/plugin";

const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Get a budget list from YNAB
 */
export async function commandGetBudgetMonthTransactions(
	params: YnabCommandParams<"get_budget_month_transactions">,
	userSettings: YnabUserSettings,
): ResultAsync<SchemaMonthDetailResponse["data"]> {
	try {
		const url = new URL(
			`${baseUrl}/budgets/${params.budgetId}/months/${params.budgetMonth}/transactions`,
		);
		if (typeof params.transactionsSinceDate === "string") {
			if (params.transactionsSinceDate.match(dateFormatRegex) === null) {
				return {
					success: false,
					error: "Invalid date format. Expected 'YYYY-MM-DD'.",
					canTryAnotherApproach: false,
				};
			}
			url.searchParams.set("since_date", params.transactionsSinceDate);
		}
		if (
			params.transactionType !== undefined &&
			["uncategorized", "unapproved"].includes(params.transactionType)
		) {
			url.searchParams.set("type", params.transactionType);
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
