"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, UploadCloud, Pill, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export default function Prescriptions() {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [blobImage, setBlobImage] = useState<Blob | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  const isDoctor = (session as any)?.user?.role === 'DOCTOR';
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");

  const { data: appointmentsData } = useQuery({
    queryKey: ['doctorAppointments'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/doctor/appointments', {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken && isDoctor,
  });

  const doctorPatients = Array.from(new Map(
    (appointmentsData?.appointments || [])
      .map((a: any) => [a.profile.id, a.profile])
  ).values());

  useEffect(() => {
    if (isDoctor && doctorPatients.length > 0 && !selectedProfileId) {
      setSelectedProfileId((doctorPatients[0] as any).id);
    }
  }, [doctorPatients, isDoctor, selectedProfileId]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['prescriptionsList', selectedProfileId],
    queryFn: async () => {
      const url = isDoctor && selectedProfileId 
        ? `http://localhost:4000/api/ai/prescriptions?profileId=${selectedProfileId}`
        : 'http://localhost:4000/api/ai/prescriptions';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken && (!isDoctor || !!selectedProfileId),
  });

  const medicines = data?.medicines || [];
  const scannedPrescriptions = data?.prescriptions || [];

  const uploadPrescriptionFile = async (file: File | Blob) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('prescription', file, 'webcam-capture.jpg');
    if (isDoctor && selectedProfileId) {
      formData.append('profileId', selectedProfileId);
    }

    try {
      const res = await fetch('http://localhost:4000/api/ai/upload-prescription', {
        method: 'POST',
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
        body: formData
      });
      if (res.ok) {
        await refetch();
        alert("Prescription scanned successfully!");
      } else {
        const err = await res.json();
        alert(`Scan failed: ${err.error}`);
      }
    } catch (error) {
      alert("Network error during scan.");
    }
    setIsUploading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadPrescriptionFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    setPreviewImage(null);
    setBlobImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Failed to access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
    setPreviewImage(null);
    setBlobImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPreviewImage(dataUrl);

      canvas.toBlob((blob) => {
        if (blob) setBlobImage(blob);
      }, 'image/jpeg');
    }
  };

  const confirmUpload = async () => {
    if (blobImage) {
      stopCamera();
      await uploadPrescriptionFile(blobImage);
    }
  };

  const retakePhoto = () => {
    setPreviewImage(null);
    setBlobImage(null);
  };

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Pill className="w-8 h-8 text-primary" />
            AI Prescription Scanner
          </h1>
          <p className="text-muted-foreground mt-1">
            {isDoctor ? "Scan and analyze prescriptions for your patients." : "Upload prescriptions to auto-extract medicines and set reminders"}
          </p>
        </div>
      </div>

      {isDoctor && (
        <div className="glass-card p-6 rounded-2xl border border-border mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Patient</label>
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="w-full md:w-1/2 bg-input border border-border rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-colors"
          >
            {doctorPatients.length === 0 && <option value="">No patients found</option>}
            {doctorPatients.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} ({p.age} yrs)</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Zone */}
        <div className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors bg-card/50">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Upload or Scan Prescription</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">Supported formats: PDF, JPG, PNG or use your camera</p>
          <div className="flex gap-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*,.pdf"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isCameraOpen}
              className="bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white px-6 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              Browse Files
            </button>
            <button 
              onClick={startCamera}
              disabled={isUploading || isCameraOpen}
              className="bg-secondary hover:bg-muted disabled:opacity-50 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors border border-border"
            >
              <Camera className="w-4 h-4" /> Camera
            </button>
          </div>
        </div>

        {/* Adherence & Warnings */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-border">
            <h3 className="text-lg font-medium text-white mb-4">Today's Schedule</h3>
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : medicines.length === 0 ? (
                <p className="text-gray-500 text-sm p-4 text-center">No prescriptions scanned yet.</p>
              ) : medicines.map((med: any, i: number) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={med.id} 
                  className="bg-muted rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${med.status === 'taken' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {med.status === 'taken' ? <CheckCircle2 className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-white">{med.name}</p>
                      <p className="text-xs text-gray-400">{med.dosage} at {med.time}</p>
                    </div>
                  </div>
                  
                  {med.warning && (
                    <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/20">
                      <AlertTriangle className="w-4 h-4" /> Interaction Warning
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scanned Prescription Summaries */}
      {scannedPrescriptions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" /> Recent Scans
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {scannedPrescriptions.map((p: any, index: number) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={p.id} 
                className="glass-card p-6 rounded-2xl border border-border flex flex-col md:flex-row gap-6 items-start"
              >
                <div className="w-32 h-32 shrink-0 bg-black/40 rounded-xl overflow-hidden border border-border flex items-center justify-center">
                  {p.fileUrl ? (
                    <img src={`http://localhost:4000${p.fileUrl}`} alt="Prescription Scan" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-500">No Image</span>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <h4 className="text-lg font-semibold text-white">AI Analysis Summary</h4>
                  <p className="text-sm text-gray-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-border/50">
                    {p.aiSummary || "No summary available."}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Scanned on {new Date(p.createdAt).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <p className="text-sm text-orange-200">
          <strong className="text-orange-400">Disclaimer:</strong> This application does not replace professional medical advice. Always consult with a qualified healthcare provider before making medical decisions or changing your medication.
        </p>
      </div>

      {/* Live Camera PIP Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <div className="fixed bottom-6 right-6 z-50 flex items-end justify-end pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="bg-card w-80 rounded-2xl border-2 border-primary/50 overflow-hidden shadow-2xl relative pointer-events-auto"
            >
              <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Live Camera
                </h3>
                <button onClick={stopCamera} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="relative bg-black aspect-video flex items-center justify-center">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </>
                )}
                
                {previewImage && (
                  <div className="absolute top-4 left-4 w-24 h-24 rounded-lg overflow-hidden border-2 border-primary shadow-lg z-10 bg-black">
                    <img src={previewImage} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border bg-muted/50 flex justify-center gap-4">
                {previewImage ? (
                  <>
                    <button 
                      onClick={retakePhoto}
                      className="px-6 py-2.5 rounded-lg border border-border text-white hover:bg-white/5 transition-colors"
                    >
                      Retake
                    </button>
                    <button 
                      onClick={confirmUpload}
                      disabled={isUploading}
                      className="px-6 py-2.5 bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Confirm & Upload
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center hover:bg-primary/40 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
