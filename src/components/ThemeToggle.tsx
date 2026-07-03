"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  const isDark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="
        group
        flex
        items-center
        justify-center
        h-11
        w-11
        rounded-2xl
        border
        border-border
        bg-card
        shadow-sm
        hover:bg-muted
        hover:shadow-md
        transition-all
        duration-300
      "
    >
      <div className="transition-transform duration-500 group-hover:rotate-180">
        {isDark ? (
          <Sun className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 text-slate-700" />
        )}
      </div>
    </button>
  )
}