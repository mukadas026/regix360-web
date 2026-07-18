"use client"

import { Toaster as HotToaster } from "react-hot-toast"

const baseStyle = {
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  boxShadow: "0 4px 16px -4px rgb(0 0 0 / 0.15)",
  fontSize: "13.5px",
  padding: "10px 14px",
}

function accent(color: string) {
  return { borderRight: `3px solid ${color}` }
}

function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: { ...baseStyle, ...accent("var(--primary)") },
        success: {
          style: { ...baseStyle, ...accent("var(--status-good)") },
          iconTheme: { primary: "var(--status-good)", secondary: "var(--popover)" },
        },
        error: {
          style: { ...baseStyle, ...accent("var(--status-bad)") },
          iconTheme: { primary: "var(--status-bad)", secondary: "var(--popover)" },
        },
      }}
    />
  )
}

export { Toaster }
