"use client";

import * as React from "react";
import { Phone, Search, Sparkles, Command } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onOpenCommandPalette?: () => void;
}

export function Header({ onOpenCommandPalette }: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/90 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-border shadow-sm transition-colors duration-200">
      {/* Brand & Clinic Info */}
      <div className="flex items-center gap-3.5">
        <div className="relative group">
          <div className="absolute -inset-1 rounded-2xl bg-amber-500/20 blur-xs transition-all group-hover:bg-amber-500/30" />
          <div className="relative bg-card p-2 rounded-2xl border border-amber-500/30 shadow-xs">
            <img
              src="/m&m-dental-center-logo.png"
              alt="M&M Dental Center Logo"
              className="h-11 w-11 rounded-xl object-cover"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              M&M Dental Center
            </h1>
            <Badge variant="default" className="hidden sm:inline-flex text-[9px] py-0 px-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse mr-1" />
              Live Booking
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
            <span>Premier Dental Care & Oral Health</span>
            <span className="hidden sm:inline text-muted-foreground/40">•</span>
            <span className="hidden sm:inline text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              Official Portal
            </span>
          </p>
        </div>
      </div>

      {/* Quick Actions & Contact */}
      <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-between sm:justify-end">
        {/* Quick Search / Command Palette Button */}
        {onOpenCommandPalette && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center gap-2 h-9 px-3 rounded-xl border-border bg-background/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold shadow-2xs"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Search & actions...</span>
            <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border text-muted-foreground">
              Ctrl+K
            </kbd>
          </Button>
        )}

        {/* Contact Pill */}
        <a
          href="tel:+639055169516"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary/70 hover:bg-secondary border border-border text-xs font-bold text-foreground transition-all duration-150 active:scale-95 group"
        >
          <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
            <Phone className="h-3.5 w-3.5" />
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
              Need assistance?
            </p>
            <p className="text-xs font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              +63 905 516 9516
            </p>
          </div>
          <span className="lg:hidden text-xs font-bold">+63 905 516 9516</span>
        </a>

        {/* Theme Toggle Button */}
        <ThemeToggle className="rounded-xl h-9 w-9" />
      </div>
    </header>
  );
}

export default Header;
