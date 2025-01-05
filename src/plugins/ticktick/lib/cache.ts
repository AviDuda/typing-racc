import type { Project } from "../types/api";

/**
 * Cache for projects data
 */
let projectsCache: { data: Project[]; timestamp: number } | null = null;

/**
 * Get the projects cache if available
 */
export function getCachedProjects() {
	if (!projectsCache) {
		return null;
	}
	const isValid =
		projectsCache && Date.now() - projectsCache.timestamp < CACHE_PROJECTS_TTL;
	return isValid ? projectsCache.data : null;
}

/**
 * Set the projects cache
 */
export function setCachedProjects(data: Project[] | null) {
	if (!data) {
		projectsCache = null;
		return;
	}
	projectsCache = {
		data,
		timestamp: Date.now(),
	};
}

/**
 * Time-to-live for the projects cache
 */
export const CACHE_PROJECTS_TTL = 60 * 1000; // 1 minute cache
