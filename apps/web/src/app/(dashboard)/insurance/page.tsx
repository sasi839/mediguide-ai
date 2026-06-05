"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, FileText, Users, DollarSign, Plus, X, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

export default function InsuranceDashboard() {
  const { data: session } = useSession();

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['insuranceStats'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/insurance/stats', {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const { data: plansData, refetch: refetchPlans } = useQuery({
    queryKey: ['insurancePlans'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/insurance/plans', {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const { data: profileData, refetch: refetchProfile } = useQuery({
    queryKey: ['insuranceProfile'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/insurance/profile', {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const [activeTab, setActiveTab] = useState("policies");
  const [profileForm, setProfileForm] = useState({ adminName: "", adminAge: "", bio: "", supportContact: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (profileData?.provider) {
      setProfileForm({
        adminName: profileData.provider.adminName || "",
        adminAge: profileData.provider.adminAge?.toString() || "",
        bio: profileData.provider.bio || "",
        supportContact: profileData.provider.supportContact || ""
      });
    }
  }, [profileData]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch('http://localhost:4000/api/insurance/profile', {
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", price: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [managePlan, setManagePlan] = useState<any>(null);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:4000/api/insurance/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await refetchPlans();
        setIsModalOpen(false);
        setFormData({ name: "", price: "", description: "" });
      } else {
        const data = await res.json();
        alert("Error: " + data.message);
      }
    } catch (e) {
      alert("Network error.");
    }
    setIsSubmitting(false);
  };

  const policies = plansData?.plans || [];
  const stats = statsData || { activePolicies: 0, newLeads: 0, claimsProcessing: 0, monthlyRevenue: 0 };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Insurance Provider Portal
          </h1>
          <p className="text-muted-foreground mt-1">Manage your health plans, policies, and subscriber leads</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Create New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Active Policies", value: stats.activePolicies.toString(), icon: Shield, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "New Leads", value: stats.newLeads.toString(), icon: Users, color: "text-orange-400", bg: "bg-orange-500/10" },
          { label: "Claims Processing", value: stats.claimsProcessing.toString(), icon: FileText, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Monthly Revenue", value: `₹${stats.monthlyRevenue}`, icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10" }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl border border-border">
            <div className={`p-3 w-fit rounded-xl mb-4 ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            {isLoadingStats ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary mb-1" />
            ) : (
              <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
            )}
            <p className="text-sm text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border mt-8">
        <button onClick={() => setActiveTab("policies")} className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'policies' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Policies</button>
        <button onClick={() => setActiveTab("profile")} className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'profile' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Admin Profile</button>
      </div>

      {/* Policies Table */}
      {activeTab === "policies" && (
      <div className="bg-card border border-border rounded-xl overflow-hidden mt-8">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-white">Your Listed Plans</h3>
        </div>
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-muted text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-300">Plan Name</th>
              <th className="px-6 py-4 font-medium text-gray-300">Total Subscribers</th>
              <th className="px-6 py-4 font-medium text-gray-300">Price</th>
              <th className="px-6 py-4 font-medium text-gray-300">Status</th>
              <th className="px-6 py-4 font-medium text-gray-300">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {policies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No plans created yet. Click "Create New Plan" to get started.
                </td>
              </tr>
            ) : (
              policies.map((policy: any, i: number) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={policy.id} 
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4 text-white font-medium">{policy.name}</td>
                  <td className="px-6 py-4">{policy.totalSubscribers} active</td>
                  <td className="px-6 py-4">₹{policy.price}/mo</td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full w-fit">
                      {policy.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setManagePlan(policy)}
                      className="text-primary hover:underline font-medium"
                    >
                      Manage
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      {activeTab === "profile" && (
        <form onSubmit={handleProfileSave} className="space-y-6 max-w-2xl mt-8 glass-card p-6 rounded-2xl border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Admin Name</label>
              <input
                type="text"
                required
                value={profileForm.adminName}
                onChange={(e) => setProfileForm({ ...profileForm, adminName: e.target.value })}
                className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Admin Age</label>
              <input
                type="number"
                min="1"
                required
                value={profileForm.adminAge}
                onChange={(e) => setProfileForm({ ...profileForm, adminAge: e.target.value })}
                className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-300">Bio / About Us</label>
              <textarea
                rows={3}
                required
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="Brief description of your insurance services..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-300">Support Contact</label>
              <input
                type="text"
                required
                value={profileForm.supportContact}
                onChange={(e) => setProfileForm({ ...profileForm, supportContact: e.target.value })}
                className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. support@company.com or 1-800-XXX-XXXX"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSavingProfile}
            className="bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            Save Details
          </button>
        </form>
      )}

      {/* Create Plan Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Create New Plan</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g. Premium Health Shield"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Monthly Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g. 199.99"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="What does this plan cover?"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-lg border border-border text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Plan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Plan Modal */}
      <AnimatePresence>
        {managePlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-2xl rounded-2xl border border-border p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Manage Plan: {managePlan.name}</h2>
                  <p className="text-sm text-gray-400 mt-1">{managePlan.totalSubscribers} Total Subscribers</p>
                </div>
                <button onClick={() => setManagePlan(null)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-black/20 rounded-xl border border-border overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-muted text-xs uppercase sticky top-0">
                    <tr>
                      <th className="px-6 py-3 font-medium text-gray-300">Patient Email</th>
                      <th className="px-6 py-3 font-medium text-gray-300">Joined Date</th>
                      <th className="px-6 py-3 font-medium text-gray-300">Next Pay Date</th>
                      <th className="px-6 py-3 font-medium text-gray-300 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {managePlan.subscribers?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No patients enrolled yet.
                        </td>
                      </tr>
                    ) : (
                      managePlan.subscribers?.map((sub: any) => {
                        const joined = new Date(sub.createdAt);
                        const nextPay = new Date(joined.getTime());
                        nextPay.setMonth(joined.getMonth() + 1); // exactly 1 month gap
                        const isPaid = new Date() < nextPay; // If today is before next pay date, they are paid up for this month
                        
                        return (
                          <tr key={sub.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 text-white">{sub.patient?.email}</td>
                            <td className="px-6 py-4">{joined.toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-orange-400">{nextPay.toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right">
                              {isPaid ? (
                                <span className="text-xs bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded-full whitespace-nowrap">
                                  Paid (This Month)
                                </span>
                              ) : (
                                <span className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full whitespace-nowrap">
                                  Payment Due
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
