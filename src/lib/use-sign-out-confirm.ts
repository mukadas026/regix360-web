"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "@/lib/sign-out";

export function useSignOutConfirm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function confirmSignOut() {
    setIsSigningOut(true);
    await signOut(router, queryClient);
  }

  return { confirmOpen, setConfirmOpen, isSigningOut, confirmSignOut };
}
