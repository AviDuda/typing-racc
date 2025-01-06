import { getErrorMessage } from "../../../../utils/error";
import type { ResultAsync } from "../../../../utils/result";
import { API_TIMEOUT, baseUrl } from "../../constants";
import { setCachedProjects } from "../../lib/cache";
import {
	checkProjectModificationPermission,
	getProjectIdByName,
} from "../../lib/projects";
import type { Project } from "../../types/api";
import type { TickTickUserSettings } from "../../types/plugin";
import type { TickTickCommandParams } from "../../types/plugin";
import { buildRequestHeaders, isRetriableError } from "../../utils/api";

/**
 * Update a project in TickTick.
 */
export async function commandUpdateProject(
	params: TickTickCommandParams<"update_project">,
	userSettings: TickTickUserSettings,
): ResultAsync<Project> {
	if (!params.projectData) {
		return {
			success: false,
			error: "projectData is required",
			canTryAnotherApproach: true,
		};
	}

	// Copy projectId from root if provided
	if (params.projectId && !params.projectData.id) {
		params.projectData.id = params.projectId;
	}

	// Find project by name if no ID available
	if (!params.projectData.id && params.projectName) {
		const projectIdResponse = await getProjectIdByName(
			params.projectName,
			userSettings,
		);
		if (!projectIdResponse.success) {
			return projectIdResponse;
		}
		params.projectData.id = projectIdResponse.data;
	}

	if (!params.projectData.id) {
		return {
			success: false,
			error: "Project ID is required (either in projectData.id, params.projectId, or via params.projectName)",
			canTryAnotherApproach: true,
		};
	}

	const permissionCheck = await checkProjectModificationPermission(
		userSettings,
		"modification",
		params.projectData.id,
	);
	if (!permissionCheck.success) {
		return permissionCheck;
	}

	try {
		const response = await fetch(
			`${baseUrl}/project/${params.projectData.id}`,
			{
				method: "POST",
				headers: buildRequestHeaders(userSettings),
				body: JSON.stringify(params.projectData),
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

		const data = await response.json();
		// Clear projects cache
		setCachedProjects(null);
		return { success: true, data };
	} catch (error) {
		return {
			success: false,
			error: `Failed to update project: ${getErrorMessage(error)}`,
			canTryAnotherApproach: true,
		};
	}
}
