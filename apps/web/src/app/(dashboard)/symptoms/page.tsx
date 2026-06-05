"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Send, AlertTriangle, Bot } from "lucide-react";
import Link from "next/link";

export default function SymptomAnalyzer() {
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setIsAnalyzing(true);
    // Mock API call to AI
    setTimeout(() => {
      setResult({
        severity: "Moderate",
        explanation: "Based on the symptoms described (fever and stomach pain), it could be a mild gastrointestinal infection or food poisoning.",
        recommendation: "Stay hydrated. If symptoms persist for more than 48 hours or worsen, schedule a consultation with a general physician.",
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" />
          AI Symptom Analyzer
        </h1>
        <p className="text-muted-foreground mt-1">Describe how you're feeling and our AI will provide educational guidance</p>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-border">
        <form onSubmit={handleAnalyze} className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your symptoms in detail... e.g. I have had a mild fever and headache since yesterday morning."
            className="w-full bg-input border border-border rounded-xl p-4 text-white placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[120px] resize-none"
          />
          <button 
            type="submit"
            disabled={isAnalyzing || !query}
            className="absolute bottom-4 right-4 bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white p-3 rounded-xl transition-colors flex items-center justify-center"
          >
            {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-semibold text-white">Analysis Result</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              result.severity === 'Mild' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
              result.severity === 'Moderate' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
              'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {result.severity} Severity
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-muted rounded-xl p-6 border border-border">
              <h4 className="text-primary font-medium flex items-center gap-2 mb-3">
                <Bot className="w-5 h-5" /> AI Observation
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">{result.explanation}</p>
            </div>
            <div className="bg-muted rounded-xl p-6 border border-border">
              <h4 className="text-white font-medium mb-3">Recommendation</h4>
              <p className="text-gray-300 text-sm leading-relaxed">{result.recommendation}</p>
              {result.severity === 'Moderate' && (
                <Link href="/appointments" className="mt-4 w-full flex justify-center bg-secondary hover:bg-muted border border-border text-white py-2 rounded-lg text-sm transition-colors">
                  Find a Doctor
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <p className="text-sm text-orange-200">
          <strong className="text-orange-400">Disclaimer:</strong> This application does not replace professional medical advice. The AI Symptom Analyzer is for educational purposes only. Never allow the AI to diagnose diseases.
        </p>
      </div>
    </div>
  );
}
