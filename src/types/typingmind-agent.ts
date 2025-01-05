import type { TypingMindPlugin } from "./typingmind-plugin";

/**
 * TypingMind Agent JSON configuration generator
 */
export type GetAgent = (
	pluginConfig: TypingMindPlugin,
) => Omit<TypingMindAgentData, "createdAt">;

/**
 * TypingMind Agent JSON configuration (data object)
 */
export type TypingMindAgentData = {
	id: string;
	color: string;
	title: string;
	avatarURL: string;
	createdAt: string;
	categories: string[];
	description: string;
	instruction: string;
	appliedLimits: unknown[];
	trainingFiles: unknown[];
	welcomeMessage: string;
	assignedPlugins: Record<string, unknown>;
	trainingDataTags: unknown[];
	trainingExamples: unknown[];
	conversationStarters: { id: string; text: string }[];
	isEnforceDefaultModel: boolean;
	isExcludedForUserTags: boolean;
	dynamicContextEndpoints: unknown[];
	isEnforceSpeechSettings: boolean;
	isEnforceAssignedPlugins: boolean;
	isEnforceModelParameters: boolean;
	overrideSystemInstruction: boolean;
	attachedPlugins: TypingMindPlugin[];
};

/**
 * TypingMind Agent JSON configuration (checksum + data object)
 */
export type TypingMindAgent = {
	/** MD5 checksum of the data object */
	checksum: string;
	data: TypingMindAgentData;
};
