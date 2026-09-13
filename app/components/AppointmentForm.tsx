"use client";

import * as React from "react";
import {
  Clock,
  User,
  Calendar as CalendarIcon,
  Loader2,
  Phone,
  Mail,
  Search,
  UserPlus,
  UserCheck,
  ShieldAlert,
  Stethoscope,
  MapPin,
  Briefcase,
  Heart,
  Share2,
  CheckCircle2,
  Camera,
  ShieldCheck,
  FileText,
  AlertCircle,
  Sparkles,
  Info,
} from "lucide-react";

import {
  format,
  isBefore,
  startOfDay,
  parse,
  isSameDay,
  isWithinInterval,
  endOfDay,
  parseISO,
} from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { databases, ID, storage } from "@/lib/appwrite";
import { Query } from "appwrite";
import { playSound } from "@/lib/sound";
import clsx from "clsx";

const DB = process.env.NEXT_PUBLIC_DATABASE_ID!;
const BOOKINGS = "appointments";
const SCHEDULES = "clinic_schedules";
const PATIENTS = "patients";
const BUCKET_ID = process.env.NEXT_PUBLIC_STORAGE_BUCKET_ID!;

export interface BookingSummaryData {
  selectedDate?: Date;
  selectedTime?: string;
  firstName?: string;
  lastName?: string;
  middleInitial?: string;
  contact?: string;
  email?: string;
  note?: string;
  referralSource?: string;
  tags?: string;
  foundPatientId?: string | null;
}

interface BookingFormProps {
  onSuccess: (name: string) => void;
  onSummaryChange?: (summary: BookingSummaryData) => void;
  commandAction?: { type: string; timestamp: number } | null;
}

export function AppointmentForm({
  onSuccess,
  onSummaryChange,
  commandAction,
}: BookingFormProps) {
  const [bookedSlots, setBookedSlots] = React.useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [patientMode, setPatientMode] = React.useState<"new" | "returning">("new");
  const [isSearchingPatient, setIsSearchingPatient] = React.useState(false);
  const [foundPatientId, setFoundPatientId] = React.useState<string | null>(null);
  const [operatingHours, setOperatingHours] = React.useState<any>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = React.useState<string | undefined>();

  // Form States
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [middleInitial, setMiddleInitial] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [birthdate, setBirthdate] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [civilStatus, setCivilStatus] = React.useState("");
  const [occupation, setOccupation] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [emergencyToContact, setEmergencyToContact] = React.useState("");
  const [emergencyToContactNumber, setEmergencyToContactNumber] = React.useState("");
  const [note, setNote] = React.useState("");
  const [medicalHistory, setMedicalHistory] = React.useState<string>("");
  const [insuranceCompany, setInsuranceCompany] = React.useState("");
  const [insurancePolicyNo, setInsurancePolicyNo] = React.useState("");
  const [referralSource, setReferralSource] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [photoFileId, setPhotoFileId] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoadingHours, setIsLoadingHours] = React.useState(false);

  const Required = () => <span className="text-amber-500 font-bold ml-0.5">*</span>;

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Broadcast summary updates to parent sidebar
  React.useEffect(() => {
    onSummaryChange?.({
      selectedDate,
      selectedTime,
      firstName,
      lastName,
      middleInitial,
      contact,
      email,
      note,
      referralSource,
      tags,
      foundPatientId,
    });
  }, [
    selectedDate,
    selectedTime,
    firstName,
    lastName,
    middleInitial,
    contact,
    email,
    note,
    referralSource,
    tags,
    foundPatientId,
    onSummaryChange,
  ]);

  // Handle external command palette triggers
  React.useEffect(() => {
    if (!commandAction) return;
    if (commandAction.type === "jump-today") {
      setSelectedDate(new Date());
    } else if (commandAction.type === "mode-returning") {
      setPatientMode("returning");
    } else if (commandAction.type === "mode-new") {
      setPatientMode("new");
      setFoundPatientId(null);
    } else if (commandAction.type === "view-policy") {
      setPolicyDialogOpen(true);
    }
  }, [commandAction]);

  // Data Fetching Logic (Schedules & Slots)
  const fetchOperatingHours = React.useCallback(async (date: Date) => {
    setIsLoadingHours(true);
    try {
      const res = await databases.listDocuments(DB, SCHEDULES, [
        Query.orderDesc("priority"),
      ]);

      const targetTime = startOfDay(date);
      const activeSchedule = res.documents.find((sch) => {
        try {
          const start = startOfDay(parseISO(sch.startDate));
          const end = endOfDay(parseISO(sch.endDate));
          return isWithinInterval(targetTime, { start, end });
        } catch (error) {
          return false;
        }
      });

      if (!activeSchedule) {
        setOperatingHours({ active: false, name: "Closed" });
        return;
      }

      const config = JSON.parse(activeSchedule.config);
      const dayName = format(date, "EEEE");
      const daySettings = config[dayName];

      if (!daySettings || daySettings.active === false) {
        setOperatingHours({ active: false, name: "Closed today" });
      } else {
        setOperatingHours({
          ...daySettings,
          name: activeSchedule.name,
          active: true,
          capacity: daySettings.capacity,
        });
      }
    } catch (err) {
      console.error("fetchOperatingHours Error:", err);
    } finally {
      setIsLoadingHours(false);
    }
  }, []);

  const loadBookedSlots = React.useCallback(async (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    try {
      const res = await databases.listDocuments(DB, BOOKINGS, [
        Query.equal("dateKey", key),
        Query.notEqual("status", "cancelled"),
      ]);
      setBookedSlots(res.documents);
    } catch (err) {
      console.error(err);
    }
  }, []);

  React.useEffect(() => {
    if (selectedDate) {
      loadBookedSlots(selectedDate);
      fetchOperatingHours(selectedDate);
    }
    setSelectedTime(undefined);
  }, [selectedDate, loadBookedSlots, fetchOperatingHours]);

  const handleClearSearch = () => {
    setFoundPatientId(null);
    setSearchQuery("");
    setFirstName("");
    setLastName("");
    setMiddleInitial("");
    setEmail("");
    setContact("");
    setBirthdate("");
    setGender("");
    setCivilStatus("");
    setOccupation("");
    setAddress("");
    setEmergencyToContact("");
    setEmergencyToContactNumber("");
    setMedicalHistory("");
    setInsuranceCompany("");
    setInsurancePolicyNo("");
    setNote("");
    setPhotoFileId("");
  };

  const handleCheckPatient = async () => {
    if (!searchQuery) return;
    setIsSearchingPatient(true);
    try {
      const res = await databases.listDocuments(DB, PATIENTS, [
        Query.or([
          Query.equal("email", searchQuery),
          Query.equal("contact", searchQuery),
        ]),
        Query.limit(1),
      ]);

      if (res.documents.length > 0) {
        const p = res.documents[0];
        setFirstName(p?.firstName || "");
        setLastName(p?.lastName || "");
        setMiddleInitial(p?.middleName || "");
        setContact(p.phone || p.contact || "");
        setEmail(p.email || "");
        setBirthdate(p.birthdate || "");
        setGender(p.gender || "");
        setCivilStatus(p.civilStatus || "");
        setOccupation(p.occupation || "");
        setAddress(p.address || "");
        setEmergencyToContact(p.emergencyToContact || "");
        setEmergencyToContactNumber(p.emergencyToContactNumber || "");
        setMedicalHistory(p.medicalHistory?.join(", ") || "");
        setReferralSource(p.referralSource || "");

        setFoundPatientId(p.$id);
        playSound("success");
      } else {
        alert("No record found. Please check your contact/email or register as a new patient.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingPatient(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !selectedTime || isSubmitting) return;

    if (!referralSource && !foundPatientId) {
      alert("Please specify how you heard about M&M Dental Center.");
      return;
    }

    setIsSubmitting(true);
    try {
      const historyArray = medicalHistory
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const patientName = `${firstName} ${middleInitial ? middleInitial + ". " : ""}${lastName}`.trim();

      await databases.createDocument(DB, BOOKINGS, ID.unique(), {
        title: patientName,
        email,
        phone: contact,
        birthdate,
        gender,
        civilStatus,
        occupation,
        firstName,
        lastName,
        middleName: middleInitial,
        address,
        emergencyToContact,
        emergencyToContactNumber,
        medicalHistory: historyArray,
        insuranceCompany,
        insurancePolicyNo,
        photoFileId,
        referralSource,
        tags: tags || "Website Booking",
        notes: note,
        date: selectedDate.toISOString(),
        dateKey: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
        status: "pending",
        timestamp: String(Math.floor(Date.now() / 1000)),
        patientId: foundPatientId || null,
        isNewPatient: !foundPatientId,
      });

      onSuccess(patientName);
    } catch (err) {
      console.error("Booking Error:", err);
      alert("Something went wrong with your appointment request. Please check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const slots = React.useMemo(() => {
    if (!isMounted || !selectedDate || !operatingHours?.active) return [];
    const { open, close } = operatingHours;
    const generated: string[] = [];

    const startDate = parse(open, "HH:mm", selectedDate);
    const endDate = parse(close, "HH:mm", selectedDate);

    let currentMinutes = startDate.getHours() * 60 + startDate.getMinutes();
    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();

    const now = new Date();
    const manilaNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));

    while (currentMinutes < endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const slotDate = new Date(selectedDate);
      slotDate.setHours(h, m, 0, 0);

      const timeString = format(slotDate, "hh:mm a");
      const isToday = isSameDay(selectedDate, manilaNow);
      const isFuture = isBefore(manilaNow, slotDate);

      if (!isToday || isFuture) {
        generated.push(timeString);
      }
      currentMinutes += 30;
    }
    return generated;
  }, [isMounted, selectedDate, operatingHours]);

  return (
    <>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUMN 1: SCHEDULING (STEPS 1 & 2) */}
        <div className="lg:col-span-4 space-y-6">
          {/* STEP 1: DATE SELECTION */}
          <Card className="overflow-hidden border-border bg-card shadow-sm hover:border-amber-500/30 transition-colors">
            <CardHeader className="border-b border-border/70 pb-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      Select Date
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Choose your preferred visit day
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="default" className="text-[10px] font-bold">
                  Step 1
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => isBefore(date, startOfDay(new Date()))}
                className="w-full flex justify-center"
              />
            </CardContent>
          </Card>

          {/* STEP 2: TIME SELECTION */}
          <Card className="overflow-hidden border-border bg-card shadow-sm hover:border-amber-500/30 transition-colors min-h-[340px]">
            <CardHeader className="border-b border-border/70 pb-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      Choose Time Slot
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {operatingHours?.active
                        ? `Hours: ${operatingHours.open || "09:00"} - ${operatingHours.close || "18:00"}`
                        : "Clinic availability"}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="default" className="text-[10px] font-bold">
                  Step 2
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 flex flex-col justify-center min-h-[240px]">
              {isLoadingHours ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground animate-pulse">
                    Checking slot availability...
                  </p>
                </div>
              ) : !operatingHours?.active ? (
                <div className="text-center py-8 space-y-2">
                  <div className="p-3 rounded-full bg-red-500/10 text-red-500 w-fit mx-auto">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    No Clinic Hours on Selected Date
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    The clinic is closed or has no appointments scheduled for this day. Please select another date on the calendar.
                  </p>
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="p-3 rounded-full bg-amber-500/10 text-amber-500 w-fit mx-auto">
                    <Clock className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-foreground">No Remaining Slots Today</p>
                  <p className="text-xs text-muted-foreground">
                    All slots for today have passed. Please choose an upcoming day.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 animate-in fade-in-0 duration-300">
                  {slots.map((t) => {
                    const capacity = Number(operatingHours?.capacity) || 1;
                    const bookingCount = bookedSlots.filter((b) => b.time?.trim() === t.trim()).length;
                    const isFull = bookingCount >= capacity;
                    const isPartiallyBooked = bookingCount > 0 && bookingCount < capacity;
                    const isSelected = selectedTime === t;

                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={isFull}
                        onClick={() => setSelectedTime(t)}
                        className={clsx(
                          "py-3 px-2 rounded-xl text-xs font-bold transition-all border relative flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-amber-500/25 scale-[1.02]"
                            : isFull
                              ? "bg-muted/40 border-border text-muted-foreground/40 cursor-not-allowed opacity-50"
                              : isPartiallyBooked
                                ? "bg-amber-500/10 border-amber-500/40 text-foreground hover:border-amber-500 hover:bg-amber-500/15"
                                : "bg-card border-border text-foreground hover:border-primary/60 hover:bg-muted/50"
                        )}
                      >
                        <span className="font-semibold tracking-tight">{t}</span>

                        {/* Visual Capacity Dots */}
                        <div className="flex gap-1 items-center">
                          {[...Array(capacity)].map((_, i) => (
                            <span
                              key={i}
                              className={clsx(
                                "w-1.5 h-1.5 rounded-full transition-colors",
                                isSelected
                                  ? i < bookingCount
                                    ? "bg-primary-foreground/50"
                                    : "bg-primary-foreground/90"
                                  : i < bookingCount
                                    ? "bg-amber-500"
                                    : "bg-muted-foreground/25"
                              )}
                            />
                          ))}
                        </div>

                        {/* Status Label */}
                        <span
                          className={clsx(
                            "text-[8px] uppercase tracking-wider font-extrabold",
                            isSelected
                              ? "text-primary-foreground/90"
                              : isFull
                                ? "text-muted-foreground/50"
                                : isPartiallyBooked
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground"
                          )}
                        >
                          {isFull
                            ? "Full"
                            : `${capacity - bookingCount} ${capacity - bookingCount === 1 ? "Slot" : "Slots"}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUMN 2: REGISTRATION DATA (STEP 3) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 sm:p-8 border-border bg-card shadow-sm hover:border-amber-500/30 transition-colors space-y-6">
            {/* Header with Step Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/20">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-foreground tracking-tight">
                      Patient Registration
                    </h3>
                    <Badge variant="default" className="text-[10px] font-bold">
                      Step 3
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Enter patient identity, medical history, and visit preferences
                  </p>
                </div>
              </div>

              {/* Mode Switcher (New vs Returning) */}
              <div className="bg-muted/60 p-1 rounded-2xl flex gap-1 border border-border/60 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    setPatientMode("new");
                    setFoundPatientId(null);
                  }}
                  className={clsx(
                    "px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer",
                    patientMode === "new"
                      ? "bg-card text-foreground shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <UserPlus size={13} />
                  <span>New Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPatientMode("returning")}
                  className={clsx(
                    "px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer",
                    patientMode === "returning"
                      ? "bg-card text-amber-600 dark:text-amber-400 shadow-xs border border-amber-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <UserCheck size={13} />
                  <span>Returning</span>
                </button>
              </div>
            </div>

            {/* RETURNING PATIENT LOOKUP BAR */}
            {patientMode === "returning" && (
              <div className="space-y-4">
                {isSearchingPatient ? (
                  <div className="bg-muted/40 border border-border p-4 rounded-2xl space-y-2 animate-pulse">
                    <div className="h-3 w-36 bg-muted rounded" />
                    <div className="flex gap-2">
                      <div className="h-11 flex-1 bg-muted rounded-xl" />
                      <div className="h-11 w-24 bg-muted rounded-xl" />
                    </div>
                  </div>
                ) : foundPatientId ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500 rounded-xl p-2 text-white shadow-xs">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="success" className="text-[9px] py-0 px-2">
                            Verified Record
                          </Badge>
                        </div>
                        <p className="text-sm font-bold text-foreground mt-0.5">
                          Welcome back, {firstName} {middleInitial ? middleInitial + ". " : ""}{lastName}!
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearSearch}
                      className="text-xs font-semibold h-8 rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      Not you?
                    </Button>
                  </div>
                ) : (
                  <div className="bg-muted/30 border border-border p-4 rounded-2xl space-y-2.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Search size={12} className="text-amber-500" />
                      Find your patient profile
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="Enter registered Email or Mobile Number"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-11 bg-background pl-10 rounded-xl border-border text-foreground placeholder:text-muted-foreground"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCheckPatient();
                            }
                          }}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      <Button
                        type="button"
                        onClick={handleCheckPatient}
                        className="h-11 px-5 font-bold rounded-xl"
                      >
                        Search Record
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PATIENT FORM FIELDS */}
            <div
              className={clsx(
                "grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-200",
                patientMode === "returning" && !foundPatientId && "opacity-30 pointer-events-none"
              )}
            >
              {!foundPatientId ? (
                <>
                  {/* REFERRAL SOURCE */}
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Share2 size={12} className="text-amber-500" />
                      How did you hear about M&M Dental Center? <Required />
                    </Label>
                    <Input
                      required
                      placeholder="e.g. Google Search, Facebook, Word of Mouth, Friend / Family"
                      value={referralSource}
                      onChange={(e) => setReferralSource(e.target.value)}
                      className="h-11 rounded-xl bg-background border-border text-foreground"
                    />
                  </div>

                  {/* FULL NAME */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Last Name <Required />
                      </Label>
                      <Input
                        required
                        placeholder="Dela Cruz"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-11 rounded-xl bg-background border-border text-foreground"
                      />
                    </div>
                    <div className="md:col-span-5 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        First Name <Required />
                      </Label>
                      <Input
                        required
                        placeholder="Juan"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-11 rounded-xl bg-background border-border text-foreground"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        M.I.
                      </Label>
                      <Input
                        placeholder="P"
                        maxLength={2}
                        value={middleInitial}
                        onChange={(e) => setMiddleInitial(e.target.value)}
                        className="h-11 rounded-xl bg-background border-border text-center text-foreground uppercase"
                      />
                    </div>
                  </div>

                  {/* CONTACT & EMAIL */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Phone size={11} className="text-amber-500" />
                      Contact Number <Required />
                    </Label>
                    <Input
                      required
                      type="tel"
                      placeholder="0917 123 4567"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="h-11 rounded-xl bg-background border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Mail size={11} className="text-amber-500" />
                      Email Address <Required />
                    </Label>
                    <Input
                      required
                      type="email"
                      placeholder="juan.delacruz@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 rounded-xl bg-background border-border text-foreground"
                    />
                  </div>

                  {/* CIVIL STATUS & OCCUPATION */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Civil Status <Required />
                    </Label>
                    <Select value={civilStatus} onValueChange={setCivilStatus} required>
                      <SelectTrigger className="h-11 rounded-xl bg-background border-border text-foreground">
                        <SelectValue placeholder="Select Civil Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                        <SelectItem value="Separated">Separated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Briefcase size={11} className="text-amber-500" />
                      Occupation <Required />
                    </Label>
                    <Input
                      placeholder="e.g. Software Engineer, Teacher"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="h-11 rounded-xl bg-background border-border text-foreground"
                      required
                    />
                  </div>

                  {/* ADDRESS */}
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <MapPin size={11} className="text-amber-500" />
                      Home Address <Required />
                    </Label>
                    <Input
                      placeholder="Unit #, Street, Barangay, City, Province"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-11 rounded-xl bg-background border-border text-foreground"
                      required
                    />
                  </div>

                  {/* DEMOGRAPHICS (BIRTHDATE & GENDER) */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Date of Birth <Required />
                    </Label>
                    <Input
                      required
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className="h-11 rounded-xl bg-background border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Gender <Required />
                    </Label>
                    <Select value={gender} onValueChange={setGender} required>
                      <SelectTrigger className="h-11 rounded-xl bg-background border-border text-foreground">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CLINICAL BACKGROUND HEADER */}
                  <div className="md:col-span-2 pt-2 border-t border-border/70 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                      <Stethoscope size={14} />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                      Clinical Background & Medical Notes
                    </h4>
                  </div>

                  {/* MEDICAL HISTORY */}
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Medical Conditions & Allergies (Comma-separated or write "None") <Required />
                    </Label>
                    <Input
                      placeholder="e.g. Hypertension, Penicillin Allergy, Asthma, or None"
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      className="h-11 rounded-xl bg-background border-border text-foreground"
                      required
                    />
                  </div>

                  {/* EMERGENCY CONTACT */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Heart size={11} className="text-red-500" />
                      Emergency Contact Name <Required />
                    </Label>
                    <Input
                      placeholder="Full Name of Contact Person"
                      value={emergencyToContact}
                      onChange={(e) => setEmergencyToContact(e.target.value)}
                      className="h-11 rounded-xl bg-background border-border text-foreground"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Phone size={11} className="text-red-500" />
                      Emergency Contact Phone <Required />
                    </Label>
                    <Input
                      placeholder="0917 000 0000"
                      value={emergencyToContactNumber}
                      onChange={(e) => setEmergencyToContactNumber(e.target.value)}
                      className="h-11 rounded-xl bg-background border-border text-foreground"
                      required
                    />
                  </div>
                </>
              ) : (
                /* EXISTING PATIENT PRIVACY BANNER */
                <div className="md:col-span-2 bg-muted/40 border border-border rounded-2xl p-5 flex items-center gap-4 animate-in zoom-in-95 duration-200">
                  <div className="p-3 bg-amber-500/15 text-amber-500 border border-amber-500/20 rounded-xl">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      Existing Medical & Personal Record Linked
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Demographic and clinical data for{" "}
                      <span className="font-bold text-foreground">
                        {lastName}, {firstName}
                      </span>{" "}
                      is safely linked to your appointment.
                    </p>
                  </div>
                </div>
              )}

              {/* REASON FOR VISIT */}
              <div className="md:col-span-2 space-y-1.5 pt-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Reason for Visit / Dental Concerns <Required />
                </Label>
                <Textarea
                  placeholder="Describe your symptoms or procedure of interest (e.g. Toothache, Routine Cleaning, Braces Consultation, Tooth Extraction)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="rounded-xl bg-background border-border text-foreground min-h-[90px] resize-none"
                  required
                />
              </div>

              {/* CLINIC POLICY & TERMS WITH ACCESSIBLE MODAL */}
              <div className="md:col-span-2 space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShieldAlert size={12} className="text-amber-500" />
                    Clinic Policy & Consent
                  </Label>
                  <button
                    type="button"
                    onClick={() => setPolicyDialogOpen(true)}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Info size={12} />
                    Read Full Clinic Policy
                  </button>
                </div>

                {/* Consent Checkbox Card */}
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-muted/40 border border-border transition-colors hover:bg-muted/60">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="terms"
                      type="checkbox"
                      required
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                    />
                  </div>
                  <div className="text-xs">
                    <label
                      htmlFor="terms"
                      className="font-bold text-foreground cursor-pointer select-none"
                    >
                      I have read and agree to the M&M Dental Center Clinic Policies & Terms.
                    </label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Covers arrival standards (15 mins early), 24h cancellation notice, and health privacy compliance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CONFIRM BUTTON */}
            <Button
              type="submit"
              variant="default"
              size="lg"
              loading={isSubmitting}
              disabled={
                isSubmitting ||
                !selectedTime ||
                !agreedToTerms ||
                (patientMode === "returning" && !foundPatientId)
              }
              className="w-full h-14 text-base font-black rounded-2xl shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all"
            >
              Confirm Appointment Booking
            </Button>
          </Card>
        </div>
      </form>

      {/* ACCESSIBLE CLINIC POLICY DIALOG */}
      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 border-border bg-card shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="text-[10px]">
                Policy Standards
              </Badge>
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              M&M Dental Center Clinic Policy
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Please review our operating guidelines to ensure seamless and timely care.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs text-foreground/90 leading-relaxed divide-y divide-border/60">
            <div className="pt-2 space-y-1">
              <h5 className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 text-[11px]">
                1. Appointment & Arrival Policy
              </h5>
              <p className="text-muted-foreground">
                Please arrive 15 minutes before your scheduled appointment time. If you are more than 10 minutes late, the clinic reserves the right to accommodate other patients in queue.
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <h5 className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 text-[11px]">
                2. Cancellation & Rescheduling
              </h5>
              <p className="text-muted-foreground">
                Cancellations or rescheduling requests must be communicated at least 24 hours in advance. Timely notification allows us to offer the slot to other patients in need.
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <h5 className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 text-[11px]">
                3. Clinical Flow & Complex Cases
              </h5>
              <p className="text-muted-foreground">
                Dental procedures can occasionally encounter unexpected clinical complexities that require extra chair time. We strive for punctuality and appreciate your kind understanding.
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <h5 className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 text-[11px]">
                4. Data Privacy & Confidentiality
              </h5>
              <p className="text-muted-foreground">
                All dental, medical, and personal records collected are strictly confidential and stored securely in compliance with national health privacy regulations.
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <h5 className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 text-[11px]">
                5. Payment & Settlement
              </h5>
              <p className="text-muted-foreground">
                Payment is due upon completion of procedures. We welcome Cash, Credit/Debit Cards, and E-Wallet transfers. Installment arrangements may be discussed at reception.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setAgreedToTerms(true);
                setPolicyDialogOpen(false);
              }}
              className="w-full sm:w-auto h-10 px-5 text-xs font-bold rounded-xl"
            >
              I Understand & Agree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AppointmentForm;
