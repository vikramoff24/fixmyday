import type { TaskCategory, TaskPriority } from "@/features/tasks/constants";
import { addDays, dayOfWeek, formatMinutes, type DateKey } from "@/lib/utils/zoned-time";
import type { TimeOfDay, UnderstoodTask } from "../types";

/**
 * A small rule-based interpreter used when no AI provider is configured
 * (local development, demos, tests). It handles the common shapes of
 * "brain dump" input well enough to exercise the full planning flow; the
 * AI provider does the real language understanding in production.
 */

export type UnderstandingContext = {
  todayKey: DateKey;
  nowMinutes: number;
  /** End of the user's planning day, in minutes after midnight. */
  dayEndMinute: number;
};

export type Understanding = {
  summary: string;
  tasks: UnderstoodTask[];
  assumptions: string[];
};

type CategoryRule = {
  category: TaskCategory;
  pattern: RegExp;
  priority: TaskPriority;
  timeOfDay: TimeOfDay;
  minutes: number;
};

// Order matters: the first matching rule wins.
const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "work",
    pattern: /\b(meeting|standup|stand-up|sync|1:1|interview)\b/,
    priority: "high",
    timeOfDay: "morning",
    minutes: 60,
  },
  {
    category: "health",
    pattern:
      /\b(gym|workout|work out|run|running|jog|yoga|swim|walk|exercise|doctor|dentist|meditat\w*|stretch\w*)\b/,
    priority: "medium",
    timeOfDay: "evening",
    minutes: 60,
  },
  {
    category: "work",
    pattern:
      /\b(pr|pull request|code|deploy|review|report|email|emails|slides|deck|presentation|project|client|work|ticket|bug|draft|proposal)\b/,
    priority: "high",
    timeOfDay: "morning",
    minutes: 90,
  },
  {
    category: "finance",
    pattern: /\b(pay|bill|bills|rent|tax|taxes|budget|invoice|bank|insurance|expenses?)\b/,
    priority: "medium",
    timeOfDay: "afternoon",
    minutes: 30,
  },
  {
    category: "learning",
    pattern: /\b(learn\w*|study|studying|course|read|reading|book|practice|tutorial|lesson|ai)\b/,
    priority: "low",
    timeOfDay: "evening",
    minutes: 60,
  },
  {
    category: "personal",
    pattern:
      /\b(call|text|mom|dad|mum|family|friend|friends|groceries|grocery|shop|shopping|buy|clean|laundry|cook|dinner|lunch|errand\w*|pick up|haircut|birthday)\b/,
    priority: "medium",
    timeOfDay: "evening",
    minutes: 45,
  },
];

const SHORT_TASK_PATTERN = /\b(call|text|email|pay|book|order|reply)\b/;

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  half: 0.5,
};

// Phrases removed from the start of a clause before it becomes a title.
const LEADING_FILLER =
  /^(?:(?:and|also|then|plus|after that|afterwards|oh and|oh|ok|okay|so|but)\s+)*(?:i\s+)?(?:really\s+)?(?:need to|needs to|have to|has to|got to|gotta|should|must|want to|wanna|would like to|'d like to|will|'ll|am going to|'m going to|plan to|remember to|don't forget to|dont forget to|please|try to)?\s*/;

export type Clause = { text: string; followsPrevious: boolean };

// The capture group keeps separators in the split result (at odd indexes),
// so we can tell when a clause was introduced with "then".
const CLAUSE_SEPARATOR = /(\n|;|\.(?=\s|$)|,|\band then\b|\bthen\b|\band\b|\balso\b|\bplus\b|&)/i;

/** Splits a brain dump into one clause per intended task. */
export function splitIntoClauses(text: string): Clause[] {
  const parts = text.split(CLAUSE_SEPARATOR);
  const clauses: Clause[] = [];
  let afterThen = false;

  parts.forEach((part, index) => {
    const isSeparator = index % 2 === 1;
    if (isSeparator) {
      if (/then/i.test(part)) afterThen = true;
      return;
    }

    const clause = part.trim();
    if (!/[a-z]/i.test(clause)) return;
    clauses.push({ text: clause, followsPrevious: afterThen || /^(after that|afterwards)\b/i.test(clause) });
    afterThen = false;
  });

  return clauses;
}

function parseNumberWord(word: string): number | null {
  if (word in NUMBER_WORDS) return NUMBER_WORDS[word];
  const value = Number(word);
  return Number.isFinite(value) ? value : null;
}

function extractDuration(clause: string): { minutes: number | null; rest: string } {
  if (/\bhalf an hour\b/.test(clause)) {
    return { minutes: 30, rest: clause.replace(/\b(for\s+)?half an hour\b/, " ") };
  }
  const match =
    /\b(?:for\s+)?(an?|one|two|three|four|five|six|\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)\b/.exec(
      clause,
    );
  if (!match) return { minutes: null, rest: clause };

  const amount = parseNumberWord(match[1]);
  if (amount === null) return { minutes: null, rest: clause };
  const isHours = match[2].startsWith("h");
  const minutes = Math.round(isHours ? amount * 60 : amount);
  return { minutes, rest: clause.replace(match[0], " ") };
}

type TimeExtraction = { minutes: number | null; assumedPm: boolean; rest: string };

function extractExplicitTime(clause: string): TimeExtraction {
  const patterns = [
    /\b(?:at|@|by|around)?\s*(\d{1,2}):(\d{2})\s*(am|pm)?\b/,
    /\b(?:at|@|by|around)?\s*(\d{1,2})\s*(am|pm)\b/,
    /\b(?:at|@|around)\s+(\d{1,2})\b(?!\s*(?:hours?|hrs?|h|minutes?|mins?|m)\b)/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(clause);
    if (!match) continue;

    let hour = Number(match[1]);
    const minute = pattern === patterns[0] ? Number(match[2]) : 0;
    const meridiem = pattern === patterns[0] ? match[3] : pattern === patterns[1] ? match[2] : undefined;
    if (hour > 23 || minute > 59) continue;

    let assumedPm = false;
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    // "at 3" almost always means the afternoon.
    if (!meridiem && hour >= 1 && hour <= 7) {
      hour += 12;
      assumedPm = true;
    }
    return { minutes: hour * 60 + minute, assumedPm, rest: clause.replace(match[0], " ") };
  }
  return { minutes: null, assumedPm: false, rest: clause };
}

type DateExtraction = { date: DateKey | null; timeOfDay: TimeOfDay | null; rest: string };

function extractDate(clause: string, todayKey: DateKey): DateExtraction {
  let rest = clause;
  let date: DateKey | null = null;
  let timeOfDay: TimeOfDay | null = null;

  if (/\btomorrow\b/.test(rest)) {
    date = addDays(todayKey, 1);
    rest = rest.replace(/\btomorrow\b/, " ");
  } else if (/\btonight\b/.test(rest)) {
    date = todayKey;
    timeOfDay = "evening";
    rest = rest.replace(/\btonight\b/, " ");
  } else if (/\btoday\b/.test(rest)) {
    date = todayKey;
    rest = rest.replace(/\btoday\b/, " ");
  } else {
    const weekdayMatch = new RegExp(`\\b(?:on\\s+|this\\s+|next\\s+)?(${WEEKDAYS.join("|")})\\b`).exec(rest);
    if (weekdayMatch) {
      const target = WEEKDAYS.indexOf(weekdayMatch[1]);
      const daysAhead = (target - dayOfWeek(todayKey) + 7) % 7 || 7;
      date = addDays(todayKey, daysAhead);
      rest = rest.replace(weekdayMatch[0], " ");
    }
  }

  return { date, timeOfDay, rest };
}

function extractTimeOfDay(clause: string): { timeOfDay: TimeOfDay | null; rest: string } {
  const rules: [RegExp, TimeOfDay][] = [
    [/\b(?:in the |this |tomorrow )?morning\b/, "morning"],
    [/\b(?:in the |this )?afternoon\b|\b(?:at |after |before )?lunch\b/, "afternoon"],
    [/\b(?:in the |this )?evening\b|\bafter work\b|\b(?:at |in the )?night\b/, "evening"],
  ];
  for (const [pattern, timeOfDay] of rules) {
    if (pattern.test(clause)) return { timeOfDay, rest: clause.replace(pattern, " ") };
  }
  return { timeOfDay: null, rest: clause };
}

function extractPriority(clause: string): { priority: TaskPriority | null; rest: string } {
  if (/\b(urgent|urgently|asap|immediately|critical)\b/.test(clause)) {
    return {
      priority: "urgent",
      rest: clause.replace(/\b(urgent|urgently|asap|immediately|critical)\b/g, " "),
    };
  }
  if (/\b(important|deadline|must)\b/.test(clause)) {
    return { priority: "high", rest: clause.replace(/\bimportant\b/g, " ") };
  }
  return { priority: null, rest: clause };
}

/** Turns what's left of a clause into a short, readable title. */
export function toTitle(fragment: string): string {
  let title = fragment
    .replace(/\s+/g, " ")
    .replace(/^[\s:;,.!?\-–—]+/, "")
    .trim()
    .replace(LEADING_FILLER, "")
    .replace(/\b(my|some)\s+/g, "")
    .replace(/^spend (?:time |some time )?(?:on )?/, "")
    .replace(/^(?:do|doing)\s+(?=\w)/, "")
    .replace(/[\s,.!?-]+$/, "")
    .trim();

  title = title
    .replace(/^go(?:ing)? to the gym$|^hit the gym$|^gym session$/, "gym")
    .replace(/^learning\b/, "learn")
    .replace(/^studying\b/, "study")
    .replace(/\bpr\b/g, "PR")
    .replace(/\bai\b/g, "AI")
    .replace(/\bmom\b/, "Mom")
    .replace(/\bdad\b/, "Dad");

  return title.charAt(0).toUpperCase() + title.slice(1);
}

function classify(clause: string): Omit<CategoryRule, "pattern"> {
  const rule = CATEGORY_RULES.find((candidate) => candidate.pattern.test(clause));
  const fallback = {
    category: "other" as const,
    priority: "medium" as const,
    timeOfDay: "anytime" as const,
    minutes: 30,
  };
  if (!rule) return fallback;

  const minutes = SHORT_TASK_PATTERN.test(clause) && rule.category !== "work" ? 20 : rule.minutes;
  return { category: rule.category, priority: rule.priority, timeOfDay: rule.timeOfDay, minutes };
}

export function understandOffline(input: string, context: UnderstandingContext): Understanding {
  const text = input.toLowerCase().replace(/[’`]/g, "'");
  const assumptions: string[] = [];

  // A date mentioned anywhere ("Tomorrow I need to…") applies to every task
  // that doesn't name its own.
  const sentenceDate = extractDate(text, context.todayKey).date;
  const isLate = context.nowMinutes > context.dayEndMinute - 60;
  const defaultDate = sentenceDate ?? (isLate ? addDays(context.todayKey, 1) : context.todayKey);
  if (!sentenceDate && isLate) assumptions.push("It's late, so I planned these for tomorrow.");

  let estimatedAny = false;
  const tasks: UnderstoodTask[] = [];
  splitIntoClauses(text).forEach(({ text: rawClause, followsPrevious }, index) => {
    const dateResult = extractDate(rawClause, context.todayKey);
    const durationResult = extractDuration(dateResult.rest);
    const timeResult = extractExplicitTime(durationResult.rest);
    const timeOfDayResult = extractTimeOfDay(timeResult.rest);
    const priorityResult = extractPriority(timeOfDayResult.rest);

    const title = toTitle(priorityResult.rest);
    if (title.length < 2) return;

    const rule = classify(priorityResult.rest);
    if (durationResult.minutes === null) estimatedAny = true;
    if (timeResult.assumedPm && timeResult.minutes !== null) {
      assumptions.push(`Read “${title}” as ${formatMinutes(timeResult.minutes)} (afternoon).`);
    }

    const previous = tasks.at(-1);
    tasks.push({
      key: `t${index + 1}`,
      title,
      category: rule.category,
      priority: priorityResult.priority ?? rule.priority,
      estimatedMinutes: durationResult.minutes ?? rule.minutes,
      date: dateResult.date ?? defaultDate,
      fixedStartMinutes: timeResult.minutes,
      timeOfDay: dateResult.timeOfDay ?? timeOfDayResult.timeOfDay ?? rule.timeOfDay,
      dependsOn: followsPrevious && previous ? [previous.key] : [],
      notes: null,
    });
  });

  if (estimatedAny && tasks.length > 0)
    assumptions.push("Estimated how long things take where you didn't say.");
  if (!sentenceDate && !isLate && tasks.some((task) => task.date === context.todayKey)) {
    assumptions.push("No day mentioned, so I planned for today.");
  }

  const count = tasks.length;
  const summary =
    count === 0
      ? "I couldn't find anything to plan in that."
      : `I've organized ${count} ${count === 1 ? "thing" : "things"} for you.`;

  return { summary, tasks, assumptions };
}
