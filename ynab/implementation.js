// src/utils/error.ts
function isError(error) {
  return error instanceof Error;
}
function getErrorMessage(error) {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error occurred";
}

// src/plugins/ynab/constants.ts
var baseUrl = "https://api.ynab.com/v1";

// src/plugins/ynab/commands/budgets/getBudgetMonth.ts
async function commandGetBudgetMonth(params, userSettings) {
  try {
    const url = `${baseUrl}/budgets/${params.budgetId}/months/${params.budgetMonth}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${userSettings.accessToken}`
      }
    });
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        canTryAnotherApproach: response.status >= 500
      };
    }
    const data = await response.json();
    return { success: true, data: data.data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch budget month: ${getErrorMessage(error)}`,
      canTryAnotherApproach: true
    };
  }
}

// src/plugins/ynab/commands/budgets/getBudgetMonthTransactions.ts
var dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
async function commandGetBudgetMonthTransactions(params, userSettings) {
  try {
    const url = new URL(`${baseUrl}/budgets/${params.budgetId}/months/${params.budgetMonth}/transactions`);
    if (typeof params.transactionsSinceDate === "string") {
      if (params.transactionsSinceDate.match(dateFormatRegex) === null) {
        return {
          success: false,
          error: "Invalid date format. Expected 'YYYY-MM-DD'.",
          canTryAnotherApproach: false
        };
      }
      url.searchParams.set("since_date", params.transactionsSinceDate);
    }
    if (params.transactionType !== undefined && ["uncategorized", "unapproved"].includes(params.transactionType)) {
      url.searchParams.set("type", params.transactionType);
    }
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${userSettings.accessToken}`
      }
    });
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        canTryAnotherApproach: response.status >= 500
      };
    }
    const data = await response.json();
    return { success: true, data: data.data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch budget month: ${getErrorMessage(error)}`,
      canTryAnotherApproach: true
    };
  }
}

// src/plugins/ynab/commands/budgets/listBudgets.ts
async function commandListBudgets(params, userSettings) {
  try {
    let url = "https://api.ynab.com/v1/budgets";
    if (params.budgetsWithAccounts) {
      url += "?include_accounts=true";
    }
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${userSettings.accessToken}`
      }
    });
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        canTryAnotherApproach: response.status >= 500
      };
    }
    const data = await response.json();
    return { success: true, data: data.data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch budgets: ${getErrorMessage(error)}`,
      canTryAnotherApproach: true
    };
  }
}

// src/plugins/ynab/index.ts
function ynab_plugin(params, userSettings) {
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

