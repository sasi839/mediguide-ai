"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Loader2, Save, Trash2, Calendar, CheckCircle2, XCircle, User } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DoctorDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("requests");
  const [isActioning, setIsActioning] = useState<string | null>(null);
  
  const { data: profileData, refetch: refetchProfile } = useQuery({
    queryKey: ['doctorProfile'],
    queryFn: async () => {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/doctor/profile`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const [profileForm, setProfileForm] = useState({ name: "", age: "", qualifications: "", nearestLocation: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (profileData?.doctor) {
      setProfileForm({
        name: profileData.doctor.name || "",
        age: profileData.doctor.age?.toString() || "",
        qualifications: profileData.doctor.qualifications || "",
        nearestLocation: profileData.doctor.nearestLocation || ""
      });
    }
  }, [profileData]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/doctor/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        alert("Profile updated successfully!");
        refetchProfile();
      } else {
        alert("Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
    }
    setIsSavingProfile(false);
  };
  
  const { data: availabilityData, isLoading: isLoadingAvailability, refetch: refetchAvailability } = useQuery({
    queryKey: ['doctorAvailability'],
    queryFn: async () => {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/doctor/availability`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const { data: appointmentsData, isLoading: isLoadingAppointments, refetch: refetchAppointments } = useQuery({
    queryKey: ['doctorAppointments'],
    queryFn: async () => {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/doctor/appointments`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const appointments = appointmentsData?.appointments || [];
  const pendingRequests = appointments.filter((a: any) => a.status === 'PENDING');
  const upcomingSessions = appointments.filter((a: any) => a.status === 'CONFIRMED');

  const [timings, setTimings] = useState<{dayOfWeek: number, startTime: string, endTime: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when data loads
  useState(() => {
    if (availabilityData?.availability) {
      setTimings(availabilityData.availability);
    }
  });

  const handleAddSlot = (dayOfWeek: number) => {
    setTimings([...timings, { dayOfWeek, startTime: "09:00", endTime: "17:00" }]);
  };

  const handleRemoveSlot = (index: number) => {
    setTimings(timings.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index: number, field: string, value: string) => {
    const newTimings = [...timings];
    newTimings[index] = { ...newTimings[index], [field]: value };
    setTimings(newTimings);
  };

  const saveAvailability = async () => {
    setIsSaving(true);
    await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/doctor/availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(session as any)?.accessToken}`
      },
      body: JSON.stringify({ availability: timings })
    });
    refetchAvailability();
    setIsSaving(false);
  };

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    setIsActioning(id);
    try {
      const endpoint = action === 'accept' ? 'accept' : 'status';
      const body = action === 'accept' ? undefined : JSON.stringify({ status: 'REJECTED' });

      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/doctor/appointments/${id}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body
      });
      if (res.ok) await refetchAppointments();
    } catch (e) {
      console.error(e);
    }
    setIsActioning(null);
  };

  if (isLoadingAvailability || isLoadingAppointments) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            Doctor Portal
          </h1>
          <p className="text-muted-foreground mt-1">Manage your weekly availability and upcoming appointments.</p>
        </div>
        <button 
          onClick={saveAvailability}
          disabled={isSaving}
          className="bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Timings
        </button>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-border">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Weekly Session Availability
        </h2>

        <div className="space-y-6">
          {DAYS.map((day, dayIndex) => {
            const daySlots = timings.filter(t => t.dayOfWeek === dayIndex);
            
            return (
              <div key={day} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl bg-black/20 border border-border/50">
                <div className="w-32">
                  <span className="text-white font-medium">{day}</span>
                </div>
                
                <div className="flex-1 space-y-3">
                  {daySlots.length === 0 ? (
                    <span className="text-gray-500 text-sm italic">Off Day</span>
                  ) : (
                    daySlots.map((slot, index) => {
                      const globalIndex = timings.findIndex(t => t === slot);
                      return (
                        <div key={globalIndex} className="flex items-center gap-3">
                          <input 
                            type="time" 
                            value={slot.startTime}
                            onChange={e => handleSlotChange(globalIndex, "startTime", e.target.value)}
                            className="bg-input border border-border rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary"
                          />
                          <span className="text-gray-400">to</span>
                          <input 
                            type="time" 
                            value={slot.endTime}
                            onChange={e => handleSlotChange(globalIndex, "endTime", e.target.value)}
                            className="bg-input border border-border rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary"
                          />
                          <button onClick={() => handleRemoveSlot(globalIndex)} className="text-gray-400 hover:text-destructive p-1 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
                
                <button 
                  onClick={() => handleAddSlot(dayIndex)}
                  className="text-sm text-primary hover:text-white transition-colors"
                >
                  + Add Slot
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-border mt-8">
        <div className="flex gap-4 mb-6 border-b border-border pb-4 overflow-x-auto">
          <button onClick={() => setActiveTab("requests")} className={`font-medium whitespace-nowrap ${activeTab === "requests" ? "text-primary" : "text-gray-500"}`}>Requests</button>
          <button onClick={() => setActiveTab("sessions")} className={`font-medium whitespace-nowrap ${activeTab === "sessions" ? "text-primary" : "text-gray-500"}`}>Upcoming Sessions</button>
          <button onClick={() => setActiveTab("profile")} className={`font-medium whitespace-nowrap ${activeTab === "profile" ? "text-primary" : "text-gray-500"}`}>About Me</button>
        </div>

        {activeTab === "profile" ? (
          <form onSubmit={handleProfileSave} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Age</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={profileForm.age}
                  onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-300">Qualifications</label>
                <input
                  type="text"
                  required
                  value={profileForm.qualifications}
                  onChange={(e) => setProfileForm({ ...profileForm, qualifications: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. MBBS, MD (Cardiology)"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-300">Nearest Location for Patients</label>
                <input
                  type="text"
                  required
                  value={profileForm.nearestLocation}
                  onChange={(e) => setProfileForm({ ...profileForm, nearestLocation: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Apollo Hospital, Jubilee Hills"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSavingProfile}
              className="bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Details
            </button>
          </form>
        ) : activeTab === "requests" ? (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
               <p className="text-gray-400 text-center py-10">No pending appointment requests.</p>
            ) : pendingRequests.map((req: any, i: number) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={req.id}
                className="glass-card p-6 rounded-2xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{req.profile?.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {req.profile?.age} yrs • {req.notes || "No specific notes provided"}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-sm text-primary font-medium bg-primary/10 w-fit px-3 py-1 rounded-full">
                      <Clock className="w-4 h-4" /> {new Date(req.scheduledAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => handleAction(req.id, 'accept')}
                    disabled={isActioning === req.id}
                    className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                  >
                    {isActioning === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Accept
                  </button>
                  <button 
                    onClick={() => handleAction(req.id, 'reject')}
                    disabled={isActioning === req.id}
                    className="flex-1 md:flex-none bg-destructive/10 hover:bg-destructive/20 disabled:opacity-50 text-destructive px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingSessions.length === 0 ? (
               <p className="text-gray-400 text-center py-10 col-span-full">No accepted sessions for this week.</p>
            ) : upcomingSessions.map((session: any, i: number) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={session.id}
                className="glass-card p-6 rounded-2xl border border-border"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{session.profile?.name}</h3>
                      <p className="text-sm text-gray-400">{session.profile?.age} yrs</p>
                    </div>
                  </div>
                  <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
                    Confirmed
                  </span>
                </div>
                <div className="space-y-3 mt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Date</span>
                    <span className="text-white font-medium">{new Date(session.scheduledAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Time</span>
                    <span className="text-white font-medium">{new Date(session.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
                <button className="w-full mt-6 bg-primary/10 hover:bg-primary/20 text-primary py-2.5 rounded-lg transition-colors font-medium text-sm">
                  Join Session
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
