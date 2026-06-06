"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Folder, UploadCloud, Search, FileText, Lock, Loader2, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export default function VaultDashboard() {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['medicalRecords'],
    queryFn: async () => {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/records/list`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!(session as any)?.accessToken,
  });

  const records = data?.records || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', file.name);
    formData.append('isPrivate', 'false');

    try {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/records/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
        body: formData
      });
      if (res.ok) {
        await refetch();
      } else {
        const err = await res.json();
        alert(`Upload failed: ${err.error}`);
      }
    } catch (error) {
      alert("Network error during upload.");
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Folder className="w-8 h-8 text-primary" />
            Medical Vault
          </h1>
          <p className="text-muted-foreground mt-1">Securely store and manage all medical documents</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="bg-input border border-border rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-primary outline-none w-full md:w-64"
            />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".pdf,.png,.jpg,.jpeg"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap text-sm"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            Upload File
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-muted text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-300">Document Name</th>
              <th className="px-6 py-4 font-medium text-gray-300">Type</th>
              <th className="px-6 py-4 font-medium text-gray-300">Date Added</th>
              <th className="px-6 py-4 font-medium text-gray-300">Privacy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  Loading records...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No records found. Click "Upload File" to add one.
                </td>
              </tr>
            ) : records.map((record: any, i: number) => (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={record.id} 
                className="hover:bg-muted/50 transition-colors group cursor-pointer"
              >
                <td className="px-6 py-4 flex items-center gap-3 text-white">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <FileText className="w-4 h-4" />
                  </div>
                  {record.title}
                </td>
                <td className="px-6 py-4">{record.fileType || "Document"}</td>
                <td className="px-6 py-4">{new Date(record.uploadedAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  {record.isPrivate ? (
                    <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full w-fit">
                      <Lock className="w-3 h-3" /> Private Mode
                    </span>
                  ) : (
                    <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full w-fit">
                      Shared
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <a href={record.fileUrl?.startsWith('data:') ? record.fileUrl : `\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}\${record.fileUrl}`} download={record.title} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm font-medium">
                    <Download className="w-4 h-4" /> View
                  </a>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
