"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Loader2, CheckCircle2 } from "lucide-react";

export default function InsuranceMarketplace() {
  const { data: session } = useSession();
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['insuranceMarketplace'],
    queryFn: async () => {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/insurance/list`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const plans = data?.plans || [];
  const [subscribingTo, setSubscribingTo] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setSubscribingTo(planId);
    try {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/insurance/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({ planId })
      });
      
      if (res.ok) {
        alert("Successfully subscribed to plan!");
        refetch();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || error.message}`);
      }
    } catch (e) {
      alert("Network error.");
    }
    setSubscribingTo(null);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Health Insurance Plans
          </h1>
          <p className="text-muted-foreground mt-1">Browse and subscribe to premium health coverage.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <h3 className="text-xl font-medium text-white mb-2">No Plans Available</h3>
          <p className="text-gray-400 mb-6">There are currently no active insurance plans on the platform.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan: any, i: number) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card flex flex-col rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-colors"
            >
              <div className="p-6 border-b border-border bg-black/20">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">₹{plan.price}</span>
                  <span className="text-gray-400">/mo</span>
                </div>
                <p className="text-sm text-primary font-medium mt-2">By {plan.provider.companyName}</p>
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="mb-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <h4 className="text-sm font-semibold text-white mb-1">Provider Info</h4>
                    <p className="text-xs text-gray-400">{plan.provider.bio || "No description provided."}</p>
                    <div className="mt-3 flex flex-col gap-1 text-xs text-primary">
                      {plan.provider.adminName && <span>Admin: {plan.provider.adminName}</span>}
                      {plan.provider.supportContact && <span>Support: {plan.provider.supportContact}</span>}
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-6">{plan.description || "Comprehensive coverage for your family."}</p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2 text-sm text-gray-400">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>Instant Digital Policy Activation</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-400">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>Network of 1000+ Hospitals</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-400">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>24/7 Priority Support</span>
                    </li>
                  </ul>
                </div>

                {plan.isSubscribed ? (
                  <button
                    disabled
                    className="w-full bg-green-500/20 text-green-400 font-medium py-3 rounded-lg flex items-center justify-center gap-2 cursor-default"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Subscribed
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribingTo === plan.id}
                    className="w-full bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {subscribingTo === plan.id ? <Loader2 className="w-5 h-5 animate-spin" /> : "Subscribe Now"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
