import { getErrorMessage } from "../../../../utils/error";
import type { ResultAsync } from "../../../../utils/result";
import { API_TIMEOUT, baseUrl } from "../../constants";
import { getCachedProjects, setCachedProjects } from "../../lib/cache";
import type { Project } from "../../types/api";
import type { TickTickUserSettings } from "../../types/plugin";
import { buildRequestHeaders, isRetriableError } from "../../utils/api";

export async function commandGetProjects(
	userSettings: TickTickUserSettings,
): ResultAsync<Project[]> {
	// Check cache first
	const projectsCache = getCachedProjects();
	if (projectsCache) {
		return { success: true, data: projectsCache };
	}

	try {
		const response = await fetch(`${baseUrl}/project`, {
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
		// Update cache
		setCachedProjects(data);
		return { success: true, data };
	} catch (error) {
		return {
			success: false,
			error: `Failed to fetch projects: ${getErrorMessage(error)}`,
			canTryAnotherApproach: true,
		};
	}
}
