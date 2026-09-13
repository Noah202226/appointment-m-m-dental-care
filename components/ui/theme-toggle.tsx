"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const currentTheme =
      document.documentElement.getAttribute("data-theme") === "dark" ||
      document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
    setTheme(currentTheme);

    const observer = new MutationObserver(() => {
      const nextTheme =
        document.documentElement.getAttribute("data-theme") === "dark" ||
        document.documentElement.classList.contains("dark")
          ? "dark"
          : "light";
      setTheme(nextTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("theme", nextTheme);
    } catch (e) {}
  };

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon-sm"
        className={className}
        aria-label="Toggle theme"
      >
        <span className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={toggleTheme}
      className={`relative overflow-hidden transition-colors border-border hover:bg-muted ${className || ""}`}
      title={theme === "light" ? "Switch to Dark mode" : "Switch to Light mode"}
      aria-label="Toggle theme"
    >
      <Sun
        className={`h-4 w-4 transition-all duration-300 text-amber-500 ${
          theme === "dark" ? "scale-0 rotate-90" : "scale-100 rotate-0"
        }`}
      />
      <Moon
        className={`absolute h-4 w-4 transition-all duration-300 text-amber-400 ${
          theme === "dark" ? "scale-100 rotate-0" : "scale-0 -rotate-90"
        }`}
      />
    </Button>
  );
}
