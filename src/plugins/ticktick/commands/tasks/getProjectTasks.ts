import { API_TIMEOUT, baseUrl } from "../../constants";
import type { ProjectData, UserSettings } from "../../types/api";
import type { CommandParams } from "../../types/plugin";
import { buildRequestHeaders, isRetriableError } from "../../utils/api";
import { getErrorMessage } from "../../utils/error";
import type { ResultAsync } from "../../utils/result";
import { commandGetProjects } from "../projects/getProjects";

/**
 * Get tasks for a specific project from TickTick API.
 */
export async function commandGetProjectTasks(
	params: CommandParams<"get_project_tasks">,
	userSettings: UserSettings,
): ResultAsync<ProjectData> {
	if (!(params.projectId || params.projectName)) {
		return {
			success: false,
			error: "projectId or projectName is required",
			canTryAnotherApproach: true,
		};
	}

	try {
		// Get project ID by name
		let projectId = params.projectId;
		if (!projectId) {
			const projectsResponse = await commandGetProjects(userSettings);
			if (!projectsResponse.success) {
				return projectsResponse;
			}
			const project = projectsResponse.data.find(
				(p) => p.name === params.projectName,
			);
			if (!project) {
				return {
					success: false,
					error: `Project not found: ${params.projectName}`,
					canTryAnotherApproach: true,
				};
			}
			projectId = project.id;
		}

		const response = await fetch(`${baseUrl}/project/${projectId}/data`, {
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

		const data = (await response.json()) as ProjectData;

		// Convert `completedTime` to string (2025-12-31T23:59:59+00:00 format)
		// if it's a Unix timestamp, which seems to be the case for items
		if (data.tasks) {
			for (const task of data.tasks) {
				if (task.completedTime && Number.isInteger(task.completedTime)) {
					task.completedTime = new Date(task.completedTime).toISOString();
				}
				if (task.items) {
					for (const item of task.items) {
						if (item.completedTime && Number.isInteger(item.completedTime)) {
							item.completedTime = new Date(item.completedTime).toISOString();
						}
					}
				}
			}
		}

		return { success: true, data };
	} catch (error) {
		return {
			success: false,
			error: `Failed to fetch project tasks: ${getErrorMessage(error)}`,
			canTryAnotherApproach: true,
		};
	}
}
