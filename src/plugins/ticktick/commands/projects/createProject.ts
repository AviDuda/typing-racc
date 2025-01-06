import { getErrorMessage } from "../../../../utils/error";
import type { ResultAsync } from "../../../../utils/result";
import { API_TIMEOUT, baseUrl } from "../../constants";
import { setCachedProjects } from "../../lib/cache";
import { checkProjectModificationPermission } from "../../lib/projects";
import type { Project } from "../../types/api";
import type { TickTickUserSettings } from "../../types/plugin";
import type { TickTickCommandParams } from "../../types/plugin";
import { buildRequestHeaders, isRetriableError } from "../../utils/api";

/**
 * Create a new project in TickTick.
 */
export async function commandCreateProject(
	params: TickTickCommandParams<"create_project">,
	userSettings: TickTickUserSettings,
): ResultAsync<Project> {
	const permissionCheck = await checkProjectModificationPermission(
		userSettings,
		"creation",
	);
	if (!permissionCheck.success) {
		return permissionCheck;
	}

	if (!params.projectData?.name) {
		return {
			success: false,
			error: "projectData with name is required",
			canTryAnotherApproach: true,
		};
	}

	try {
		const response = await fetch(`${baseUrl}/project`, {
			method: "POST",
			headers: buildRequestHeaders(userSettings),
			body: JSON.stringify(params.projectData),
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
		// Clear projects cache
		setCachedProjects(null);
		return { success: true, data };
	} catch (error) {
		return {
			success: false,
			error: `Failed to create project: ${getErrorMessage(error)}`,
			canTryAnotherApproach: true,
		};
	}
}
