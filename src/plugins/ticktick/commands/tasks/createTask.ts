import {
	getErrorMessage,
	writeAccessDeniedResponse,
} from "../../../../utils/error";
import type { ResultAsync } from "../../../../utils/result";
import { API_TIMEOUT, baseUrl } from "../../constants";
import { checkWritePermission, getProjectIdByName } from "../../lib/projects";
import type { Task } from "../../types/api";
import type { TickTickUserSettings } from "../../types/plugin";
import type { TickTickCommandParams } from "../../types/plugin";
import { buildRequestHeaders, isRetriableError } from "../../utils/api";

/**
 * Create a new task in TickTick.
 */
export async function commandCreateTask(
	params: TickTickCommandParams<"create_task">,
	userSettings: TickTickUserSettings,
): ResultAsync<Task> {
	if (!params.taskData?.title) {
		return {
			success: false,
			error: "taskData with title is required",
			canTryAnotherApproach: true,
		};
	}

	// Copy projectId from root to taskData if needed
	if (!params.taskData.projectId && params.projectId) {
		params.taskData.projectId = params.projectId;
	}

	// Validate mutual exclusivity of content and items
	if (params.taskData.content && params.taskData.items) {
		return {
			success: false,
			error: "Task cannot have both content and items (subtasks)",
			canTryAnotherApproach: true,
		};
	}

	try {
		// If projectId is not provided but name is, resolve the ID
		if (!params.taskData.projectId && params.projectName) {
			const projectIdResponse = await getProjectIdByName(
				params.projectName,
				userSettings,
			);
			if (!projectIdResponse.success) {
				return projectIdResponse;
			}
			params.taskData.projectId = projectIdResponse.data;
		}

		if (!params.taskData.projectId) {
			return {
				success: false,
				error: "projectId in taskData is required",
				canTryAnotherApproach: true,
			};
		}

		// Check write permissions
		const permissionCheck = await checkWritePermission(
			params.taskData.projectId,
			userSettings,
		);
		if (!permissionCheck.success) {
			return permissionCheck;
		}
		if (!permissionCheck.data) {
			return writeAccessDeniedResponse;
		}

		const response = await fetch(`${baseUrl}/task`, {
			method: "POST",
			headers: buildRequestHeaders(userSettings),
			body: JSON.stringify(params.taskData),
			signal: AbortSignal.timeout(API_TIMEOUT),
		});

		if (!response.ok) {
			return {
				success: false,
				error: `HTTP error! status: ${response.status}`,
				canTryAnotherApproach: isRetriableError(response.status),
			};
		}

		const data = await response.json();
		return { success: true, data };
	} catch (error) {
		return {
			success: false,
			error: `Failed to create task: ${getErrorMessage(error)}`,
			canTryAnotherApproach: true,
		};
	}
}
