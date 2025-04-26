"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "bg-white dark:bg-gray-900 border border-border shadow-md",
          title: "font-semibold text-foreground",
          description: "text-gray-900 dark:text-white font-semibold text-sm",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "hsl(0 0% 100%)",
          "--normal-text": "hsl(0 0% 9%)",
          "--normal-border": "var(--border)",
          "--success-bg": "hsl(0 0% 100%)",
          "--error-bg": "hsl(0 0% 100%)",
          "--toast-shadow": "0 4px 12px rgba(0, 0, 0, 0.1)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
