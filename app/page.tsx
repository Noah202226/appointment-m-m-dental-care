"use client";

import * as React from "react";
import {
  Clock,
  User,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Search,
  UserPlus,
  UserCheck,
  Upload,
  FileText,
  Shield,
} from "lucide-react";
import { format, isBefore, startOfDay, parse, isSameDay } from "date-fns";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { databases, storage, ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { playSound } from "@/lib/sound";
import Header from "./components/header";
import SuccessView from "./components/SuccessView";
import TrustSignal from "./components/TrustSignal";
import { AppointmentForm } from "./components/AppointmentForm";

const DB = process.env.NEXT_PUBLIC_DATABASE_ID!;
const BOOKINGS = "appointments";
const SCHEDULES = "clinic_schedules";
const PATIENTS = "patients";
const STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_STORAGE_BUCKET_ID!;

const medicalConditions = [
  "High blood pressure",
  "Diabetes",
  "Osteoporosis",
  "Herpes/ Cold sores",
  "Radiation treatments",
  "Chemotherapy",
  "Artificial heart valves",
  "Heart attack",
  "Pacemakers",
  "Angioplasty with stent",
  "Stroke",
  "Angina pectoris (chest pain)",
  "Frequent high fever",
  "Sinusitis",
  "Emphysema",
  "Asthma",
  "Breathing Problems",
  "Afternoon fever",
  "Chronic cough",
  "Bloody Sputum",
  "Tuberculosis",
  "Frequent headaches/ Dizziness",
  "Visual impairment",
  "Hearing impairment",
  "Arthritis",
  "Pain in joints",
  "Tremors",
  "Swollen ankles",
  "Goiter",
  "Frequent thirst",
  "Frequent hunger",
  "Frequent urination",
  "Sudden weight loss",
  "Abdominal discomfort",
  "Acidic Reflux",
  "Bleeding or bruising easily",
  "Recreational Drugs",
  "Steroid therapy",
  "Blood / pus in the urine",
  "Pain upon urination",
  "Kidney / liver problems",
  "Hepatitis (A, B, C, D)",
  "HIV positive",
  "Sexually transmitted Disease",
  "Fainting spells",
  "Depression",
];

export default function PublicAppointmentForm() {
  const [bookedSlots, setBookedSlots] = React.useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [now, setNow] = React.useState(new Date());

  // Patient Lookup States
  const [patientMode, setPatientMode] = React.useState<"new" | "returning">(
    "new",
  );
  const [isSearchingPatient, setIsSearchingPatient] = React.useState(false);
  const [foundPatientId, setFoundPatientId] = React.useState<string | null>(
    null,
  );

  const [operatingHours, setOperatingHours] = React.useState<{
    open: string;
    close: string;
    active: boolean;
    name?: string;
  } | null>(null);

  const [isLoadingHours, setIsLoadingHours] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date(),
  );
  const [selectedTime, setSelectedTime] = React.useState<string | undefined>();

  // Form States
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [note, setNote] = React.useState("");
  const [referralSource, setReferralSource] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [medicalHistory, setMedicalHistory] = React.useState<string[]>([]);
  const [insuranceCompany, setInsuranceCompany] = React.useState("");
  const [insurancePolicyNo, setInsurancePolicyNo] = React.useState("");
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);

  function LiveClock() {
    const [time, setTime] = React.useState(new Date());

    React.useEffect(() => {
      const timer = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    return (
      <div className="bg-zinc-900 p-6 rounded-[2rem] text-center text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
          <Clock size={80} />
        </div>
        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
          Clinic Time
        </p>
        <h2 className="text-4xl font-mono font-black" suppressHydrationWarning>
          {format(time, "HH:mm:ss")}
        </h2>
        <p className="text-zinc-400 text-xs mt-2 font-bold">
          {format(time, "EEEE, MMMM do")}
        </p>
      </div>
    );
  }

  if (success) return <SuccessView name={name} />;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col xl:flex-row font-sans selection:bg-emerald-100">
      <main className="flex-1 p-4 lg:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          <Header />
          <AppointmentForm onSuccess={(name) => setSuccess(true)} />
        </div>
      </main>
      <aside className="hidden xl:flex w-96 bg-white border-l border-zinc-200 flex-col p-8 sticky top-0 h-screen shadow-2xl overflow-y-auto">
        <div className="space-y-8">
          <LiveClock />
          <div className="space-y-4">
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
              Appointment Summary
            </h4>
            {selectedTime ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-emerald-50 border-2 border-emerald-100 p-6 rounded-3xl">
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1">
                    Confirmed Slot
                  </p>
                  <h3 className="text-lg font-black text-zinc-800">
                    {format(selectedDate!, "MMM dd, yyyy")}
                  </h3>
                  <p className="text-3xl font-black text-emerald-600">
                    {selectedTime}
                  </p>
                </div>
                <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-3xl space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase">
                      Patient
                    </p>
                    <p className="font-bold text-zinc-700 truncate">
                      {name || "Waiting for name..."}
                    </p>
                    {foundPatientId && (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                        EXISTING RECORD
                      </span>
                    )}
                  </div>
                  {phone && (
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase">
                        Contact
                      </p>
                      <p className="font-bold text-zinc-700">{phone}</p>
                    </div>
                  )}
                  {email && (
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase">
                        Email
                      </p>
                      <p className="font-bold text-zinc-700">{email}</p>
                    </div>
                  )}
                  {note && (
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase">
                        Reason for Visit
                      </p>
                      <p className="font-bold text-zinc-700">{note}</p>
                    </div>
                  )}
                  {referralSource && (
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase">
                        Referral Source
                      </p>
                      <p className="font-bold text-zinc-700">
                        {referralSource}
                      </p>
                    </div>
                  )}
                  {tags && (
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase">
                        Tags
                      </p>
                      <p className="font-bold text-zinc-700">{tags}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 border-2 border-dashed border-zinc-100 rounded-[2rem] text-center">
                <CalendarIcon className="mx-auto h-10 w-10 text-zinc-100 mb-2" />
                <p className="text-xs text-zinc-300 font-bold px-8">
                  Select a date and time to see your summary
                </p>
              </div>
            )}
          </div>
          <div className="pt-8 border-t border-zinc-100 space-y-6">
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
              Clinic Standards
            </h4>
            <TrustSignal
              icon={<CheckCircle className="text-yellow-400" />}
              title="Personalized, Honest Dental Care"
              desc="Every appointment is tailored to you."
            />
            <TrustSignal
              icon={<CheckCircle className="text-yellow-400" />}
              title="Comfort, Cleanliness and Safety First"
              desc="We use modern techniques."
            />
            <TrustSignal
              icon={<CheckCircle className="text-yellow-400" />}
              title="Internationally Updated Expertise"
              desc="Actively pursues continuing education and advanced training  from different parts of the world."
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
