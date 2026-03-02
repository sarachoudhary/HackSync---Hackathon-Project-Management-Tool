import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TerminalSquare, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Verify() {
  const [_, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const emailParam = params.get("email") || "";

  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(600); // 10 minutes

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const verifyMutation = useMutation({
    mutationFn: async (data: { email: string; code: string }) => {
      const res = await apiRequest("POST", api.auth.verifyOtp.path, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Email verified", description: "You can now login." });
      setLocation("/auth");
    },
    onError: (err: any) => {
      toast({
        title: "Verification failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", api.auth.sendVerification.path, {
        email,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Code resent",
        description: "Check your email for the new code.",
      });
      setCountdown(600);
    },
    onError: (err: any) => {
      toast({
        title: "Failed to resend",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate({ email: emailParam, code });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -z-10" />

      <Card className="w-full max-w-md glass-panel border-primary/20 shadow-2xl shadow-primary/5">
        <CardHeader className="text-center pb-8 relative">
          <Link href="/auth">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <TerminalSquare className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="font-display text-3xl font-bold tracking-wider">
            VERIFY_IDENTITY
          </CardTitle>
          <CardDescription className="font-mono text-primary/70">
            Enter the 6-digit code sent to {emailParam}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono bg-background/50 border-border/50 focus-visible:ring-primary/50 h-16 text-center text-2xl tracking-[1em] pl-[1em]"
                required
              />
              <div className="text-center text-sm font-mono text-muted-foreground mt-2">
                Code expires in:{" "}
                <span className="text-primary">{formatTime(countdown)}</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-display uppercase tracking-wider text-lg border-glow"
              disabled={verifyMutation.isPending || countdown === 0}
            >
              {verifyMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              Verify Protocol
            </Button>

            <Button
              type="button"
              variant="link"
              className="w-full font-mono text-xs text-primary/70 hover:text-primary"
              onClick={() => resendMutation.mutate(emailParam)}
              disabled={resendMutation.isPending}
            >
              {resendMutation.isPending ? "RESENDING..." : "REQUEST_NEW_CODE"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
