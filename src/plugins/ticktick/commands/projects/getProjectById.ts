import { getErrorMessage } from "../../../../utils/error";
import type { ResultAsync } from "../../../../utils/result";
import { API_TIMEOUT, baseUrl } from "../../constants";
import { getProjectIdByName } from "../../lib/projects";
import type { Project } from "../../types/api";
import type { TickTickUserSettings } from "../../types/plugin";
import type { TickTickCommandParams } from "../../types/plugin";
import { buildRequestHeaders, isRetriableError } from "../../utils/api";

/**
 * Get a specific project by ID from TickTick API.
 */
export async function commandGetProjectById(
	params: TickTickCommandParams<"get_project_by_id">,
	userSettings: TickTickUserSettings,
): ResultAsync<Project> {
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

	try {
		const response = await fetch(`${baseUrl}/project/${projectId}`, {
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

		const data = await response.json();
		return { success: true, data };
	} catch (error) {
		return {
			success: false,
			error: `Failed to fetch project: ${getErrorMessage(error)}`,
			canTryAnotherApproach: true,
		};
	}
}
