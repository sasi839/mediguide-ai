"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Activity, Shield, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black overflow-hidden selection:bg-primary/30">
      {/* Dynamic Background Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] translate-y-1/4 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-2">
          <Activity className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold text-white tracking-tight">MediGuide<span className="text-primary">.ai</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/sign-up" className="bg-white text-black hover:bg-gray-200 px-5 py-2.5 rounded-full text-sm font-medium transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Platform is Live
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1]">
            The Healthcare Operating <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">System of the Future.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Unify your family's medical records, instantly analyze prescriptions with AI, and connect with world-class doctors in one highly secure platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/sign-up" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium transition-all hover:scale-105">
              Create Free Account <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/family" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-full text-lg font-medium transition-all">
              View Demo Dashboard
            </Link>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 text-left"
        >
          <div className="glass-card p-8 rounded-3xl border border-white/5 hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI Prescription Scanner</h3>
            <p className="text-gray-400 leading-relaxed">Upload any prescription. Our AI instantly extracts medications, sets smart reminders, and warns you of drug interactions.</p>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Military-Grade Vault</h3>
            <p className="text-gray-400 leading-relaxed">Store all your sensitive lab reports and documents in a highly secure, encrypted vault with strict privacy toggles.</p>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-white/5 hover:border-green-500/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Unified Family Profiles</h3>
            <p className="text-gray-400 leading-relaxed">Manage your entire family's healthcare from one dashboard. Set up emergency cards and grant secure guardian access.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
