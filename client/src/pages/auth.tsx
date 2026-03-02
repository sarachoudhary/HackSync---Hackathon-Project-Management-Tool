import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useRegister, useFirebaseLogin, useHandleFirebaseLink } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TerminalSquare, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const login = useLogin();
  const register = useRegister();
  const firebaseLogin = useFirebaseLogin();

  useHandleFirebaseLink();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: () => setLocation("/dashboard"),
        onError: (err) => {
          if (err.message.includes("Email not verified")) {
            toast({
              title: "Email not verified",
              description: "Please use 'Forgot Password' to send a Magic Link and verify your email.",
              variant: "default",
            });
          } else {
            toast({
              title: "Login failed",
              description: err.message,
              variant: "destructive",
            });
          }
        },
      },
    );
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(
      { username, email, password },
      {
        onSuccess: () => {
          toast({
            title: "Magic Link Sent",
            description: "Check your email for the sign-in link to complete registration.",
          });
        },
        onError: (err) =>
          toast({
            title: "Registration failed",
            description: err.message,
            variant: "destructive",
          }),
      },
    );
  };

  const handleMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    firebaseLogin.mutate(email, {
      onSuccess: () => {
        toast({
          title: "Magic Link Sent",
          description: "Check your email for the sign-in link.",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Failed to send link",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -z-10" />

      <Card className="w-full max-w-md glass-panel border-primary/20 shadow-2xl shadow-primary/5">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <TerminalSquare className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="font-display text-3xl font-bold tracking-wider">
            INIT_SESSION
          </CardTitle>
          <CardDescription className="font-mono text-primary/70">
            Authenticate to access the mainframe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1">
              <TabsTrigger
                value="login"
                className="font-mono text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                LOGIN
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="font-mono text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                REGISTER
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="font-mono bg-background/50 border-border/50 focus-visible:ring-primary/50 h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-mono bg-background/50 border-border/50 focus-visible:ring-primary/50 h-12"
                    required
                  />
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleMagicLink}
                    className="text-xs font-mono text-primary/70 hover:text-primary transition-colors underline-offset-4 hover:underline"
                    disabled={firebaseLogin.isPending}
                  >
                    {firebaseLogin.isPending ? "Sending link..." : "Forgot Password?"}
                  </button>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 font-display uppercase tracking-wider text-lg border-glow mt-2"
                  disabled={login.isPending}
                >
                  {login.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : null}
                  Execute Login
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="font-mono bg-background/50 border-border/50 focus-visible:ring-primary/50 h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Choose a Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="font-mono bg-background/50 border-border/50 focus-visible:ring-primary/50 h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Choose a Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-mono bg-background/50 border-border/50 focus-visible:ring-primary/50 h-12"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full h-12 font-display uppercase tracking-wider text-lg mt-4"
                  disabled={register.isPending}
                >
                  {register.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : null}
                  Create Identity
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
