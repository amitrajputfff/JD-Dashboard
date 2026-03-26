"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthValidator } from "@/lib/auth-validation";
import { Loader } from "@/components/ui/loader";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (AuthValidator.hasBasicAuth()) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <Loader size="lg" text="Loading..." />
    </div>
  );
}
