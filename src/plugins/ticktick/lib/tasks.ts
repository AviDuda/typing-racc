import { getErrorMessage } from "../../../utils/error";
import type { ResultAsync } from "../../../utils/result";
import { calculateSimilarity } from "../../../utils/string";
import { commandGetProjects } from "../commands/projects/getProjects";
import { commandGetProjectTasks } from "../commands/tasks/getProjectTasks";
import type { TickTickUserSettings } from "../types/plugin";

/**
 * Find project ID from a task ID or name reference
 */
export async function findProjectIdFromTaskReference(
	taskIdOrName: string,
	userSettings: TickTickUserSettings,
): ResultAsync<string> {
	try {
		const projectsResponse = await commandGetProjects(userSettings);
		if (!projectsResponse.success) {
			return projectsResponse;
		}

		// Sort projects by sortOrder to ensure consistent results
		const sortedProjects = [...projectsResponse.data].sort(
			(a, b) => a.sortOrder - b.sortOrder,
		);

		// First try: exact task ID match
		for (const project of sortedProjects) {
			const tasksResponse = await commandGetProjectTasks(
				{
					command: "get_project_tasks",
					projectId: project.id,
				},
				userSettings,
			);

			if (!tasksResponse.success) {
				continue;
			}

			if (
				tasksResponse.data.tasks.some(
					(task) => task.id === taskIdOrName,
				)
			) {
				return { success: true, data: project.id };
			}
		}

		// Second try: task name similarity match
		/** @type {{ projectId: string | null; score: number }} */
		let bestMatch: { projectId: string | null; score: number } = {
			projectId: null,
			score: 0,
		};
		const MINIMUM_SCORE = 0.5;

		for (const project of sortedProjects) {
			const tasksResponse = await commandGetProjectTasks(
				{
					command: "get_project_tasks",
					projectId: project.id,
				},
				userSettings,
			);

			if (!tasksResponse.success) {
				continue;
			}

			for (const task of tasksResponse.data.tasks) {
				const score = calculateSimilarity(task.title, taskIdOrName);
				if (score > bestMatch.score) {
					bestMatch = { projectId: project.id, score };
				}
				if (score === 1.0) {
					// Perfect match found
					break;
				}
			}
		}

		if (bestMatch.projectId && bestMatch.score >= MINIMUM_SCORE) {
			return { success: true, data: bestMatch.projectId };
		}

		return {
			success: false,
			error: `No task found matching ID or name: ${taskIdOrName}`,
			canTryAnotherApproach: false,
		};
	} catch (error) {
		return {
			success: false,
			error: `Failed to get project ID: ${getErrorMessage(error)}`,
			canTryAnotherApproach: true,
		};
	}
}
