import type { OpenAiFunctionSpec } from "../../types/openai-function-spec";
import type { TypingMindGetPlugin } from "../../types/typingmind-plugin";
import type { TypingMindUserSettings } from "../../types/typingmind-user-settings";

const openaiSpec: OpenAiFunctionSpec = {
	name: "ticktick_plugin",
	description: "TickTick plugin for TypingMind",
	parallel_tool_calls: false,
	parameters: {
		type: "object",
		required: ["command"],
		properties: {
			command: {
				description: "The command to execute",
				type: "string",
				enum: [
					"get_projects",
					"get_project_by_id",
					"get_project_tasks",
					"update_task",
					"create_task",
					"complete_task",
					"delete_task",
					"create_project",
					"update_project",
					"delete_project",
				],
			},
			projectId: {
				description: "TickTick project ID",
				type: "string",
			},
			projectName: {
				description: "Alternative to projectId - can specify project by name",
				type: "string",
			},
			taskId: {
				description: "TickTick task ID",
				type: "string",
			},
			taskData: {
				description: "Task data for creating or updating tasks",
				type: "object",
				properties: {
					id: {
						type: "string",
						description:
							"Task ID (required for updates, not allowed for creation)",
					},
					projectId: {
						type: "string",
						description:
							"Project ID (required for new tasks, cannot be changed in updates)",
					},
					title: {
						type: "string",
						description: "Task title",
					},
					content: {
						type: "string",
						description: "Task content (mutually exclusive with items)",
					},
					desc: {
						type: "string",
						description: "Task description",
					},
					startDate: {
						type: "string",
						description: "Start date in yyyy-MM-dd'T'HH:mm:ssZ format",
					},
					dueDate: {
						type: "string",
						description: "Due date in yyyy-MM-dd'T'HH:mm:ssZ format",
					},
					timeZone: {
						type: "string",
						description: "Timezone (e.g. America/Los_Angeles)",
					},
					isAllDay: {
						type: "boolean",
						description: "All day flag",
					},
					priority: {
						type: "number",
						description: "Priority (0: None, 1: Low, 3: Medium, 5: High)",
						enum: [0, 1, 3, 5],
					},
					status: {
						type: "number",
						description: "Completion status (0: Normal, 2: Completed)",
					},
					items: {
						type: "array",
						description: "List of subtasks (mutually exclusive with content)",
						items: {
							type: "object",
							properties: {
								title: {
									type: "string",
									description: "Subtask title",
								},
								startDate: {
									type: "string",
									description: "Start date in yyyy-MM-dd'T'HH:mm:ssZ format",
								},
								isAllDay: {
									type: "boolean",
									description: "All day flag",
								},
								sortOrder: {
									type: "number",
									description: "Order of subtask",
								},
								timeZone: {
									type: "string",
									description: "Timezone",
								},
								status: {
									type: "number",
									description: "Completion status (0: Normal, 2: Completed)",
								},
								completedTime: {
									type: "string",
									description:
										"Completion time in yyyy-MM-dd'T'HH:mm:ssZ format. Can appear even if status is not completed.",
								},
							},
						},
					},
					sortOrder: {
						type: "number",
						description: "The order of task",
					},
					reminders: {
						type: "array",
						description: "Lists of reminders specific to the task",
						items: {
							type: "string",
						},
					},
					repeatFlag: {
						type: "string",
						description:
							"Recurring rules of task. Example: RRULE:FREQ=DAILY;INTERVAL=1",
					},
				},
			},
			projectData: {
				description: "Project data for creating or updating projects",
				type: "object",
				properties: {
					id: {
						type: "string",
						description:
							"Project ID (required for updates, not allowed for creation)",
					},
					name: {
						type: "string",
						description: "Project name",
					},
					color: {
						type: "string",
						description: "Project color",
					},
					sortOrder: {
						type: "number",
						description: "Sort order value",
					},
					viewMode: {
						type: "string",
						description: "View mode (list, kanban, timeline)",
						enum: ["list", "kanban", "timeline"],
					},
					kind: {
						type: "string",
						description: "Project kind (TASK, NOTE)",
						enum: ["TASK", "NOTE"],
					},
				},
			},
		},
	},
};

const userSettings: TypingMindUserSettings = [
	{
		name: "accessKey",
		label: "TickTick API access key",
		description:
			"See the plugin documentation for instructions on how to obtain this key",
		type: "password",
		required: true,
	},
	{
		name: "allowProjectModification",
		label: "Allow project modification",
		description:
			"Allow creating, updating, and deleting projects? Projects not included in the Allowed projects list won't be affected. Default is no.",
		type: "enum",
		values: ["yes", "no"],
	},
	{
		name: "allowedProjects",
		label: "Allowed projects",
		description:
			"Restrict all read/write operations to only these projects (comma-separated list of project IDs or names). Leave empty to allow all projects.",
		type: "text",
		required: false,
	},
];

const getPluginConfig: TypingMindGetPlugin = (
	overviewMarkdown: string,
	code: string,
) => ({
	uuid: "05c27777-9d67-4035-9538-0648de9ce6a5",
	version: 1,
	title: "TickTick",
	emoji: "📝",
	iconURL:
		"https://d107mjio2rjf74.cloudfront.net/web/static/img/apple-touch-icon-152x152.png",
	overviewMarkdown,
	implementationType: "javascript",
	outputType: "respond_to_ai",
	openaiSpec,
	userSettings,
	code,
});

export default getPluginConfig;
