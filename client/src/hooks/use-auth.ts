import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { z } from "zod";
import { useEffect } from "react";
import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function useUser() {
  return useQuery({
    queryKey: [api.auth.user.path],
    queryFn: async () => {
      const res = await fetch(api.auth.user.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.auth.user.responses[200].parse(await res.json());
    },
    staleTime: Infinity,
    retry: false,
  });
}

export function useFirebaseLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (email: string) => {
      const actionCodeSettings = {
        url: window.location.origin + "/auth",
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
    },
  });
}

export function useHandleFirebaseLink() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    let isProcessing = false;

    const handleLink = async () => {
      if (isSignInWithEmailLink(auth, window.location.href) && !isProcessing) {
        isProcessing = true;
        let email = window.localStorage.getItem("emailForSignIn");
        
        if (!email) {
          email = window.prompt("Please provide your email for confirmation");
        }
        
        if (email) {
          try {
            const result = await signInWithEmailLink(auth, email, window.location.href);
            const idToken = await result.user.getIdToken();

            // Check for pending registration
            const pendingRegistrationJson = window.localStorage.getItem("pendingRegistration");
            const pendingRegistration = pendingRegistrationJson ? JSON.parse(pendingRegistrationJson) : null;

            // Verify with our backend
            const res = await fetch(api.auth.firebaseVerify.path, {
              method: api.auth.firebaseVerify.method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                idToken,
                username: pendingRegistration?.username,
                password: pendingRegistration?.password,
              }),
              credentials: "include",
            });

            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.message || "Verification with backend failed");
            }

            const user = await res.json();
            queryClient.setQueryData([api.auth.user.path], user);
            window.localStorage.removeItem("emailForSignIn");
            window.localStorage.removeItem("pendingRegistration");
            
            // Clear the URL parameters to prevent re-processing
            window.history.replaceState({}, "", window.location.pathname);
            
            toast({
              title: pendingRegistration ? "Account created successfully" : "Signed in successfully",
              description: pendingRegistration ? "Welcome to the mainframe!" : "Welcome back!",
            });
          } catch (err: any) {
            console.error("Firebase link sign-in error:", err);
            if (err.code === "auth/invalid-action-code") {
              // This often happens if the link was already used or useEffect fired twice
              return;
            }
            toast({
              title: "Sign-in failed",
              description: err.message,
              variant: "destructive",
            });
          } finally {
            isProcessing = false;
          }
        }
      }
    };

    handleLink();
  }, [queryClient, toast]);
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.auth.login.input>) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid credentials");
        throw new Error("Login failed");
      }
      return api.auth.login.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.auth.user.path], data);
    },
  });
}

export function useRegister() {
  const firebaseLogin = useFirebaseLogin();
  return useMutation({
    mutationFn: async (data: { username: string; email: string; password: any }) => {
      // 1. Check if username/email is available
      const checkRes = await fetch(api.auth.registerCheck.path, {
        method: api.auth.registerCheck.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.username, email: data.email }),
      });

      if (!checkRes.ok) {
        const err = await checkRes.json();
        throw new Error(err.message || "Validation failed");
      }

      // 2. Store registration data temporarily
      window.localStorage.setItem("pendingRegistration", JSON.stringify(data));

      // 3. Trigger Magic Link
      await firebaseLogin.mutateAsync(data.email);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.user.path], null);
      queryClient.clear();
    },
  });
}
