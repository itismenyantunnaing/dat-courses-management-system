"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  LeftTriangleIcon,
  CircleIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

type DialogType = "success" | "error" | "warning" | "info" | "confirm"

interface DialogOptions {
  type?: DialogType
  title: string
  message: string
  details?: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  showCancel?: boolean
  isDestructive?: boolean
}

// Global singleton instance
let dialogRef: {
  show: (options: DialogOptions) => Promise<boolean>
  hide: () => void
} | null = null

// Component
export function ImportExportDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<
    DialogOptions & { resolve?: (value: boolean) => void }
  >({
    type: "info",
    title: "",
    message: "",
    showCancel: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [detailsVisible, setDetailsVisible] = useState(false)

  useEffect(() => {
    dialogRef = {
      show: (opts: DialogOptions) => {
        return new Promise<boolean>((resolve) => {
          setOptions({
            ...opts,
            resolve,
          })
          setIsOpen(true)
          setDetailsVisible(false)
          setIsLoading(false)
        })
      },
      hide: () => {
        setIsOpen(false)
      },
    }

    return () => {
      dialogRef = null
    }
  }, [])

  const getIcon = () => {
    const type = options.type || "info"
    switch (type) {
      case "success":
        return {
          icon: CheckmarkCircle01Icon,
          className: "text-green-600 dark:text-green-400",
          bgClassName: "bg-green-100 dark:bg-green-900/20",
        }
      case "error":
        return {
          icon: CancelCircleIcon,
          className: "text-red-600 dark:text-red-400",
          bgClassName: "bg-red-100 dark:bg-red-900/20",
        }
      case "warning":
        return {
          icon: LeftTriangleIcon,
          className: "text-yellow-600 dark:text-yellow-400",
          bgClassName: "bg-yellow-100 dark:bg-yellow-900/20",
        }
      case "confirm":
        return {
          icon: CircleIcon,
          className: "text-blue-600 dark:text-blue-400",
          bgClassName: "bg-blue-100 dark:bg-blue-900/20",
        }
      default:
        return {
          icon: CircleIcon,
          className: "text-blue-600 dark:text-blue-400",
          bgClassName: "bg-blue-100 dark:bg-blue-900/20",
        }
    }
  }

  const { icon: Icon, className, bgClassName } = getIcon()

  const handleConfirm = () => {
    if (options.onConfirm) {
      options.onConfirm()
    }
    if (options.resolve) {
      options.resolve(true)
    }
    setIsOpen(false)
  }

  const handleCancel = () => {
    if (options.onCancel) {
      options.onCancel()
    }
    if (options.resolve) {
      options.resolve(false)
    }
    setIsOpen(false)
  }

  const formatMessage = (text: string) => {
    return text.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split("\n").length - 1 && <br />}
      </span>
    ))
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (options.resolve) {
            options.resolve(false)
          }
          setIsOpen(false)
        }
      }}
    >
      <DialogContent
        className={cn(
          "sm:max-w-[500px]",
          options.type === "error" && "border-red-200 dark:border-red-800",
          options.type === "success" &&
            "border-green-200 dark:border-green-800",
          options.type === "warning" &&
            "border-yellow-200 dark:border-yellow-800"
        )}
        showCloseButton={!isLoading}
      >
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <DialogTitle>{options.title}</DialogTitle>
              <DialogDescription className="mt-2 whitespace-pre-wrap">
                {formatMessage(options.message)}
              </DialogDescription>
              {options.details && (
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailsVisible(!detailsVisible)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {detailsVisible ? "Hide details" : "Show details"}
                  </Button>
                  {detailsVisible && (
                    <div className="mt-2 max-h-[300px] overflow-auto rounded-md bg-muted/50 p-3 font-mono text-sm whitespace-pre-wrap">
                      {options.details}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          {options.showCancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1"
            >
              {options.cancelText || "Cancel"}
            </Button>
          )}
          <Button
            variant={options.isDestructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Processing..." : options.confirmText || "OK"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper functions to use anywhere without hooks
export const dialog = {
  show: (options: DialogOptions): Promise<boolean> => {
    if (dialogRef) {
      return dialogRef.show(options)
    }
    return Promise.reject(new Error("ImportExportDialog not initialized"))
  },

  success: (
    title: string,
    message: string,
    details?: string
  ): Promise<boolean> => {
    return dialog.show({
      type: "success",
      title,
      message,
      details,
      confirmText: "OK",
    })
  },

  error: (
    title: string,
    message: string,
    details?: string
  ): Promise<boolean> => {
    return dialog.show({
      type: "error",
      title,
      message,
      details,
      confirmText: "OK",
    })
  },

  warning: (
    title: string,
    message: string,
    details?: string
  ): Promise<boolean> => {
    return dialog.show({
      type: "warning",
      title,
      message,
      details,
      confirmText: "OK",
    })
  },

  info: (
    title: string,
    message: string,
    details?: string
  ): Promise<boolean> => {
    return dialog.show({
      type: "info",
      title,
      message,
      details,
      confirmText: "OK",
    })
  },

  confirm: (
    title: string,
    message: string,
    confirmText?: string,
    cancelText?: string,
    details?: string,
    isDestructive?: boolean
  ): Promise<boolean> => {
    return dialog.show({
      type: "confirm",
      title,
      message,
      details,
      confirmText: confirmText || "Confirm",
      cancelText: cancelText || "Cancel",
      showCancel: true,
      isDestructive: isDestructive || false,
    })
  },
}
