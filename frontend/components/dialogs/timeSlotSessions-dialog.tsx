"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon, Time02Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Session } from "@/types/schedule"
import {
  SESSION_THEMES,
  STROKE_WIDTH,
} from "@/components/schedule/constants/schedule.constants"
import { formatTimeLabel } from "@/components/schedule/utils/schedule.utils"

interface TimeSlotSessionsDialogProps {
  sessions: Session[]
  onOpenChange: (open: boolean) => void
  onSelectSession: (session: Session) => void
}

export function TimeSlotSessionsDialog({
  sessions,
  onOpenChange,
  onSelectSession,
}: TimeSlotSessionsDialogProps) {
  const firstSession = sessions[0]

  return (
    <Dialog open={sessions.length > 0} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sessions at this time</DialogTitle>
          <DialogDescription>
            {firstSession && (
              <>
                {formatTimeLabel(firstSession.startHour)} -{" "}
                {formatTimeLabel(firstSession.endHour)} · {sessions.length}{" "}
                sessions
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] grid-cols-2 gap-4 overflow-y-auto px-1 py-4">
          {sessions.map((session) => {
            const theme = SESSION_THEMES[session.theme]
            return (
              <Field key={session.id} className="h-full min-w-0">
                <button
                  type="button"
                  className={cn(
                    "h-full w-full rounded-md border border-l-[3px] p-3 text-left ring-offset-background transition-all hover:ring-2 hover:ring-offset-1",
                    theme.bg,
                    theme.border,
                    theme.hoverRing
                  )}
                  onClick={() => onSelectSession(session)}
                >
                  <div className={cn("font-semibold", theme.text)}>
                    {session.courseName}
                  </div>
                  <div
                    className={cn(
                      "mt-2 flex items-center gap-2 text-sm",
                      theme.subtext
                    )}
                  >
                    <HugeiconsIcon
                      icon={Calendar01Icon}
                      strokeWidth={STROKE_WIDTH}
                      className="size-4 shrink-0"
                    />
                    <span>
                      {session.group} • {session.name}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-2 text-xs",
                      theme.subtext
                    )}
                  >
                    <HugeiconsIcon
                      icon={Time02Icon}
                      strokeWidth={STROKE_WIDTH}
                      className="size-4 shrink-0"
                    />
                    <span>
                      {formatTimeLabel(session.startHour)} -{" "}
                      {formatTimeLabel(session.endHour)}
                    </span>
                  </div>
                </button>
              </Field>
            )
          })}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
