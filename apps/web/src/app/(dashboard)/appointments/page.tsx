"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Star, Loader2, X, Clock } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AppointmentsDashboard() {
  const { data: session } = useSession();
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['doctorList'],
    queryFn: async () => {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/doctor/list`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const { data: myAppointmentsData } = useQuery({
    queryKey: ['myAppointments'],
    queryFn: async () => {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/doctor/my-appointments`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const { data: familyData } = useQuery({
    queryKey: ['familyProfiles'],
    queryFn: async () => {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/family`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const doctors = data?.doctors || [];
  const profiles = familyData?.profiles || [];
  const myAppointments = myAppointmentsData?.appointments || [];

  const [activeTab, setActiveTab] = useState("book");
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking Form State
  const [bookingData, setBookingData] = useState({ profileId: "", date: "", time: "", notes: "" });

  // Rating Form State
  const [ratingData, setRatingData] = useState({ rating: "5", review: "" });

  const openBooking = (doc: any) => {
    setSelectedDoctor(doc);
    setBookingData({ profileId: profiles[0]?.id || "", date: "", time: "", notes: "" });
    setIsBookingModalOpen(true);
  };

  const openRating = (doc: any) => {
    setSelectedDoctor(doc);
    setRatingData({ rating: "5", review: "" });
    setIsRatingModalOpen(true);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Combine date and time
    const scheduledAt = new Date(`${bookingData.date}T${bookingData.time}`);

    await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/doctor/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(session as any)?.accessToken}`
      },
      body: JSON.stringify({
        doctorId: selectedDoctor.id,
        profileId: bookingData.profileId,
        scheduledAt: scheduledAt.toISOString(),
        notes: bookingData.notes
      })
    });
    
    await refetch();
    setIsBookingModalOpen(false);
    setIsSubmitting(false);
    alert("Appointment booked successfully!");
  };

  const handleRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/doctor/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(session as any)?.accessToken}`
      },
      body: JSON.stringify({
        doctorId: selectedDoctor.id,
        rating: ratingData.rating,
        review: ratingData.review
      })
    });
    
    refetch();
    setIsRatingModalOpen(false);
    setIsSubmitting(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-primary" />
            Book an Appointment
          </h1>
          <p className="text-muted-foreground mt-1">Find a specialist and schedule a visit.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-border">
        <button 
          onClick={() => setActiveTab('book')}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'book' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <CalendarIcon className="w-4 h-4 inline-block mr-2 mb-0.5" />
          Find Doctors
        </button>
        <button 
          onClick={() => setActiveTab('my-appointments')}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'my-appointments' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <Clock className="w-4 h-4 inline-block mr-2 mb-0.5" />
          My Bookings
        </button>
      </div>

      {activeTab === 'my-appointments' && (
        <div className="space-y-4">
          {myAppointments.length === 0 ? (
             <div className="text-center py-20 bg-card rounded-2xl border border-border">
               <h3 className="text-xl font-medium text-white mb-2">No Bookings Yet</h3>
               <p className="text-gray-400 mb-6">You haven't booked any appointments yet.</p>
             </div>
          ) : (
            myAppointments.map((apt: any) => (
              <div key={apt.id} className="glass-card p-6 rounded-2xl border border-border flex flex-col md:flex-row justify-between gap-4 items-center">
                <div>
                  <h3 className="text-white font-medium text-lg">Dr. {apt.doctor.user.email.split('@')[0]}</h3>
                  <p className="text-sm text-gray-400 mt-1">{new Date(apt.scheduledAt).toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">Patient: {apt.profile.name}</p>
                </div>
                <div className="md:text-right">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-medium ${
                    apt.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-500' :
                    apt.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                    'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'book' && (
      <>
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <h3 className="text-xl font-medium text-white mb-2">No Doctors Available</h3>
          <p className="text-gray-400 mb-6">There are currently no doctors registered on the platform.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {doctors.map((doc: any) => {
            const avgRating = doc.ratings.length 
              ? (doc.ratings.reduce((acc: any, curr: any) => acc + curr.rating, 0) / doc.ratings.length).toFixed(1) 
              : "New";
            
            const existingAppt = myAppointments.find((a: any) => a.doctorId === doc.id);

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl border border-border hover:border-primary/50 transition-colors flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Dr. {doc.name || doc.user.email.split('@')[0]}
                      {doc.age ? <span className="text-sm font-normal text-gray-400 ml-2">({doc.age} yrs)</span> : null}
                    </h3>
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-sm text-primary font-medium">{doc.specialty}</span>
                      {doc.qualifications && <span className="text-xs text-gray-400">{doc.qualifications}</span>}
                      {doc.nearestLocation && <span className="text-xs text-gray-400">📍 {doc.nearestLocation}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-md text-sm font-medium">
                    <Star className="w-4 h-4 fill-current" />
                    {avgRating}
                  </div>
                </div>

                <p className="text-sm text-gray-400 mb-4 flex-1 line-clamp-2">
                  {doc.bio || "No bio available."}
                </p>

                <div className="space-y-2 mb-6">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</h4>
                  {doc.availability.length === 0 ? (
                    <span className="text-sm text-gray-400 italic">No timings set</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {doc.availability.slice(0,3).map((a: any) => (
                        <span key={a.id} className="text-xs bg-white/5 border border-border px-2 py-1 rounded text-gray-300">
                          {DAYS[a.dayOfWeek].substring(0,3)}: {a.startTime}
                        </span>
                      ))}
                      {doc.availability.length > 3 && (
                        <span className="text-xs bg-white/5 border border-border px-2 py-1 rounded text-gray-300">+{doc.availability.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-auto">
                  {existingAppt ? (
                    <button 
                      disabled
                      className={`flex-1 font-medium py-2 rounded-lg transition-colors text-sm cursor-default ${
                        existingAppt.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' :
                        existingAppt.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {existingAppt.status === 'CONFIRMED' ? 'Success' :
                       existingAppt.status === 'PENDING' ? 'Pending...' : 'Rejected'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => openBooking(doc)}
                      className="flex-1 bg-primary hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                    >
                      Book Visit
                    </button>
                  )}
                  <button 
                    onClick={() => openRating(doc)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-lg transition-colors text-sm border border-border"
                  >
                    Leave Rating
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Book Appointment</h2>
                <button onClick={() => setIsBookingModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
                <h3 className="text-white font-medium">Dr. {selectedDoctor.user.email.split('@')[0]}</h3>
                <p className="text-sm text-primary">{selectedDoctor.specialty}</p>
              </div>

              <form onSubmit={handleBook} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Select Patient Profile</label>
                  <select
                    required
                    value={bookingData.profileId}
                    onChange={(e) => setBookingData({ ...bookingData, profileId: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                  >
                    {profiles.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Date</label>
                    <input
                      type="date"
                      required
                      value={bookingData.date}
                      onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                      className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Time</label>
                    <input
                      type="time"
                      required
                      value={bookingData.time}
                      onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                      className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Notes for the Doctor</label>
                  <textarea
                    rows={3}
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Briefly describe your symptoms or reason for visit..."
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="flex-1 py-2.5 rounded-lg border border-border text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Booking"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {isRatingModalOpen && selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Rate Doctor</h2>
                <button onClick={() => setIsRatingModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6 text-center">
                <h3 className="text-white font-medium text-lg">Dr. {selectedDoctor.user.email.split('@')[0]}</h3>
                <p className="text-sm text-gray-400">How was your experience?</p>
              </div>

              <form onSubmit={handleRate} className="space-y-4">
                <div className="space-y-2 text-center">
                  <div className="flex justify-center gap-2 mb-4">
                    {[1,2,3,4,5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRatingData({ ...ratingData, rating: star.toString() })}
                        className={`p-2 transition-colors ${parseInt(ratingData.rating) >= star ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-500/50'}`}
                      >
                        <Star className={`w-8 h-8 ${parseInt(ratingData.rating) >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Written Review (Optional)</label>
                  <textarea
                    rows={4}
                    value={ratingData.review}
                    onChange={(e) => setRatingData({ ...ratingData, review: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Share details of your experience..."
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRatingModalOpen(false)}
                    className="flex-1 py-2.5 rounded-lg border border-border text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Review"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
