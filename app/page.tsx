"use client";

import * as React from "react";
import {
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Shield,
  Award,
  Sparkles,
  MapPin,
  HeartHandshake,
} from "lucide-react";
import { format } from "date-fns";
import Header from "./components/header";
import SuccessView from "./components/SuccessView";
import TrustSignal from "./components/TrustSignal";
import { AppointmentForm, BookingSummaryData } from "./components/AppointmentForm";
import { CommandPalette } from "@/components/ui/command-palette";
import { Badge } from "@/components/ui/badge";

function LiveClock() {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 text-center shadow-sm group transition-all">
      <div className="absolute -right-2 -top-2 p-4 text-muted-foreground/10 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
        <Clock size={84} />
      </div>

      <div className="relative z-10 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Clinic Time
        </div>

        <h2 className="text-4xl font-mono font-black tracking-tight text-foreground" suppressHydrationWarning>
          {format(time, "HH:mm:ss")}
        </h2>

        <p className="text-xs font-semibold text-muted-foreground">
          {format(time, "EEEE, MMMM do, yyyy")}
        </p>
      </div>
    </div>
  );
}

export default function PublicAppointmentForm() {
  const [success, setSuccess] = React.useState(false);
  const [patientFullName, setPatientFullName] = React.useState("");

  // Live summary sync from AppointmentForm
  const [summary, setSummary] = React.useState<BookingSummaryData>({
    selectedDate: new Date(),
  });

  // Command palette state
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [cmdAction, setCmdAction] = React.useState<{ type: string; timestamp: number } | null>(null);

  const handleSummaryChange = React.useCallback((data: BookingSummaryData) => {
    setSummary(data);
  }, []);

  if (success) {
    return <SuccessView name={patientFullName || "Patient"} />;
  }

  const patientDisplay =
    summary.firstName || summary.lastName
      ? `${summary.firstName || ""} ${summary.middleInitial ? summary.middleInitial + ". " : ""}${summary.lastName || ""}`.trim()
      : "";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col xl:flex-row font-sans selection:bg-amber-500/25 transition-colors duration-200">
      {/* Global Accessible Command Palette */}
      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onSelectAction={(type) => {
          setCmdAction({ type, timestamp: Date.now() });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          <Header onOpenCommandPalette={() => setCmdOpen(true)} />

          {/* Stepped Interactive Booking Form */}
          <AppointmentForm
            onSuccess={(name) => {
              setPatientFullName(name);
              setSuccess(true);
            }}
            onSummaryChange={handleSummaryChange}
            commandAction={cmdAction}
          />
        </div>
      </main>

      {/* Sticky Right Sidebar (Summary & Clinic Standards) */}
      <aside className="hidden xl:flex w-[380px] bg-card/75 backdrop-blur-md border-l border-border flex-col p-6 sticky top-0 h-screen shadow-lg overflow-y-auto space-y-6">
        {/* Live Clinic Time Clock */}
        <LiveClock />

        {/* Dynamic Appointment Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Appointment Summary
            </h4>
            {summary.selectedTime && (
              <Badge variant="default" className="text-[9px] py-0 px-2">
                Live Preview
              </Badge>
            )}
          </div>

          {summary.selectedTime ? (
            <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              {/* Confirmed Slot Card */}
              <div className="bg-amber-500/10 border-2 border-amber-500/30 p-5 rounded-3xl space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Selected Schedule
                  </p>
                  <CalendarIcon className="h-4 w-4 text-amber-500" />
                </div>
                <h3 className="text-base font-black text-foreground">
                  {summary.selectedDate ? format(summary.selectedDate, "EEEE, MMMM d, yyyy") : "Date selected"}
                </h3>
                <p className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {summary.selectedTime}
                </p>
              </div>

              {/* Patient Details Mirror Card */}
              <div className="bg-muted/40 border border-border p-5 rounded-3xl space-y-3.5 text-xs">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Patient Name
                  </p>
                  <p className="font-bold text-foreground text-sm truncate mt-0.5">
                    {patientDisplay || "Waiting for patient details..."}
                  </p>
                  {summary.foundPatientId && (
                    <Badge variant="success" className="text-[8px] py-0 px-1.5 mt-1">
                      Existing Record Linked
                    </Badge>
                  )}
                </div>

                {summary.contact && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Contact
                    </p>
                    <p className="font-semibold text-foreground mt-0.5">{summary.contact}</p>
                  </div>
                )}

                {summary.email && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Email
                    </p>
                    <p className="font-semibold text-foreground truncate mt-0.5">{summary.email}</p>
                  </div>
                )}

                {summary.note && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Reason for Visit
                    </p>
                    <p className="font-medium text-foreground/90 line-clamp-3 mt-0.5">
                      {summary.note}
                    </p>
                  </div>
                )}

                {summary.referralSource && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Referral Source
                    </p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {summary.referralSource}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-10 border-2 border-dashed border-border/80 rounded-3xl text-center space-y-2.5 p-4 bg-muted/20">
              <div className="p-3 rounded-full bg-muted w-fit mx-auto text-muted-foreground/60">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Awaiting Slot Selection</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Pick a calendar date & time slot to see your live appointment ticket
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Clinic Quality Standards */}
        <div className="pt-4 border-t border-border/70 space-y-3">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Clinic Standards
          </h4>

          <div className="space-y-1.5">
            <TrustSignal
              icon={<Award className="h-4 w-4 text-amber-500" />}
              title="Personalized, Honest Dental Care"
              desc="Every appointment is tailored to your unique oral health needs."
            />
            <TrustSignal
              icon={<Shield className="h-4 w-4 text-amber-500" />}
              title="Comfort, Cleanliness & Safety First"
              desc="Hospital-grade sterilization with modern gentle anesthesia."
            />
            <TrustSignal
              icon={<Sparkles className="h-4 w-4 text-amber-500" />}
              title="Internationally Trained Expertise"
              desc="Continuously updated training across modern dental disciplines."
            />
          </div>
        </div>

        {/* Clinic Location & Hours Footer */}
        <div className="pt-4 border-t border-border/60 text-[11px] text-muted-foreground space-y-1">
          <p className="font-bold text-foreground">M&M Dental Center</p>
          <p>Online Appointment & Patient Intake Portal</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold pt-1">
            Need urgent help? Call +63 905 516 9516
          </p>
        </div>
      </aside>
    </div>
  );
}
