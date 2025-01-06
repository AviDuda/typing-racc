/**
 * Checklist item (subtask) structure
 */
export type ChecklistItem = {
	/* Subtask identifier */
	id: string;
	/* Subtask title */
	title: string;
	/* Completion status (0: Normal, 1: Completed) */
	status: number;
	/* Completion time in yyyy-MM-dd'T'HH:mm:ssZ */
	completedTime: string;
	/* All day flag */
	isAllDay: boolean;
	/* Subtask sort order */
	sortOrder: number;
	/* Start date in yyyy-MM-dd'T'HH:mm:ssZ */
	startDate: string;
	/* Timezone (e.g. "America/Los_Angeles") */
	timeZone: string;
};

/**
 * Task structure
 */
export type Task = {
	id: string; // Task identifier
	projectId: string; // Task project id
	title: string; // Task title
	content?: string; // Task content
	desc?: string; // Task description of checklist
	startDate?: string; // Start date in yyyy-MM-dd'T'HH:mm:ssZ
	dueDate?: string; // Due date in yyyy-MM-dd'T'HH:mm:ssZ
	completedTime?: string; // Completion time in yyyy-MM-dd'T'HH:mm:ssZ
	timeZone: string; // Timezone (e.g. "America/Los_Angeles")
	isAllDay: boolean; // All day flag
	priority: number; // Priority (0: None, 1: Low, 3: Medium, 5: High)
	reminders?: string[]; // List of reminder triggers
	repeatFlag?: string; // Recurring rules (e.g. "RRULE:FREQ=DAILY;INTERVAL=1")
	status: number; // Completion status (0: Normal, 2: Completed)
	columnId: string; // Column identifier
	items?: ChecklistItem[]; // Subtasks of Task
	sortOrder: number; // Task sort order
};

/**
 * Project structure
 */
export type Project = {
	id: string; // Project identifier
	name: string; // Project name
	color?: string; // Project color
	sortOrder: number; // Order value
	closed?: boolean; // Project closed status
	groupId?: string; // Project group identifier
	viewMode: "list" | "kanban" | "timeline"; // View mode
	permission?: "read" | "write" | "comment"; // Access permission
	kind?: "TASK" | "NOTE"; // Project kind
};

/**
 * Column structure
 */
export type Column = {
	id: string; // Column identifier
	projectId: string; // Project identifier
	name: string; // Column name
	sortOrder: number; // Order value
};

/**
 * Project data structure
 */
export type ProjectData = {
	project: Project; // Project info
	tasks: Task[]; // Undone tasks under project
	columns: Column[]; // Columns under project
};
