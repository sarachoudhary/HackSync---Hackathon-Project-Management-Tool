import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, TerminalSquare, LogOut, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Layout({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { data: user, isLoading } = useUser();
  const logout = useLogout();
  const [_, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/auth"),
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 glass-panel">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <TerminalSquare className="h-6 w-6 text-primary group-hover:text-secondary transition-colors" />
            <span className="font-display font-bold text-xl tracking-wider uppercase text-glow-primary">
              HackSync
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full border border-primary/20 hover:border-primary/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="font-mono bg-primary/10 text-primary">
                        {user.username?.substring(0, 2).toUpperCase() ?? "??"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 glass-panel"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none font-display text-primary">
                        {user.username}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground font-mono">
                        Hacker ID: {user.id}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard"
                      className="cursor-pointer font-mono text-sm"
                    >
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer font-mono text-sm"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                asChild
                className="font-display font-semibold uppercase tracking-wider bg-primary hover:bg-primary/90 text-white border-glow"
              >
                <Link href="/auth">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
