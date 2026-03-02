import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { TerminalSquare, Zap, Activity, Clock } from "lucide-react";

export default function Landing() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[100px] -z-10" />

        <div className="inline-flex items-center justify-center px-3 py-1 mb-8 text-sm font-mono text-primary bg-primary/10 rounded-full border border-primary/20 backdrop-blur-sm">
          <Zap className="w-4 h-4 mr-2" />
          Ship faster at your next hackathon
        </div>

        <h1 className="text-6xl md:text-8xl font-display font-extrabold tracking-tighter mb-6 max-w-4xl bg-clip-text text-transparent bg-gradient-to-r from-white via-primary/80 to-secondary">
          SYNC YOUR HACKATHON.
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-12 font-sans font-light">
          The ultimate project management OS built specifically for the chaos,
          speed, and energy of 48-hour hackathons.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            asChild
            size="lg"
            className="h-14 px-8 text-lg font-display uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground border-glow"
          >
            <Link href="/auth">Start Building</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 px-8 text-lg font-display uppercase tracking-wider border-primary/20 hover:border-primary/50 hover:bg-primary/5 glass-panel"
          >
            <a href="#features">Explore Features</a>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        className="container mx-auto px-4 py-24 border-t border-border/50"
      >
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl glass-panel hover-elevate group">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <Clock className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-3">
              Live Countdowns
            </h3>
            <p className="text-muted-foreground font-sans">
              Keep the team aligned with precise synchronized deadlines. Every
              second counts when you're hacking.
            </p>
          </div>

          <div className="p-8 rounded-2xl glass-panel hover-elevate group">
            <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors">
              <Activity className="w-7 h-7 text-secondary" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-3">
              Kanban Chaos
            </h3>
            <p className="text-muted-foreground font-sans">
              Lightning-fast drag and drop boards. Track what's being built,
              what's broken, and what's shipped.
            </p>
          </div>

          <div className="p-8 rounded-2xl glass-panel hover-elevate group">
            <div className="w-14 h-14 bg-chart-3/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-chart-3/20 transition-colors">
              <TerminalSquare className="w-7 h-7 text-chart-3" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-3">
              Async Standups
            </h3>
            <p className="text-muted-foreground font-sans">
              No time for meetings. Log "Done", "Doing", and "Blockers" so
              everyone stays unblocked and coding.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
