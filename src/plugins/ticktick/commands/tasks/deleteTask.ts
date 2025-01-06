import {
	getErrorMessage,
	writeAccessDeniedResponse,
} from "../../../../utils/error";
import type { ResultAsync } from "../../../../utils/result";
import { API_TIMEOUT, baseUrl } from "../../constants";
import {
	checkWritePermission,
	findProjectIdFromTaskReference,
	getProjectIdByName,
} from "../../lib/projects";
import type { TickTickUserSettings } from "../../types/plugin";
import type { TickTickCommandParams } from "../../types/plugin";
import { buildRequestHeaders, isRetriableError } from "../../utils/api";

/**
 * Delete a task in TickTick.
 */
export async function commandDeleteTask(
	params: TickTickCommandParams<"delete_task">,
	userSettings: TickTickUserSettings,
): ResultAsync<string> {
	const taskId = params.taskId;
	let projectId = params.projectId;

	if (!taskId) {
		return {
			success: false,
			error: "taskId is required",
			canTryAnotherApproach: true,
		};
	}

	try {
		if (!projectId) {
			if (params.projectName) {
				const projectIdResponse = await getProjectIdByName(
					params.projectName,
					userSettings,
				);
				if (!projectIdResponse.success) {
					return projectIdResponse;
				}
				projectId = projectIdResponse.data;
			} else {
				const projectIdResponse = await findProjectIdFromTaskReference(
					taskId,
					userSettings,
				);
				if (!projectIdResponse.success) {
					return projectIdResponse;
				}
				projectId = projectIdResponse.data;
			}
		}

		// Check write permissions
		const permissionCheck = await checkWritePermission(
			projectId,
			userSettings,
		);
		if (!permissionCheck.success) {
			return permissionCheck;
		}
		if (!permissionCheck.data) {
			return writeAccessDeniedResponse;
		}

		const response = await fetch(
			`${baseUrl}/project/${projectId}/task/${taskId}`,
			{
				method: "DELETE",
				headers: buildRequestHeaders(userSettings),
				signal: AbortSignal.timeout(API_TIMEOUT),
			},
		);

		if (!response.ok) {
			return {
				success: false,
				error: `HTTP error! status: ${response.status}`,
				canTryAnotherApproach: isRetriableError(response.status),
			};
		}

		return { success: true, data: `Task ${taskId} deleted` };
	} catch (error) {
		return {
			success: false,
			error: `Failed to delete task: ${getErrorMessage(error)}`,
			canTryAnotherApproach: true,
		};
	}
}
