"use client";

import { motion } from "framer-motion";
import { Settings, Users, Activity, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Fetch Users
  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/users`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      return res.json();
    },
    enabled: !!session
  });

  // Verify User Mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken}` 
        },
        body: JSON.stringify({ userId, role })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    }
  });

  const users = data?.users || [];
  const pendingCount = users.filter((u: any) => !u.verified).length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          Super Admin Console
        </h1>
        <p className="text-muted-foreground mt-1">Platform management, verification workflows, and moderation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-xl">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{users.length}</h3>
            <p className="text-sm text-gray-400">Total Users</p>
          </div>
        </div>
        
        <div className="glass-card p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-4 bg-green-500/10 rounded-xl">
            <Activity className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">99.9%</h3>
            <p className="text-sm text-gray-400">Platform Uptime</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-4 bg-orange-500/10 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{pendingCount}</h3>
            <p className="text-sm text-gray-400">Pending Verifications</p>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mt-8">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-white">Recent Registrations & Verifications</h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading user data...</div>
        ) : (
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-muted text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-300">Email Address</th>
                <th className="px-6 py-4 font-medium text-gray-300">Role</th>
                <th className="px-6 py-4 font-medium text-gray-300">Verification Status</th>
                <th className="px-6 py-4 font-medium text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user: any, i: number) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={user.id} 
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4 text-white font-medium">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.verified ? (
                       <span className="text-xs text-green-400">Verified</span>
                    ) : (
                       <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">Pending Verification</span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    {!user.verified && (
                      <button 
                        onClick={() => verifyMutation.mutate({ userId: user.id, role: user.role })}
                        className="text-green-400 hover:underline font-medium"
                      >
                        {verifyMutation.isPending ? 'Approving...' : 'Approve'}
                      </button>
                    )}
                    <button className="text-destructive hover:underline font-medium">Suspend</button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
