import { commandCreateProject } from "./commands/projects/createProject";
import { commandDeleteProject } from "./commands/projects/deleteProject";
import { commandGetProjectById } from "./commands/projects/getProjectById";
import { commandGetProjects } from "./commands/projects/getProjects";
import { commandUpdateProject } from "./commands/projects/updateProject";
import { commandCompleteTask } from "./commands/tasks/completeTask";
import { commandCreateTask } from "./commands/tasks/createTask";
import { commandDeleteTask } from "./commands/tasks/deleteTask";
import { commandGetProjectTasks } from "./commands/tasks/getProjectTasks";
import { commandUpdateTask } from "./commands/tasks/updateTask";
import type { UserSettings } from "./types/api";
import type { CommandParams, CommandType } from "./types/plugin";

/**
 * TickTick plugin for TypingMind.
 */
export function ticktick_plugin<TCommand extends keyof CommandType>(
	params: CommandParams<TCommand>,
	userSettings: UserSettings,
) {
	switch (params.command) {
		case "get_projects": {
			return commandGetProjects(userSettings);
		}
		case "get_project_by_id": {
			return commandGetProjectById(params, userSettings);
		}
		case "get_project_tasks": {
			return commandGetProjectTasks(params, userSettings);
		}
		case "update_task": {
			return commandUpdateTask(params, userSettings);
		}
		case "create_task": {
			return commandCreateTask(params, userSettings);
		}
		case "complete_task": {
			return commandCompleteTask(params, userSettings);
		}
		case "delete_task": {
			return commandDeleteTask(params, userSettings);
		}
		case "create_project": {
			return commandCreateProject(params, userSettings);
		}
		case "update_project": {
			return commandUpdateProject(params, userSettings);
		}
		case "delete_project": {
			return commandDeleteProject(params, userSettings);
		}
		default: {
			return { success: false, error: "Unknown command" };
		}
	}
}
