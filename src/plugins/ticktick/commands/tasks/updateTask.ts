import { API_TIMEOUT, baseUrl } from "../../constants";
import {
	checkWritePermission,
	findProjectIdFromTaskReference,
} from "../../lib/projects";
import type { Task, UserSettings } from "../../types/api";
import type { CommandParams } from "../../types/plugin";
import { buildRequestHeaders, isRetriableError } from "../../utils/api";
import { getErrorMessage, writeAccessDeniedResponse } from "../../utils/error";
import type { ResultAsync } from "../../utils/result";

/**
 * Update a task in TickTick.
 */
export async function commandUpdateTask(
	params: CommandParams<"update_task">,
	userSettings: UserSettings,
): ResultAsync<Task> {
	if (!params.taskData) {
		return {
			success: false,
			error: "taskData is required for update",
			canTryAnotherApproach: true,
		};
	}

	// Copy taskId from root to taskData if needed
	if (params.taskId && !params.taskData.id) {
		params.taskData.id = params.taskId;
	}

	if (!params.taskData.id) {
		return {
			success: false,
			error: "taskId is required (either in taskData.id or params.taskId)",
			canTryAnotherApproach: true,
		};
	}

	// Copy projectId from root to taskData if needed
	if (params.projectId && !params.taskData.projectId) {
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
		// Get the task's current project ID if not provided
		let taskProjectId: string;
		if (params.taskData.projectId) {
			// If projectId is provided in taskData, verify it matches the task's current project
			const currentProjectResponse = await findProjectIdFromTaskReference(
				params.taskData.id,
				userSettings,
			);
			if (!currentProjectResponse.success) {
				return currentProjectResponse;
			}

			if (params.taskData.projectId !== currentProjectResponse.data) {
				return {
					success: false,
					error:
						"Cannot change task's project - create a new task in the target project instead",
					canTryAnotherApproach: false,
				};
			}
			taskProjectId = params.taskData.projectId;
		} else {
			// If projectId is not provided but name is, resolve the ID
			const projectIdResponse = await findProjectIdFromTaskReference(
				params.taskData.id,
				userSettings,
			);
			if (!projectIdResponse.success) {
				return projectIdResponse;
			}
			taskProjectId = projectIdResponse.data;
		}

		// Set the verified project ID
		params.taskData.projectId = taskProjectId;

		// Check write permissions for the project
		const permissionCheck = await checkWritePermission(
			taskProjectId,
			userSettings,
		);
		if (!permissionCheck.success) {
			return permissionCheck;
		}
		if (!permissionCheck.data) {
			return writeAccessDeniedResponse;
		}

		const response = await fetch(`${baseUrl}/task/${params.taskData.id}`, {
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
			error: `Failed to update task: ${getErrorMessage(error)}`,
			canTryAnotherApproach: true,
		};
	}
}
