/**
 * Normalize string for comparison by removing emojis, diacritics, and converting to lowercase
 */
export function normalizeString(str: string): string {
	return str
		.normalize("NFKD") // Normalize unicode characters
		.replace(/\p{Diacritic}/gu, "") // Remove diacritics
		.replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // Remove emojis
		.replace(/[\u{1F600}-\u{1F64F}]/gu, "") // Remove emoticons
		.replace(/[\u{2700}-\u{27BF}]/gu, "") // Remove dingbats
		.toLowerCase() // Convert to lowercase
		.trim(); // Remove leading/trailing whitespace
}

const whitespaceRegex = /\s+/;

/**
 * Calculate similarity score between two strings.
 * Higher score means better match (max 1.0)
 */
export function calculateSimilarity(str1: string, str2: string): number {
	const norm1 = normalizeString(str1);
	const norm2 = normalizeString(str2);

	if (norm1 === norm2) {
		// Exact match after normalization
		return 1.0;
	}

	// Calculate various match factors
	const containsScore =
		norm1.includes(norm2) || norm2.includes(norm1) ? 0.8 : 0;

	// Word match score (e.g. "my tasks" matches "tasks" but not as well as "my tasks 2")
	const words1 = new Set(norm1.split(whitespaceRegex));
	const words2 = new Set(norm2.split(whitespaceRegex));
	const commonWords = [...words1].filter((word) => words2.has(word));
	const wordScore = commonWords.length / Math.max(words1.size, words2.size);

	// Length difference penalty
	const lengthDiff = Math.abs(norm1.length - norm2.length);
	const lengthPenalty = 1 - lengthDiff / Math.max(norm1.length, norm2.length);

	// Combine scores with weights
	const score = Math.max(
		containsScore * 0.6 + lengthPenalty * 0.4,
		wordScore * 0.7 + lengthPenalty * 0.3,
	);

	return score;
}
