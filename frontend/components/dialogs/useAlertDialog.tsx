"use client"

import { useState, useCallback, ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface AlertDialogOptions {
  title: string
  description: string | ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  onConfirm?: () => void
  onCancel?: () => void
  confirmClassName?: string
  cancelClassName?: string
}

export const useAlertDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<AlertDialogOptions>({
    title: "",
    description: "",
    confirmLabel: "OK",
    cancelLabel: "Cancel",
    variant: "default",
  })

  const showAlert = useCallback((opts: AlertDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({
        ...opts,
        onConfirm: () => {
          resolve(true)
          if (opts.onConfirm) opts.onConfirm()
          setIsOpen(false)
        },
        onCancel: () => {
          resolve(false)
          if (opts.onCancel) opts.onCancel()
          setIsOpen(false)
        },
      })
      setIsOpen(true)
    })
  }, [])

  const AlertDialogComponent = useCallback(() => {
    const variantStyles = options.variant === "destructive"
      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      : ""

    return (
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {options.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {options.cancelLabel && (
              <AlertDialogCancel 
                onClick={options.onCancel}
                className={options.cancelClassName}
              >
                {options.cancelLabel}
              </AlertDialogCancel>
            )}
            <AlertDialogAction 
              onClick={options.onConfirm}
              className={cn(variantStyles, options.confirmClassName)}
            >
              {options.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }, [isOpen, options])

  return { showAlert, AlertDialogComponent }
}

// Helper to combine class names (if not using cn from lib)
function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}