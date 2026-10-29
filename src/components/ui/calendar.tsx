import type { ComponentProps } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type { DateRange } from "react-day-picker";

/** The app's calendar: Brazilian Portuguese, weeks starting on Sunday, compact type. */
export function Calendar({ className, ...props }: ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={ptBR}
      weekStartsOn={0}
      showOutsideDays
      labels={{
        labelPrevious: () => "Mês anterior",
        labelNext: () => "Próximo mês",
        labelNav: () => "Navegação do calendário",
      }}
      className={cn("rdp-compact", className)}
      {...props}
    />
  );
}
