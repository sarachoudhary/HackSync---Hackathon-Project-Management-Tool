import { useState } from "react";
import { Link } from "wouter";
import { useProjects, useCreateProject } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FolderGit2, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [hackathonName, setHackathonName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate(
      {
        name,
        hackathonName,
        description,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      },
      {
        onSuccess: () => {
          setOpen(false);
          toast({ title: "Project Initialized" });
          // Reset form
          setName("");
          setHackathonName("");
          setDescription("");
          setStartTime("");
          setEndTime("");
        },
        onError: (err) =>
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-glow-primary mb-2">
            WORKSPACE
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            Select a project or initialize a new hackathon repository.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-display font-bold tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground border-glow">
              <Plus className="w-5 h-5 mr-2" />
              NEW PROJECT
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] glass-panel border-primary/30">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl tracking-wider text-primary">
                INIT_PROJECT
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground">
                    Project Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="font-sans bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground">
                    Hackathon
                  </label>
                  <Input
                    value={hackathonName}
                    onChange={(e) => setHackathonName(e.target.value)}
                    required
                    className="font-sans bg-background/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground">
                  Objective / Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="font-sans min-h-[100px] bg-background/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground">
                    Hacking Starts
                  </label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="font-mono text-sm bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground">
                    Deadline
                  </label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="font-mono text-sm bg-background/50"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full mt-6 font-display tracking-widest border-glow"
                disabled={createProject.isPending}
              >
                {createProject.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                DEPLOY REPOSITORY
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-card animate-pulse border border-border/50"
            />
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-primary/20 rounded-2xl bg-primary/5">
          <FolderGit2 className="w-16 h-16 text-primary/40 mx-auto mb-4" />
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">
            No Projects Found
          </h3>
          <p className="text-muted-foreground font-mono text-sm max-w-sm mx-auto">
            You are not part of any hackathons yet. Create a new project to
            begin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <Card
              key={project.id}
              className="glass-panel hover-elevate flex flex-col group border-primary/10"
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-mono rounded border border-secondary/20">
                    {project.hackathonName}
                  </span>
                </div>
                <CardTitle className="font-display text-2xl group-hover:text-primary transition-colors line-clamp-1">
                  {project.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 font-sans mt-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <div className="flex-1" />
              <CardFooter className="pt-4 border-t border-border/30 flex justify-between items-center bg-card/30 rounded-b-xl">
                <div className="text-xs font-mono text-muted-foreground">
                  Due in {formatDistanceToNow(new Date(project.endTime))}
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Link href={`/projects/${project.id}`}>
                    ENTER <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
