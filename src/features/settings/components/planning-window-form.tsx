"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMinutes } from "@/lib/utils/zoned-time";
import { updatePlanningWindowAction } from "../actions";
import {
  planningWindowFormSchema,
  type PlanningWindow,
  type PlanningWindowForm,
} from "../schemas/settings-schemas";

export function PlanningWindowFormSection({ window }: { window: PlanningWindow }) {
  const [isSaving, startSaving] = useTransition();
  const form = useForm<PlanningWindowForm>({
    resolver: zodResolver(planningWindowFormSchema),
    defaultValues: {
      dayStart: formatMinutes(window.dayStartMinute),
      dayEnd: formatMinutes(window.dayEndMinute),
    },
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startSaving(async () => {
      const result = await updatePlanningWindowAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      form.reset(values);
      toast.success("Planning hours saved");
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="day-start">Day starts</Label>
          <Input
            id="day-start"
            type="time"
            step={900}
            aria-invalid={Boolean(errors.dayStart)}
            {...form.register("dayStart")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="day-end">Day ends</Label>
          <Input
            id="day-end"
            type="time"
            step={900}
            aria-invalid={Boolean(errors.dayEnd)}
            aria-describedby={errors.dayEnd ? "day-end-error" : undefined}
            {...form.register("dayEnd")}
          />
        </div>
      </div>
      {errors.dayEnd && (
        <p id="day-end-error" className="text-xs text-destructive">
          {errors.dayEnd.message}
        </p>
      )}
      <div>
        <Button type="submit" size="sm" disabled={!isDirty || isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
