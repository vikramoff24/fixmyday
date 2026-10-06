"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useClock } from "@/components/providers/clock-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDuration } from "@/lib/utils/format";
import { createTaskAction } from "../actions";
import {
  DURATION_OPTIONS,
  TASK_CATEGORIES,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITIES,
} from "../constants";
import { taskTitleSchema } from "../schemas/task-schemas";
import { CategoryLabel, PriorityLabel } from "./task-meta";

const NO_DURATION = "none";

const newTaskFormSchema = z
  .object({
    title: taskTitleSchema,
    description: z.string().max(TASK_DESCRIPTION_MAX_LENGTH),
    category: z.enum(TASK_CATEGORIES),
    priority: z.enum(TASK_PRIORITIES),
    dueDate: z.string(),
    startTime: z.string(),
    estimatedMinutes: z.string(),
  })
  .refine((values) => !values.startTime || values.dueDate, {
    message: "Pick a date for the start time.",
    path: ["dueDate"],
  });

type NewTaskFormValues = z.infer<typeof newTaskFormSchema>;

type NewTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewTaskDialog({ open, onOpenChange }: NewTaskDialogProps) {
  const { todayKey } = useClock();
  const [isSaving, startSaving] = useTransition();

  const defaultValues: NewTaskFormValues = {
    title: "",
    description: "",
    category: "other",
    priority: "medium",
    dueDate: todayKey,
    startTime: "",
    estimatedMinutes: "30",
  };

  const form = useForm<NewTaskFormValues>({ resolver: zodResolver(newTaskFormSchema), defaultValues });
  const { errors } = form.formState;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) form.reset(defaultValues);
    onOpenChange(nextOpen);
  }

  const onSubmit = form.handleSubmit((values) => {
    startSaving(async () => {
      const result = await createTaskAction({
        title: values.title,
        description: values.description.trim() || null,
        category: values.category,
        priority: values.priority,
        dueDate: values.dueDate || null,
        startTime: values.startTime || null,
        estimatedMinutes: values.estimatedMinutes === NO_DURATION ? null : Number(values.estimatedMinutes),
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Task created");
      handleOpenChange(false);
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>
            Add something specific. For a whole brain dump, use the AI planner.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-task-title">Title</Label>
            <Input
              id="new-task-title"
              autoFocus
              placeholder="e.g. Finish the quarterly report"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "new-task-title-error" : undefined}
              {...form.register("title")}
            />
            {errors.title && (
              <p id="new-task-title-error" className="text-xs text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-task-date">Date</Label>
              <Input
                id="new-task-date"
                type="date"
                aria-invalid={Boolean(errors.dueDate)}
                {...form.register("dueDate")}
              />
              {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-task-time">Time</Label>
              <Input id="new-task-time" type="time" step={300} {...form.register("startTime")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label id="new-task-category-label">Category</Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-labelledby="new-task-category-label">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          <CategoryLabel category={category} className="text-sm text-foreground" />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label id="new-task-priority-label">Priority</Label>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-labelledby="new-task-priority-label">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          <PriorityLabel priority={priority} className="text-sm" />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label id="new-task-duration-label">Duration</Label>
              <Controller
                control={form.control}
                name="estimatedMinutes"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-labelledby="new-task-duration-label">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_DURATION}>Not set</SelectItem>
                      {DURATION_OPTIONS.map((minutes) => (
                        <SelectItem key={minutes} value={String(minutes)}>
                          {formatDuration(minutes)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-task-notes">Notes</Label>
            <Textarea
              id="new-task-notes"
              placeholder="Optional"
              className="min-h-16"
              {...form.register("description")}
            />
          </div>

          <DialogFooter className="mt-1 items-center">
            <span className="mr-auto hidden items-center gap-1.5 text-xs text-subtle-foreground sm:flex">
              <Kbd>Enter</Kbd> to save
            </span>
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
