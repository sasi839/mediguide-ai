"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Loader2, Save, Phone, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

export default function PatientProfile() {
  const { data: session } = useSession();
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['familyProfiles'],
    queryFn: async () => {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/family`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const [formData, setFormData] = useState({ age: "", gender: "Male", mobileNumber: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [primaryProfile, setPrimaryProfile] = useState<any>(null);

  useEffect(() => {
    if (data?.profiles && data.profiles.length > 0) {
      // Find the primary profile (could be the first one created by the user)
      const profile = data.profiles[0];
      setPrimaryProfile(profile);
      setFormData({
        age: profile.age?.toString() || "",
        gender: profile.gender || "Male",
        mobileNumber: profile.mobileNumber || ""
      });
    }
  }, [data]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryProfile) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/family/${primaryProfile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({
          age: parseInt(formData.age),
          gender: formData.gender,
          mobileNumber: formData.mobileNumber
        })
      });
      
      if (res.ok) {
        alert("Profile updated successfully!");
        refetch();
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!primaryProfile) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="bg-card p-8 rounded-2xl border border-border">
          <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No Profile Found</h3>
          <p className="text-gray-400">Please create a family profile first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <User className="w-8 h-8 text-primary" />
          About Me
        </h1>
        <p className="text-muted-foreground mt-1">Manage your personal health details</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 rounded-2xl border border-border"
      >
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold border-2 border-primary/50">
            {primaryProfile.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{primaryProfile.name}</h2>
            <p className="text-gray-400 flex items-center gap-2 mt-1">
              <Phone className="w-4 h-4" />
              {primaryProfile.mobileNumber || "No mobile number added"}
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Age (yrs)</label>
              <input
                type="number"
                required
                min="1"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full bg-input border border-border rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-input border border-border rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-300">Mobile Number</label>
              <input
                type="tel"
                placeholder="+1 234 567 8900"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                className="w-full bg-input border border-border rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
