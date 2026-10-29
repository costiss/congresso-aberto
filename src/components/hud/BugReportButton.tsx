import { Bug } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { bugReportHref } from "@/lib/bugReport";
import { cn } from "@/lib/utils";

/**
 * Opens a new GitHub issue, pre-filled with the page and browser context, so
 * reporting never dead-ends in a form this app would have to own. Icon-only to
 * keep the dense HUD bar on one line; the label lives in the accessible name
 * and the tooltip.
 */
export function BugReportButton({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={bugReportHref()}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("icon-btn", className)}
          aria-label="Reportar um bug no GitHub"
        >
          <Bug className="h-4 w-4" aria-hidden="true" />
        </a>
      </TooltipTrigger>
      <TooltipContent side="bottom">Reportar um bug no GitHub</TooltipContent>
    </Tooltip>
  );
}
