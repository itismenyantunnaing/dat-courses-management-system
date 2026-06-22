"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TargetDates } from "@/types/current_target"
import { mainStore } from "@/store/mainStore"

interface EditTargetDatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetDates: TargetDates | null
}

export function EditTargetDatesDialog({
  open,
  onOpenChange,
  targetDates,
}: EditTargetDatesDialogProps) {
  const { update_TargetDates } = mainStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    target1Date: "",
    target2Date: "",
    examDate: "",
  })

  useEffect(() => {
    if (targetDates) {
      setFormData({
        target1Date: formatDateForInput(targetDates.target1Date),
        target2Date: formatDateForInput(targetDates.target2Date),
        examDate: formatDateForInput(targetDates.examDate || ""),
      })
    }
  }, [targetDates])

  const formatDateForInput = (date: Date | string) => {
    if (!date) return ""
    const d = new Date(date)
    return d.toISOString().split("T")[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetDates?.id) return

    setIsLoading(true)
    try {
      await update_TargetDates(targetDates.id, {
        target1Date: formData.target1Date,
        target2Date: formData.target2Date,
        examDate: formData.examDate,
      })
      alert("✅ Target dates updated successfully!")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update target dates:", error)
      alert("Failed to update target dates. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Target Dates</DialogTitle>
          <DialogDescription>
            Update the target and exam dates for all Japanese profiles.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="target1Date">Target 1 Date</Label>
            <Input
              id="target1Date"
              type="date"
              value={formData.target1Date}
              onChange={(e) =>
                setFormData({ ...formData, target1Date: e.target.value })
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="target2Date">Target 2 Date</Label>
            <Input
              id="target2Date"
              type="date"
              value={formData.target2Date}
              onChange={(e) =>
                setFormData({ ...formData, target2Date: e.target.value })
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="examDate">Exam Date</Label>
            <Input
              id="examDate"
              type="date"
              value={formData.examDate}
              onChange={(e) =>
                setFormData({ ...formData, examDate: e.target.value })
              }
            />
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
