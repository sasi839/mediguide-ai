"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Activity, Pill, ShieldPlus, Vault, LogOut, Calendar, Shield } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const allNavItems = [
  { name: "Family", href: "/family", icon: Users, roles: ["OWNER", "MEMBER"] },
  { name: "Book Doctor", href: "/appointments", icon: Calendar, roles: ["OWNER", "MEMBER"] },
  { name: "Order Medicine", href: "/pharmacies", icon: Pill, roles: ["OWNER", "MEMBER"] },
  { name: "Health Insurance", href: "/insurance-plans", icon: Shield, roles: ["OWNER", "MEMBER"] },
  { name: "Doctor Portal", href: "/doctor", icon: LayoutDashboard, roles: ["DOCTOR"] },
  { name: "Admin", href: "/admin", icon: ShieldPlus, roles: ["ADMIN"] },
  { name: "Pharmacy", href: "/pharmacy", icon: Pill, roles: ["PHARMACY"] },
  { name: "Prescriptions", href: "/prescriptions", icon: Activity, roles: ["OWNER", "MEMBER", "DOCTOR"] },
  { name: "Symptoms", href: "/symptoms", icon: Activity, roles: ["OWNER", "MEMBER"] },
  { name: "Insurance", href: "/insurance", icon: ShieldPlus, roles: ["INSURANCE"] },
  { name: "Vault", href: "/vault", icon: Vault, roles: ["OWNER", "MEMBER", "DOCTOR"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session as any)?.user?.role || "OWNER";
  
  const navItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="text-xl font-bold text-white tracking-tight">MediGuide<span className="text-primary">AI</span></span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}
