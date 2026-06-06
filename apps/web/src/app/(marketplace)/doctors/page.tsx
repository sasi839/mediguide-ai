"use client";

import { motion } from "framer-motion";
import { Search, Stethoscope, Star, MapPin, Calendar, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export default function DoctorMarketplace() {
  const { data: session } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/marketplace/doctors`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const doctors = data?.doctors || [];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-primary" />
          Find a Doctor
        </h1>
        <p className="text-muted-foreground mt-1">Book appointments with verified healthcare professionals</p>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-4 border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or specialty..." 
            className="w-full bg-input border border-border rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="relative w-full md:w-64">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Location" 
            className="w-full bg-input border border-border rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <button className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors">
          Search
        </button>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <h3 className="text-xl font-medium text-white mb-2">No Doctors Found</h3>
          <p className="text-gray-400 mb-6">There are currently no verified doctors in the marketplace.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {doctors.map((doc: any, i: number) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={doc.id}
            className="bg-card border border-border hover:border-primary/50 transition-colors rounded-2xl p-6 flex flex-col sm:flex-row gap-6"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Stethoscope className="w-10 h-10 text-primary" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl font-semibold text-white">{doc.user?.name || "Dr. " + doc.id.substring(0, 4)}</h3>
                <p className="text-primary text-sm">{doc.specialty}</p>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> 4.9</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Remote</span>
              </div>
              
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm flex items-center gap-2 text-green-400">
                  <Calendar className="w-4 h-4" /> {doc.available}
                </span>
                <button className="bg-secondary hover:bg-muted text-white px-4 py-2 rounded-lg text-sm transition-colors border border-border">
                  Book Visit
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  );
}
