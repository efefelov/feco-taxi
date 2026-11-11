"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast
            key={id}
            {...props}
            className="border-zinc-700 bg-zinc-900/95 text-zinc-100 shadow-2xl shadow-black/40 backdrop-blur"
          >
            <div className="grid gap-1">
              {title && <ToastTitle className="text-sm font-bold text-white">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-sm text-zinc-400">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}