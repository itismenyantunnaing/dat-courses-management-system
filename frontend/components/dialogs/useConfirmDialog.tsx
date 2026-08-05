"use client"

import { useCallback } from "react"
import { useAlertDialog } from "./useAlertDialog"

export const useConfirmDialog = () => {
  const { showAlert, AlertDialogComponent } = useAlertDialog()

  const confirm = useCallback(
    async (description: string, title: string = "Confirm"): Promise<boolean> => {
      return await showAlert({
        title,
        description,
        confirmLabel: "Confirm",
        cancelLabel: "Cancel",
        variant: "default",
      })
    },
    [showAlert]
  )

  const confirmDestructive = useCallback(
    async (description: string, title: string = "⚠️ Warning"): Promise<boolean> => {
      return await showAlert({
        title,
        description,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        variant: "destructive",
      })
    },
    [showAlert]
  )

  const alert = useCallback(
    async (description: string, title: string = "Info"): Promise<void> => {
      await showAlert({
        title,
        description,
        confirmLabel: "OK",
        cancelLabel: undefined,
        variant: "default",
      })
    },
    [showAlert]
  )

  return {
    confirm,
    confirmDestructive,
    alert,
    AlertDialogComponent,
  }
}