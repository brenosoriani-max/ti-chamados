"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      aria-label="Alternar tema"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="
        group
        flex
        h-10
        w-10
        items-center
        justify-center
        rounded-xl
        border
        border-border
        bg-background
        text-muted-foreground
        transition-all
        hover:border-primary/30
        hover:text-foreground
      "
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-500" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700" />
      )}
    </button>
  )
}