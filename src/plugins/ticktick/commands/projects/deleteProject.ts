import { API_TIMEOUT, baseUrl } from "../../constants";
import { setCachedProjects } from "../../lib/cache";
import {
	checkProjectModificationPermission,
	getProjectIdByName,
} from "../../lib/projects";
import type { UserSettings } from "../../types/api";
import type { CommandParams } from "../../types/plugin";
import { buildRequestHeaders, isRetriableError } from "../../utils/api";
import { getErrorMessage } from "../../utils/error";
import type { ResultAsync } from "../../utils/result";
import { commandGetProjectTasks } from "../tasks/getProjectTasks";

/**
 * Delete a project in TickTick.
 */
export async function commandDeleteProject(
	params: CommandParams<"delete_project">,
	userSettings: UserSettings,
): ResultAsync<string> {
	let projectId = params.projectId;

	if (!projectId && params.projectName) {
		const projectIdResponse = await getProjectIdByName(
			params.projectName,
			userSettings,
		);
		if (!projectIdResponse.success) {
			return projectIdResponse;
		}
		projectId = projectIdResponse.data;
	}

	if (!projectId) {
		return {
			success: false,
			error: "projectId or projectName is required",
			canTryAnotherApproach: true,
		};
	}

	const permissionCheck = await checkProjectModificationPermission(
		userSettings,
		"deletion",
		projectId,
	);
	if (!permissionCheck.success) {
		return permissionCheck;
	}

	try {
		// Check if project has any tasks
		const projectTasks = await commandGetProjectTasks(
			{ command: "get_project_tasks", projectId: projectId },
			userSettings,
		);

		if (!projectTasks.success) {
			return projectTasks;
		}

		if (projectTasks.data.tasks && projectTasks.data.tasks.length > 0) {
			return {
				success: false,
				error: `Cannot delete project that has ${projectTasks.data.tasks.length} tasks. Remove all tasks from the project first.`,
				canTryAnotherApproach: false,
			};
		}

		const response = await fetch(`${baseUrl}/project/${projectId}`, {
			method: "DELETE",
			headers: buildRequestHeaders(userSettings),
			signal: AbortSignal.timeout(API_TIMEOUT),
		});

		if (!response.ok) {
			return {
				success: false,
				error: `HTTP error! status: ${response.status}`,
				canTryAnotherApproach: isRetriableError(response.status),
			};
		}

		// Clear projects cache
		setCachedProjects(null);
		return { success: true, data: `Project ${projectId} deleted` };
	} catch (error) {
		return {
			success: false,
			error: `Failed to delete project: ${getErrorMessage(error)}`,
			canTryAnotherApproach: true,
		};
	}
}
