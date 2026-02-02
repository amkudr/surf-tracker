export type DifficultyLevel = 0 | 1 | 2 | 3;

export interface DifficultyOption {
  value: DifficultyLevel;
  label: string;
  description: string;
}

export const DIFFICULTY_LEVELS: DifficultyOption[] = [
  { value: 0, label: 'Beginner', description: 'Suitable for beginners' },
  { value: 1, label: 'Intermediate', description: 'Requires some experience' },
  { value: 2, label: 'Advanced', description: 'For experienced surfers' },
  { value: 3, label: 'Expert', description: 'Only for expert surfers' },
];

// Single difficulty functions
export const getDifficultyLabel = (difficulty: number): string => {
  // Ensure difficulty is within valid range, default to Beginner if out of range
  const validDifficulty = Math.max(0, Math.min(3, Math.floor(difficulty))) as DifficultyLevel;
  const level = DIFFICULTY_LEVELS.find(l => l.value === validDifficulty);
  return level?.label || 'Beginner';
};

export const getDifficultyDescription = (difficulty: number): string => {
  const validDifficulty = Math.max(0, Math.min(3, Math.floor(difficulty))) as DifficultyLevel;
  const level = DIFFICULTY_LEVELS.find(l => l.value === validDifficulty);
  return level?.description || '';
};

export const getDifficultyOption = (difficulty: number): DifficultyOption | undefined => {
  const validDifficulty = Math.max(0, Math.min(3, Math.floor(difficulty))) as DifficultyLevel;
  return DIFFICULTY_LEVELS.find(l => l.value === validDifficulty);
};

// Helper function to normalize single difficulty values
export const normalizeDifficulty = (difficulty: number | undefined): DifficultyLevel => {
  if (difficulty === undefined || difficulty === null) return 0;
  return Math.max(0, Math.min(3, Math.floor(difficulty))) as DifficultyLevel;
};

// Array difficulty functions
export const getDifficultyLabels = (difficulties: number[] | undefined): string[] => {
  if (!difficulties || difficulties.length === 0) return [];
  return difficulties.map(normalizeDifficulty).map(getDifficultyLabel);
};

export const normalizeDifficultyArray = (difficulties: number[] | undefined): DifficultyLevel[] => {
  if (!difficulties || difficulties.length === 0) return [];
  return [...new Set(difficulties.map(normalizeDifficulty))]; // Remove duplicates
};

export const formatDifficultyText = (difficulties: number[] | undefined): string => {
  const labels = getDifficultyLabels(difficulties);
  if (labels.length === 0) return 'Not specified';
  return labels.join(', ');
};