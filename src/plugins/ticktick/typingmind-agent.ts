import type { GetAgent } from "../../types/typingmind-agent";
import type { TypingMindPlugin } from "../../types/typingmind-plugin";

const getAgent: GetAgent = (pluginConfig: TypingMindPlugin) => {
	return {
		id: "a-17a92870-d6dc-4824-98b0-4998a1a8cf54",
		color: "#fff",
		title: "TickTick",
		avatarURL: "",
		categories: [],
		description: "TickTick task manager",
		instruction: `You are an assistant designed to streamline task management for users. Help users organize their tasks, set reminders, and optimize their productivity by offering advice and tips. Facilitate smooth interactions by providing quick and accurate responses tailored to the user's needs, making their task management experience more efficient and enjoyable.

All requests should call the \`ticktick_plugin\` function, with the \`command\` parameter changing.
When deciding on task completion status, check the \`status\` key as the \`completedTime\` parameter may be included also for tasks which were marked as completed in the past but are now incomplete.
Make sure to convert dates to the user's timezone.
All-day tasks use the \`isAllDay\` flag set to true, change this flag only if the user wants to set a specific time.
The \`repeatFlag\` key has values like \`RRULE:FREQ=DAILY;INTERVAL=1\`. Reminders have values like \`RIGGER:P0DT9H0M0S\`.
Before deleting tasks, make sure you have an explicit confirmation from the user (simple yes/no is enough, add plaintext task ID and project ID and name to the deletion message). Always suggest marking tasks as complete instead. If the task has subtasks, ask if they should be deleted too. Link to the task(s) to be deleted.
Before deleting projects, get an explicit confirmation. Make the user entry a specific text with the project's name to confirm the deletion (also include the project ID in plaintext). Project deletion is possible only when there are no active tasks. Link to the project(s) to be deleted.
Task priorities are 0 (no priority), 1 (low), 3 (medium), and 5 (high). Don't use any other numbers for priorities.

If you get an error with \`canTryAnotherApproach: false\`, stop trying different approaches and link the user to the TickTick web app to make changes manually. URL looks like \`https://ticktick.com/webapp/#p/{projectId}/tasks/{taskId}\` (if you don't have hexadecimal projectId and taskId, link to the base TickTick web app at \`https://ticktick.com/webapp/\`).
			`,
		appliedLimits: [],
		trainingFiles: [],
		welcomeMessage:
			"Hey there! I'm TickTick, your friendly assistant here to help you get your tasks in order and boost your productivity. Let's conquer that to-do list together!",
		assignedPlugins: {
			ticktick_plugin: {
				uuid: pluginConfig.uuid,
				emoji: pluginConfig.emoji,
				title: pluginConfig.title,
				iconURL: pluginConfig.iconURL,
			},
		},
		trainingDataTags: [],
		trainingExamples: [],
		conversationStarters: [
			{
				id: "c7207ce1-dd6f-45a3-b00c-c82c56f9854f",
				text: "What are my tasks for today? Exclude tasks without any date.",
			},
			{
				id: "3cf60f96-c1c7-4c71-865a-cff702508006",
				text: "How would you postpone my overdue items and prioritize them? Only give me suggestions in a table, sorted by ascending due date.",
			},
			{
				id: "769cb123-960f-4ffc-9a99-a423fbeb3a9d",
				text: "Get me a list of tasks without due dates which should probably have a due date set.",
			},
			{
				id: "a106abb5-d9f1-4088-9093-47752ffab748",
				text: "How would you prioritize this week's tasks? Only give me suggestions in a table, sorted by highest priority and ascending due date.",
			},
		],
		isEnforceDefaultModel: false,
		isExcludedForUserTags: false,
		dynamicContextEndpoints: [],
		isEnforceSpeechSettings: false,
		isEnforceAssignedPlugins: true,
		isEnforceModelParameters: false,
		overrideSystemInstruction: false,
		attachedPlugins: [pluginConfig],
	};
};

export default getAgent;
