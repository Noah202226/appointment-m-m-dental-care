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
import { Card } from "@/components/ui/card";
import { databases, ID, storage } from "@/lib/appwrite";
import { Query } from "appwrite";
import { playSound } from "@/lib/sound";
import clsx from "clsx";

const DB = process.env.NEXT_PUBLIC_DATABASE_ID!;
const BOOKINGS = "appointments";
const SCHEDULES = "clinic_schedules";
const PATIENTS = "patients";
const BUCKET_ID = process.env.NEXT_PUBLIC_STORAGE_BUCKET_ID!;

interface BookingFormProps {
  onSuccess: (name: string) => void;
}

export function AppointmentForm({ onSuccess }: BookingFormProps) {
  const [bookedSlots, setBookedSlots] = React.useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [patientMode, setPatientMode] = React.useState<"new" | "returning">(
    "new",
  );
  const [isSearchingPatient, setIsSearchingPatient] = React.useState(false);
  const [foundPatientId, setFoundPatientId] = React.useState<string | null>(
    null,
  );
  const [operatingHours, setOperatingHours] = React.useState<any>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date(),
  );
  const [selectedTime, setSelectedTime] = React.useState<string | undefined>();

  // --- FORM STATES ---
  const [isPatientFound, setIsPatientFound] = React.useState(false);

  // Replace patientName with these
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
  const [emergencyToContactNumber, setEmergencyToContactNumber] =
    React.useState("");
  const [note, setNote] = React.useState("");
  const [medicalHistory, setMedicalHistory] = React.useState<string>("");
  const [insuranceCompany, setInsuranceCompany] = React.useState("");
  const [insurancePolicyNo, setInsurancePolicyNo] = React.useState("");

  // New States for Referral and Photo
  const [referralSource, setReferralSource] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [photoFileId, setPhotoFileId] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);

  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

  const Required = () => (
    <span className="text-orange-600 font-bold text-lg">*</span>
  );

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- PHOTO UPLOAD HANDLER ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadedFile = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file,
      );
      setPhotoFileId(uploadedFile.$id);
      playSound("success");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const [isLoadingHours, setIsLoadingHours] = React.useState(false);

  // --- Data Fetching Logic (Schedules & Slots) ---
  const fetchOperatingHours = React.useCallback(async (date: Date) => {
    setIsLoadingHours(true);
    try {
      const res = await databases.listDocuments(DB, SCHEDULES, [
        Query.orderDesc("priority"),
      ]);

      const targetTime = startOfDay(date);

      const activeSchedule = res.documents.find((sch) => {
        try {
          // Use parseISO to prevent Safari from shifting dates to UTC
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
      // Use date-fns format for reliable key matching (e.g. "Monday")
      const dayName = format(date, "EEEE");
      const daySettings = config[dayName];

      if (!daySettings || daySettings.active === false) {
        setOperatingHours({ active: false, name: "Closed today" });
      } else {
        setOperatingHours({
          ...daySettings,
          name: activeSchedule.name,
          active: true,
          // Ensure capacity is explicitly passed if it's nested in daySettings
          capacity: daySettings.capacity,
        });
      }
    } catch (err) {
      console.error("fetchOperatingHours Error:", err);
      // Optional: notify.error("Failed to load clinic hours");
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

  // 1. Update the state for the search input
  const [searchQuery, setSearchQuery] = React.useState("");

  const SearchSkeleton = () => (
    <div className="bg-zinc-100 border border-zinc-200 p-4 rounded-2xl space-y-3 animate-pulse">
      searching ...
      <div className="h-3 w-32 bg-zinc-200 rounded" />
      <div className="flex gap-2">
        <div className="h-12 flex-1 bg-zinc-200 rounded-xl" />
        <div className="h-12 w-12 bg-zinc-200 rounded-xl" />
      </div>
    </div>
  );

  // Clear function to reset everything
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

  // --- Patient Record Lookup ---
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

        setFirstName(p?.firstName);
        setLastName(p?.lastName);
        setMiddleInitial(p?.middleName);
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
        setReferralSource(p.referralSource);

        setFoundPatientId(p.$id);
        playSound("success");
      } else {
        alert(
          "No record found. Please check your details or register as a new patient.",
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingPatient(false);
    }
  };

  // --- SUBMIT HANDLER ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !selectedTime || isSubmitting) return;

    // Add a manual check for referralSource
    if (!referralSource && !foundPatientId) {
      alert("Please select a referral source.");
      return;
    }

    setIsSubmitting(true);

    try {
      const historyArray = medicalHistory
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      // Construct the full name string
      const patientName =
        `${firstName} ${middleInitial ? middleInitial + ". " : ""}${lastName}`.trim();

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
        photoFileId, // Storing the Appwrite File ID
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
    } finally {
      setIsSubmitting(false);
    }
  }

  const slots = React.useMemo(() => {
    console.log(selectedDate, operatingHours);
    if (!isMounted || !selectedDate || !operatingHours?.active) return [];
    const { open, close } = operatingHours;
    const generated = [];

    const startDate = parse(open, "HH:mm", selectedDate);
    const endDate = parse(close, "HH:mm", selectedDate);

    let currentMinutes = startDate.getHours() * 60 + startDate.getMinutes();
    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();

    // FIX: Stable Manila time for mobile
    const now = new Date();
    const manilaNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Manila" }),
    );

    while (currentMinutes < endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const slotDate = new Date(selectedDate);
      slotDate.setHours(h, m, 0, 0);

      const timeString = format(slotDate, "hh:mm a");

      // Check if slot is in the future
      const isToday = isSameDay(selectedDate, manilaNow);
      const isFuture = isBefore(manilaNow, slotDate);

      if (!isToday || isFuture) {
        generated.push(timeString);
      }
      currentMinutes += 30;
    }

    // CRITICAL CHANGE: We no longer filter out booked slots here.
    // We return the full list so the UI can mark them as "Occupied".
    console.log(generated, "Generated");
    return generated;
  }, [isMounted, selectedDate, bookedSlots, operatingHours]);

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
    >
      {/* COLUMN 1: SCHEDULING */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="overflow-hidden border-zinc-200 shadow-xl rounded-3xl">
          <div className="bg-yellow-400 p-4 text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <span className="font-bold">1. Select Date</span> <Required />
          </div>
          <div className="p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => isBefore(date, startOfDay(new Date()))}
              className="w-full"
            />
          </div>
        </Card>

        <Card className="overflow-hidden border-zinc-200 shadow-xl rounded-3xl min-h-75">
          <div className="bg-yellow-400/60 p-4 text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-black" />
            <span className="font-bold text-black">2. Choose Time</span>{" "}
            <Required />
          </div>
          <div className="p-6 min-h-85 flex flex-col">
            {/* --- LOADING STATE --- */}
            {isLoadingHours ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 animate-pulse">
                  Fetching availability...
                </p>
              </div>
            ) : !operatingHours?.active ? (
              /* --- CLOSED STATE --- */
              <div className="text-center py-8">
                <ShieldAlert className="h-10 w-10 text-red-400 mx-auto mb-2" />
                <p className="text-red-500 font-bold">
                  No clinic hours set on this date.
                </p>
                <p className="text-xs text-zinc-400">
                  Please select another day.
                </p>
              </div>
            ) : (
              /* --- SLOTS GRID --- */
              <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {slots.map((t) => {
                  // 1. Get capacity from operatingHours (fallback to 1 if not set)
                  const capacity = Number(operatingHours?.capacity) || 1;

                  // 2. Count how many people are booked for this specific time slot
                  const bookingCount = bookedSlots.filter(
                    (b) => b.time?.trim() === t.trim(),
                  ).length;

                  // 3. Define our limits based on DYNAMIC capacity
                  const isFull = bookingCount >= capacity;
                  const isPartiallyBooked =
                    bookingCount > 0 && bookingCount < capacity;

                  return (
                    <button
                      key={t}
                      type="button"
                      // Disable only when it reaches the specific capacity for this schedule
                      disabled={isFull}
                      onClick={() => setSelectedTime(t)}
                      className={clsx(
                        "py-3 rounded-xl text-xs font-bold transition-all border relative flex flex-col items-center justify-center gap-1",
                        selectedTime === t
                          ? "bg-primary text-white border-primary shadow-lg scale-[1.02]"
                          : isFull
                            ? "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed opacity-60"
                            : isPartiallyBooked
                              ? "bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400"
                              : "bg-white border-zinc-200 hover:border-primary hover:bg-zinc-50",
                      )}
                    >
                      <span>{t}</span>

                      {/* 4. Visual Slot Indicator (Dynamic dots based on capacity) */}
                      <div className="flex gap-0.5 mt-1">
                        {[...Array(capacity)].map((_, i) => (
                          <div
                            key={i}
                            className={clsx(
                              "w-1.5 h-1.5 rounded-full",
                              i < bookingCount
                                ? "bg-amber-500" // Filled chair
                                : "bg-zinc-200", // Available chair
                            )}
                          />
                        ))}
                      </div>

                      {isFull ? (
                        <span className="text-[7px] uppercase font-black opacity-60">
                          Fully Booked
                        </span>
                      ) : (
                        <span className="text-[7px] uppercase font-black opacity-40">
                          {capacity - bookingCount}{" "}
                          {capacity - bookingCount === 1 ? "Slot" : "Slots"}{" "}
                          Left
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* COLUMN 2: REGISTRATION DATA */}
      <div className="lg:col-span-8 space-y-6">
        <Card className="p-8 border-zinc-200 shadow-xl rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <User className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-800 uppercase tracking-tighter">
                Registration
              </h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                Profile & Medical History
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="bg-zinc-100 p-1 rounded-xl flex gap-1">
            <button
              type="button"
              hidden={foundPatientId ? true : false}
              onClick={() => {
                setPatientMode("new");
                setFoundPatientId(null);
              }}
              className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${patientMode === "new" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400"}`}
            >
              <UserPlus size={14} className="inline mr-2" /> New
            </button>
            <button
              type="button"
              onClick={() => setPatientMode("returning")}
              className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${patientMode === "returning" ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-400"}`}
            >
              <UserCheck size={14} className="inline mr-2" /> Returning
            </button>
          </div>

          {/* --- RETURNING PATIENT INTERFACE --- */}
          {patientMode === "returning" && (
            <div className="space-y-4">
              {isSearchingPatient ? (
                <SearchSkeleton />
              ) : foundPatientId ? (
                /* SUCCESS BANNER WITH CLEAR OPTION */
                <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-2xl flex items-center justify-between animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 rounded-full p-1.5 shadow-lg shadow-emerald-200">
                      <CheckCircle2 size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        Patient Verified
                      </p>
                      <p className="text-sm font-bold text-zinc-800">
                        Welcome back, {firstName} {middleInitial} {lastName}!
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearSearch}
                    className="h-9 px-4 text-[10px] font-black uppercase border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl"
                  >
                    Not you?
                  </Button>
                </div>
              ) : (
                /* SEARCH INPUT */
                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Find your record
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Email or Phone Number"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 bg-white pl-10 rounded-xl border-zinc-200 focus:ring-emerald-500"
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), handleCheckPatient())
                        }
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    </div>
                    <Button
                      type="button"
                      onClick={handleCheckPatient}
                      className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-100 transition-all active:scale-95"
                    >
                      Search
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${patientMode === "returning" && !foundPatientId ? "opacity-30 pointer-events-none" : ""}`}
          >
            {/* Identity Group */}
            {!foundPatientId ? (
              <>
                {/* REFERRAL SOURCE & TAGS */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                    <Share2 size={12} className="text-blue-500" /> Referral
                    Source <Required />
                  </Label>

                  <Input
                    required
                    placeholder="Friends..."
                    value={referralSource}
                    onChange={(e) => setReferralSource(e.target.value)}
                    readOnly={!!foundPatientId}
                    className="h-12 rounded-xl bg-zinc-50"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-7 gap-4 items-center justify-center">
                    <div className="md:col-span-3 space-y-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Last Name <Required />
                      </Label>
                      <Input
                        required
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        readOnly={!!foundPatientId}
                        className="h-12 rounded-xl bg-zinc-50"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        First Name <Required />
                      </Label>
                      <Input
                        required
                        placeholder="Jane"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        readOnly={!!foundPatientId}
                        className="h-12 rounded-xl bg-zinc-50"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Middle Name
                      </Label>
                      <Input
                        placeholder="D"
                        value={middleInitial}
                        onChange={(e) => setMiddleInitial(e.target.value)}
                        readOnly={!!foundPatientId}
                        className="h-12 rounded-xl bg-zinc-50 text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Contact Number <Required />
                  </Label>
                  <Input
                    required
                    placeholder="0912..."
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    readOnly={!!foundPatientId}
                    className="h-12 rounded-xl bg-zinc-50"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Email Address <Required />
                  </Label>
                  <Input
                    required
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!!foundPatientId || patientMode === "returning"}
                    className="h-12 rounded-xl bg-zinc-50"
                  />
                </div>

                {/* Restored Personal Details */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Civil Status <Required />
                  </Label>
                  <Select
                    value={civilStatus}
                    onValueChange={setCivilStatus}
                    disabled={!!foundPatientId}
                    required
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                      <SelectItem value="Separated">Separated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Occupation
                    <Required />
                  </Label>
                  <Input
                    placeholder="e.g. Accountant"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    readOnly={!!foundPatientId}
                    className="h-12 rounded-xl bg-zinc-50"
                    required
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Home Address <Required />
                  </Label>
                  <Input
                    placeholder="Unit #, Street, City, Province"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    readOnly={!!foundPatientId}
                    className="h-12 rounded-xl bg-zinc-50"
                    required
                  />
                </div>

                {/* Demographics Group */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Birthdate
                    <Required />
                  </Label>
                  <Input
                    required
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    readOnly={!!foundPatientId}
                    className="h-12 rounded-xl bg-zinc-50"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Gender <Required />
                  </Label>
                  <Select
                    value={gender}
                    onValueChange={setGender}
                    disabled={!!foundPatientId}
                    required
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clinical & Insurance */}
                <div className="md:col-span-2 pt-4 border-t border-zinc-100 flex items-center gap-2">
                  <Stethoscope size={16} className="text-emerald-500" />
                  <h4 className="text-xs font-black uppercase text-zinc-400">
                    Clinical Background <Required />
                  </h4>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Medical History (Comma Separated or N/A)
                  </Label>
                  <Input
                    placeholder="Allergies, Asthma, etc."
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    readOnly={!!foundPatientId}
                    className="h-12 rounded-xl bg-zinc-50"
                    required
                  />
                </div>

                {/* Emergency & Visit Reason */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Emergency Contact <Required />
                  </Label>
                  <Input
                    placeholder="Name"
                    value={emergencyToContact}
                    onChange={(e) => setEmergencyToContact(e.target.value)}
                    readOnly={!!foundPatientId}
                    className="h-12 rounded-xl bg-zinc-50 border-red-100"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Emergency Phone <Required />
                  </Label>
                  <Input
                    placeholder="0917..."
                    value={emergencyToContactNumber}
                    onChange={(e) =>
                      setEmergencyToContactNumber(e.target.value)
                    }
                    readOnly={!!foundPatientId}
                    className="h-12 rounded-xl bg-zinc-50 border-red-100"
                    required
                  />
                </div>
              </>
            ) : (
              /* 2. SHOW PRIVACY SUCCESS CARD IF PATIENT IS FOUND */
              <div className="md:col-span-2 bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-center gap-6 animate-in zoom-in-95 duration-300 mb-4">
                <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h4 className="font-black text-emerald-900 uppercase tracking-tight">
                    Existing Record Linked
                  </h4>
                  <p className="text-xs text-emerald-700 font-medium">
                    Personal and clinical data for{" "}
                    <span className="underline font-bold">
                      {lastName}, {firstName}
                    </span>{" "}
                    is hidden for privacy.
                  </p>
                </div>
              </div>
            )}

            {/* TERMS AND CONDITIONS SECTION */}
            <div className="space-y-3 w-full md:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                <ShieldAlert size={12} className="text-orange-500" /> Clinic
                Policy & Terms
              </Label>

              {/* THE ACTUAL TEXT BOX */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 overflow-y-auto max-h-32 text-[11px] text-zinc-600 leading-relaxed shadow-inner">
                <h5 className="font-bold mb-1 text-zinc-800 uppercase">
                  1. Appointment Policy
                </h5>
                <p>
                  Please arrive 15 minutes before your scheduled time. If you
                  are more than 10 minutes late, we will use the time to
                  accommodate other patients. You may choose to wait for the
                  next available slot the same day.
                </p>

                <h5 className="font-bold mt-2 mb-1 text-zinc-800 uppercase">
                  2. Cancellation Policy
                </h5>
                <p>
                  Cancellations must be made 24 hours in advance. Since
                  appointments are in high demand especially weekends, your
                  prompt cancellation will give another patient the opportunity
                  to access timely dental care.
                </p>

                <h5 className="font-bold mt-2 mb-1 text-zinc-800 uppercase">
                  3. Possible Delays
                </h5>
                <p>
                  We apologize for delays caused by patients with unexpected
                  complex or multiple problems. When booking, we can’t foresee
                  which patient will need more time than average. Please forgive
                  any delay. You may one day need extra time for your problems
                  or concerns.
                </p>

                <h5 className="font-bold mt-2 mb-1 text-zinc-800 uppercase">
                  4. Data Privacy
                </h5>
                <p>
                  Your medical and dental records are strictly confidential and
                  stored securely in compliance with local health data
                  regulations.
                </p>

                <h5 className="font-bold mt-2 mb-1 text-zinc-800 uppercase">
                  5. Payment
                </h5>
                <p>
                  Payment is expected when services are rendered. We accept:
                  Cash, Credit Cards & E-Transfers. Installment services may be
                  discussed in the office.
                </p>
              </div>

              {/* THE CHECKBOX */}
              <div className="flex items-start space-x-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="h-5 w-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-transform active:scale-90"
                  />
                </div>
                <div className="text-sm">
                  <label
                    htmlFor="terms"
                    className="font-bold text-zinc-700 cursor-pointer select-none"
                  >
                    I have read and agree to the Terms above.
                  </label>
                  <p className="text-emerald-600 text-[10px] uppercase font-black tracking-tight">
                    Consent is required to proceed
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Reason for Visit <Required />
              </Label>
              <Textarea
                placeholder="Note any specific dental concerns..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="rounded-xl bg-zinc-50 min-h-25"
                required
              />
            </div>

            {/* <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Tags / Labels
              </Label>
              <Input
                placeholder="e.g. Ortho, Urgent, VIP"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="h-12 rounded-xl bg-zinc-50"
              />
            </div> */}
          </div>

          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !selectedTime ||
              !agreedToTerms ||
              (patientMode === "returning" && !foundPatientId)
            }
            className="w-full py-8 text-xl font-black bg-yellow-400 hover:bg-emerald-600 text-white rounded-[2rem] shadow-2xl transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </Card>
      </div>
    </form>
  );
}
