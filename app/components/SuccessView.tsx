"use client";

import * as React from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, Calendar, Clock, MapPin, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { playSound } from "@/lib/sound";

interface SuccessViewProps {
  name: string;
}

export function SuccessView({ name }: SuccessViewProps) {
  React.useEffect(() => {
    // 1. Play success chime
    playSound("success");

    // 2. Fire Amber & Gold celebratory confetti
    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.6 },
      colors: ["#EAB308", "#F59E0B", "#D97706", "#FDE047", "#FFFFFF"],
    });

    const end = Date.now() + 1.8 * 1000;
    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#EAB308", "#F59E0B", "#FFFFFF"],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#EAB308", "#F59E0B", "#FFFFFF"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const firstName = name.trim().split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      <Card className="max-w-md w-full bg-card border-border border-t-8 border-t-amber-500 p-6 sm:p-10 text-center space-y-6 shadow-2xl rounded-3xl animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Animated Amber Checkmark */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-75" />
          <div className="relative h-20 w-20 bg-amber-500/15 border-2 border-amber-500/40 rounded-full flex items-center justify-center text-amber-500 shadow-md shadow-amber-500/20">
            <CheckCircle2 className="h-10 w-10 text-amber-500" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <Badge variant="default" className="text-[10px] uppercase font-bold py-0.5 px-3">
            Request Transmitted
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Thank you, {firstName}!
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your appointment request has been beamed to our clinic reception.
            Our team will contact you via text or email to confirm your slot within 24 to 48 hours.
          </p>
        </div>

        {/* Clinic Appointment Pass Card */}
        <div className="bg-muted/40 border border-border rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Clinic
            </span>
            <span className="text-xs font-black text-foreground">
              M&M Dental Center
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Patient Name
            </span>
            <span className="text-xs font-bold text-foreground truncate max-w-[200px]">
              {name}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Hotline
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              +63 905 516 9516
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <Button
            onClick={() => window.location.reload()}
            className="w-full h-12 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-amber-500/20 rounded-xl active:scale-[0.98]"
          >
            Book Another Appointment
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            Need to change something? Call our reception at +63 905 516 9516.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default SuccessView;
