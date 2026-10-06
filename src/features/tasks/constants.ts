export const TASK_CATEGORIES = ["work", "personal", "health", "finance", "learning", "other"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const TASK_STATUSES = ["todo", "in_progress", "completed", "cancelled"] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  work: "Work",
  personal: "Personal",
  health: "Health",
  finance: "Finance",
  learning: "Learning",
  other: "Other",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Higher number = more important. Used for sorting and scheduling order. */
export const PRIORITY_RANK: Record<TaskPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  urgent: 3,
};

export const TASK_TITLE_MAX_LENGTH = 200;
export const TASK_DESCRIPTION_MAX_LENGTH = 5000;
export const TASK_MAX_TAGS = 10;
export const TASK_MIN_MINUTES = 5;
export const TASK_MAX_MINUTES = 12 * 60;

/** Duration presets offered when editing a task, in minutes. */
export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240];
