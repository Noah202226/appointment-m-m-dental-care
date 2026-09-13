"use client";

import * as React from "react";
import {
  Search,
  Calendar,
  UserCheck,
  UserPlus,
  Sun,
  Moon,
  Phone,
  FileText,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export interface CommandPaletteAction {
  id: string;
  title: string;
  category: "Navigation" | "Patients" | "Actions" | "Help";
  icon: React.ReactNode;
  subtitle?: string;
  shortcut?: string;
  handler: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAction?: (type: string, payload?: any) => void;
  patients?: any[];
}

export function CommandPalette({
  open,
  onOpenChange,
  onSelectAction,
  patients = [],
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
    }
  }, [open]);

  const toggleTheme = () => {
    const current =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    onOpenChange(false);
  };

  const defaultActions: CommandPaletteAction[] = [
    {
      id: "select-today",
      title: "Jump to Today",
      subtitle: "Select today's date on the booking calendar",
      category: "Navigation",
      icon: <Calendar className="h-4 w-4 text-amber-500" />,
      shortcut: "Today",
      handler: () => {
        onSelectAction?.("jump-today");
        onOpenChange(false);
      },
    },
    {
      id: "mode-returning",
      title: "Returning Patient Lookup",
      subtitle: "Find your existing record with phone or email",
      category: "Patients",
      icon: <UserCheck className="h-4 w-4 text-emerald-500" />,
      shortcut: "Lookup",
      handler: () => {
        onSelectAction?.("mode-returning");
        onOpenChange(false);
      },
    },
    {
      id: "mode-new",
      title: "New Patient Registration",
      subtitle: "Fill out the registration form for your first visit",
      category: "Patients",
      icon: <UserPlus className="h-4 w-4 text-blue-500" />,
      shortcut: "New",
      handler: () => {
        onSelectAction?.("mode-new");
        onOpenChange(false);
      },
    },
    {
      id: "toggle-theme",
      title: "Toggle Light / Dark Mode",
      subtitle: "Switch between soft slate and obsidian themes",
      category: "Actions",
      icon: <Sun className="h-4 w-4 text-amber-400" />,
      shortcut: "Theme",
      handler: toggleTheme,
    },
    {
      id: "view-policy",
      title: "Clinic Policy & Privacy Terms",
      subtitle: "Review appointment, cancellation, and payment terms",
      category: "Help",
      icon: <FileText className="h-4 w-4 text-zinc-400" />,
      shortcut: "Policy",
      handler: () => {
        onSelectAction?.("view-policy");
        onOpenChange(false);
      },
    },
    {
      id: "call-clinic",
      title: "Call Clinic Assistance",
      subtitle: "+63 905 516 9516 (M&M Dental Center Hotline)",
      category: "Help",
      icon: <Phone className="h-4 w-4 text-emerald-500" />,
      shortcut: "Call",
      handler: () => {
        window.open("tel:+639055169516", "_self");
        onOpenChange(false);
      },
    },
  ];

  const filteredActions = defaultActions.filter((action) => {
    const text = `${action.title} ${action.subtitle || ""} ${action.category}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-border bg-card shadow-2xl">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none"
          />
          <Badge variant="outline" className="text-[10px] uppercase font-mono px-2 py-0.5">
            ESC
          </Badge>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredActions.length > 0 ? (
            filteredActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={action.handler}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all hover:bg-muted/80 group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-background border border-border/80 shadow-2xs group-hover:border-amber-500/40 transition-colors">
                    {action.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground group-hover:text-amber-500 transition-colors">
                      {action.title}
                    </p>
                    {action.subtitle && (
                      <p className="text-xs text-muted-foreground truncate max-w-sm">
                        {action.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                {action.shortcut && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono font-semibold text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">
                      {action.shortcut}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              <p className="text-sm font-medium">No actions matching "{query}"</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Try searching for "Today", "Theme", "Patient", or "Help"
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">M&M Dental Center</span>
            <span>• Quick Actions</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span>Navigate</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] border border-border">
              ↑↓
            </kbd>
            <span>Select</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] border border-border">
              ↵
            </kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
