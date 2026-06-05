"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardRouter() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/sign-in");
      return;
    }

    const role = (session as any).user?.role;
    
    switch (role) {
      case "OWNER":
      case "MEMBER":
        router.push("/family");
        break;
      case "DOCTOR":
        router.push("/doctor");
        break;
      case "PHARMACY":
        router.push("/pharmacy");
        break;
      case "INSURANCE":
        router.push("/insurance");
        break;
      default:
        router.push("/admin");
    }
  }, [session, status, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
