import type { Project, Task } from "./api";

/**
 * Plugin parameter types mapping
 */
export type TickTickCommandType = {
	get_projects: { command: "get_projects" };
	get_project_by_id: {
		command: "get_project_by_id";
		projectId?: string;
		projectName?: string;
	};
	get_project_tasks: {
		command: "get_project_tasks";
		projectId?: string;
		projectName?: string;
	};
	update_task: {
		command: "update_task";
		taskData: Task;
		projectId?: string;
		projectName?: string;
		taskId?: string;
	};
	create_task: {
		command: "create_task";
		taskData: Omit<Task, "id">;
		projectId?: string;
		projectName?: string;
	};
	complete_task: {
		command: "complete_task";
		projectId?: string;
		projectName?: string;
		taskId: string;
	};
	delete_task: {
		command: "delete_task";
		projectId?: string;
		projectName?: string;
		taskId: string;
	};
	create_project: {
		command: "create_project";
		projectData: Omit<Project, "id">;
	};
	update_project: {
		command: "update_project";
		projectData: Partial<Project>;
		projectId?: string;
		projectName?: string;
	};
	delete_project: {
		command: "delete_project";
		projectId?: string;
		projectName?: string;
	};
};

export type TickTickCommandParams<T extends keyof TickTickCommandType> =
	TickTickCommandType[T]; /**
 * User settings configuration
 */

export type TickTickUserSettings = {
	accessKey: string;
	allowedProjects?: string;
	allowProjectModification?: "yes" | "no";
};
