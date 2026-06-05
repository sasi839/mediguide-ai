"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, ShieldAlert, Loader2, X, Copy, UserPlus, Home } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

export default function FamilyDashboard() {
  const { data: session } = useSession();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", age: "", gender: "Male", bloodGroup: "", mobileNumber: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [joinCode, setJoinCode] = useState("");
  const [groupName, setGroupName] = useState("");

  const { data: groupData, refetch: refetchGroup } = useQuery({
    queryKey: ['familyGroup'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/family/group', {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['familyProfiles'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/family', {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const profiles = data?.profiles || [];

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:4000/api/family', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({ name: "", age: "", gender: "Male", bloodGroup: "", mobileNumber: "" });
        refetch();
      } else {
        alert("Failed to add member");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:4000/api/family/group/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(session as any)?.accessToken}` },
        body: JSON.stringify({ name: groupName })
      });
      if (res.ok) {
        await refetchGroup();
        await refetch();
      } else {
        const data = await res.json();
        alert("Error: " + (data.message || "Failed to create group"));
      }
    } catch (e) {
      console.error(e);
      alert("Network error while creating group.");
    }
    setIsSubmitting(false);
  };

  const handleJoinGroup = async () => {
    if (!joinCode) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:4000/api/family/group/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(session as any)?.accessToken}` },
        body: JSON.stringify({ inviteCode: joinCode })
      });
      if (res.ok) {
        await refetchGroup();
        await refetch();
      } else {
        const data = await res.json();
        alert("Error: " + (data.message || "Invalid Invite Code"));
      }
    } catch (e) {
      console.error(e);
      alert("Network error while joining group.");
    }
    setIsSubmitting(false);
  };

  const group = groupData?.group;

  if (!group) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-8 flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Set Up Your Family Group</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <motion.div className="glass-card p-8 rounded-2xl border border-border flex flex-col items-center text-center">
            <Home className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">Create New Family</h2>
            <p className="text-gray-400 mb-6 text-sm">Create a new family group and invite members via a unique code.</p>
            <input 
              type="text" 
              placeholder="Family Name (e.g. Smith Family)" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary mb-4"
            />
            <button onClick={handleCreateGroup} disabled={isSubmitting} className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create Family"}
            </button>
          </motion.div>

          <motion.div className="glass-card p-8 rounded-2xl border border-border flex flex-col items-center text-center">
            <UserPlus className="w-12 h-12 text-purple-500 mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">Join Existing Family</h2>
            <p className="text-gray-400 mb-6 text-sm">Enter the 6-character invite code provided by your family admin.</p>
            <input 
              type="text" 
              placeholder="Enter Invite Code" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-purple-500 mb-4 uppercase tracking-widest text-center"
              maxLength={6}
            />
            <button onClick={handleJoinGroup} disabled={isSubmitting} className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 rounded-lg transition-colors">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Join Family"}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            {group.name}
          </h1>
          <p className="text-muted-foreground mt-1">Manage your family's health profiles and members</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-lg flex items-center gap-3">
            <div className="text-sm">
              <span className="text-gray-400">Invite Code: </span>
              <span className="font-mono font-bold text-primary tracking-widest">{group.inviteCode}</span>
            </div>
            <button onClick={() => navigator.clipboard.writeText(group.inviteCode)} className="text-primary hover:text-white transition-colors" title="Copy Code">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors h-full"
          >
            <Plus className="w-4 h-4" />
            Add Profile
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <h3 className="text-xl font-medium text-white mb-2">No Profiles Found</h3>
          <p className="text-gray-400 mb-6">Create a primary profile to get started.</p>
        </div>
      ) : (

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile: any, i: number) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={profile.id}
            className="glass-card p-6 rounded-2xl border border-border hover:border-primary/50 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{profile.name}</h3>
                <span className="text-sm text-primary">Family Member • {profile.age > 0 ? profile.age : "<1"} yrs</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {profile.name.charAt(0)}
              </div>
            </div>
            
            <div className="space-y-3 mt-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Prescriptions</span>
                <span className="text-white font-medium">{profile._count?.prescriptions || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Medical Records</span>
                <span className="text-white font-medium">{profile._count?.medicalRecords || 0}</span>
              </div>
            </div>

            <button className="w-full mt-6 flex items-center justify-center gap-2 text-sm text-destructive hover:bg-destructive/10 py-2 rounded-lg transition-colors">
              <ShieldAlert className="w-4 h-4" />
              Emergency Card
            </button>
          </motion.div>
        ))}
      </div>
      )}

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Add Family Member</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Age</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Blood Group (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. O+"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Mobile Number (Optional)</label>
                    <input
                      type="tel"
                      placeholder="e.g. +1 234 567 890"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                      className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-2.5 rounded-lg border border-border text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Member"}
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
