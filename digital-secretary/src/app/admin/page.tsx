"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/login");
  }, [router]);
  return null;
}
