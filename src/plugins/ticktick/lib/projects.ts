import { commandGetProjects } from "../commands/projects/getProjects";
import { commandGetProjectTasks } from "../commands/tasks/getProjectTasks";
import type { UserSettings } from "../types/api";
import { getErrorMessage, writeAccessDeniedResponse } from "../utils/error";
import type { ResultAsync } from "../utils/result";
import { calculateSimilarity } from "../utils/string";

/**
 * Helper function to get project ID from project name
 */
export async function getProjectIdByName(
	projectName: string,
	userSettings: UserSettings,
): ResultAsync<string> {
	const projectsResponse = await commandGetProjects(userSettings);
	if (!projectsResponse.success) {
		return projectsResponse;
	}

	// Find best matching project
	let bestMatch: { id: string; name: string } | null = null;
	let bestScore = 0;
	const MINIMUM_SCORE = 0.5; // Threshold for accepting a match

	for (const project of projectsResponse.data) {
		const score = calculateSimilarity(project.name, projectName);
		if (score > bestScore) {
			bestScore = score;
			bestMatch = project;
		}
		if (score === 1.0) {
			// Exact match found, no need to search further
			break;
		}
	}

	if (!bestMatch || bestScore < MINIMUM_SCORE) {
		return {
			success: false,
			error: `Project not found: ${projectName}`,
			canTryAnotherApproach: true,
		};
	}

	return { success: true, data: bestMatch.id };
}

/**
 * Helper function to get project ID from task ID or name by searching through all projects
 * First tries to match by exact task ID, then falls back to finding by task name similarity
 */
export async function findProjectIdFromTaskReference(
	taskIdOrName: string,
	userSettings: UserSettings,
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

			if (tasksResponse.data.tasks.some((task) => task.id === taskIdOrName)) {
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

/**
 * Check if writing to a project is allowed based on user settings
 */
export async function checkWritePermission(
	projectId: string,
	userSettings: UserSettings,
): ResultAsync<boolean> {
	if (!userSettings.allowedProjects) {
		return { success: true, data: true }; // No restrictions
	}

	const allowedProjects = userSettings.allowedProjects
		.split(",")
		.map((p) => p.trim());
	if (allowedProjects.length === 0) {
		// Empty restriction = allow all
		return { success: true, data: true };
	}

	// Check if project ID is directly allowed
	if (allowedProjects.includes(projectId)) {
		return { success: true, data: true };
	}

	// Get project details to match by name
	const projectsResponse = await commandGetProjects(userSettings);
	if (!projectsResponse.success) {
		return projectsResponse;
	}

	const projects = projectsResponse.data;
	const targetProject = projects.find((p) => p.id === projectId);
	if (!targetProject) {
		return {
			success: false,
			error: "Project not found",
			canTryAnotherApproach: true,
		};
	}

	// Check if project name matches any allowed project
	for (const allowedProject of allowedProjects) {
		if (calculateSimilarity(targetProject.name, allowedProject) >= 0.8) {
			return { success: true, data: true };
		}
	}

	return {
		success: false,
		error: `Writing to project "${targetProject.name}" is not allowed. Allowed projects: ${userSettings.allowedProjects}`,
		canTryAnotherApproach: false,
	};
}

/**
 * Check if project modification (create/update/delete) is allowed
 *
 * @param projectId - Required for modification/deletion
 */
export async function checkProjectModificationPermission(
	userSettings: UserSettings,
	operation: "creation" | "modification" | "deletion",
	projectId?: string,
): ResultAsync<boolean> {
	// First check basic permission
	if (userSettings.allowProjectModification !== "yes") {
		return {
			success: false,
			error: `Project ${operation} is not allowed`,
			canTryAnotherApproach: false,
		};
	}

	// For modification/deletion, also check if we have access to the project
	if (projectId && operation !== "creation") {
		const permissionCheck = await checkWritePermission(projectId, userSettings);
		if (!permissionCheck.success) {
			return permissionCheck;
		}
		if (!permissionCheck.data) {
			return writeAccessDeniedResponse;
		}
	}

	return { success: true, data: true };
}
