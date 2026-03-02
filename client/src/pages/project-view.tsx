import { useState } from "react";
import { useRoute } from "wouter";
import { useProject, useUpdateProject } from "@/hooks/use-projects";
import { useTasks, useCreateTask } from "@/hooks/use-tasks";
import { useStandups, useCreateStandup } from "@/hooks/use-standups";
import { useNotifications, useMarkNotificationRead } from "@/hooks/use-notifications";
import {
  useTeamMembers,
  useAddTeamMember,
  useRemoveTeamMember,
} from "@/hooks/use-teams";
import { useUser } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Countdown } from "@/components/countdown";
import { KanbanBoard } from "@/components/kanban/board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Users,
  Trash2,
  BarChart2,
  MessageSquare,
  Bell,
  Check,
  Settings,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

export default function ProjectView() {
  const [match, params] = useRoute("/projects/:id");
  const projectId = Number(params?.id);
  const { data: user } = useUser();

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tasks = [] } = useTasks(projectId);
  const { data: standups = [] } = useStandups(projectId);
  const { data: team = [] } = useTeamMembers(projectId);
  const { data: notifications = [] } = useNotifications(projectId);
  const markRead = useMarkNotificationRead();
  const updateProject = useUpdateProject();

  const [showMyTasks, setShowMyTasks] = useState(false);

  if (projectLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 font-mono text-destructive">
        404: REPOSITORY NOT FOUND
      </div>
    );
  }

  // Stats for charts
  const stats = [
    {
      name: "Backlog",
      value: tasks.filter((t) => t.status === "todo").length,
      color: "hsl(var(--muted-foreground))",
    },
    {
      name: "In Progress",
      value: tasks.filter((t) => t.status === "in_progress").length,
      color: "hsl(var(--secondary))",
    },
    {
      name: "Shipped",
      value: tasks.filter((t) => t.status === "done").length,
      color: "hsl(var(--primary))",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Project Header */}
      <div className="glass-panel p-6 rounded-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 border-l-4 border-l-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 flex space-x-2">
          <NotificationsPopover notifications={notifications} markRead={markRead} />
          {project.teamLeadId === user?.id && (
            <ProjectSettings project={project} updateProject={updateProject} />
          )}
        </div>
        
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-mono rounded border border-secondary/20">
              {project.hackathonName}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-glow-primary mb-2">
            {project.name}
          </h1>
          <p className="text-muted-foreground font-sans max-w-2xl">
            {project.description}
          </p>
        </div>

        <div className="p-4 bg-background/50 rounded-xl border border-border/50 shadow-inner">
          <Countdown endTime={project.endTime} />
        </div>
      </div>

      <Tabs defaultValue="board" className="w-full">
        <div className="flex justify-between items-center mb-6 overflow-x-auto pb-2">
          <TabsList className="bg-muted/50 p-1 glass-panel">
            <TabsTrigger value="board" className="font-mono text-sm">
              KANBAN
            </TabsTrigger>
            <TabsTrigger value="overview" className="font-mono text-sm">
              OVERVIEW
            </TabsTrigger>
            <TabsTrigger value="standups" className="font-mono text-sm">
              STANDUPS
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <Button
              variant={showMyTasks ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowMyTasks(!showMyTasks)}
              className="font-mono text-xs border-glow"
            >
              <Filter className="w-3 h-3 mr-1" />
              {showMyTasks ? "ALL TASKS" : "MY TASKS"}
            </Button>
            <NewTaskDialog projectId={projectId} team={team} project={project} user={user} />
          </div>
        </div>

        <TabsContent value="board" className="mt-0 h-[600px]">
          <KanbanBoard 
            tasks={showMyTasks ? tasks.filter(t => t.assignedUserId === user?.id) : tasks} 
            projectId={projectId} 
            user={user}
            isLead={project.teamLeadId === user?.id}
          />
        </TabsContent>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass-panel col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-display flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5" /> Task Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex flex-col items-center justify-center p-0">
                {tasks.length > 0 ? (
                  <div className="w-full h-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {stats.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color}
                              className="filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-all duration-300 hover:scale-105" 
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length && payload[0].name) {
                              const name = String(payload[0].name);
                              return (
                                <div className="bg-background/90 backdrop-blur-md border border-primary/20 p-3 rounded-lg shadow-glow-sm">
                                  <p className="text-primary font-display font-bold text-sm tracking-widest">{name.toUpperCase()}</p>
                                  <p className="text-secondary text-lg font-mono leading-none">{payload[0].value} <span className="text-[10px]">TASKS</span></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                       <p className="text-xs text-muted-foreground font-mono leading-none">TOTAL</p>
                       <p className="text-2xl font-display font-bold text-primary">{tasks.length}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground font-mono text-sm">
                    No tasks tracked yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="font-display flex items-center">
                  <Users className="mr-2 h-5 w-5" /> Team Roster
                </CardTitle>
                <TeamMemberDialog projectId={projectId} />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {team.map((member) => (
                    <div
                      key={member.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border/50"
                    >
                      <div>
                        <p className="font-mono text-sm font-bold text-primary">
                          {member.user.username}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase">
                          {member.role}
                        </p>
                      </div>
                      {/* Assuming lead can remove members, but for demo we just show it */}
                      <RemoveMemberBtn
                        projectId={projectId}
                        memberId={member.id}
                      />
                    </div>
                  ))}
                  {team.length === 0 && (
                    <p className="text-muted-foreground font-mono text-sm text-center">
                      No members found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="standups">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <StandupForm projectId={projectId} />
            </div>
            <div className="lg:col-span-2 space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {standups.length === 0 ? (
                <div className="text-center py-10 bg-card/20 rounded-xl border border-dashed border-border">
                  <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="text-muted-foreground font-mono">
                    No standup logs for this project yet.
                  </p>
                </div>
              ) : (
                standups.map((log) => (
                  <Card key={log.id} className="glass-panel">
                    <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row justify-between items-center bg-card/30">
                      <span className="font-mono text-primary font-bold">
                        {log.user.username}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {format(new Date(log.date), "MMM d, HH:mm")}
                      </span>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <h5 className="text-xs font-bold text-secondary uppercase mb-1">
                          Shipped Today
                        </h5>
                        <p className="text-sm font-sans">{log.doneToday}</p>
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-primary uppercase mb-1">
                          Queue Tomorrow
                        </h5>
                        <p className="text-sm font-sans">{log.doTomorrow}</p>
                      </div>
                      {log.blockers &&
                        log.blockers !== "None" &&
                        log.blockers !== "none" && (
                          <div className="p-3 bg-destructive/10 rounded border border-destructive/20 mt-2">
                            <h5 className="text-xs font-bold text-destructive uppercase mb-1">
                              Blockers
                            </h5>
                            <p className="text-sm font-sans text-destructive-foreground">
                              {log.blockers}
                            </p>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helpers

function NotificationsPopover({ notifications, markRead }: { notifications: any[], markRead: any }) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 hover:bg-primary/10 transition-colors">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">BLOCKER ALERTS</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground font-mono py-4">No notifications yet</p>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-3 rounded-lg border transition-all ${n.read ? 'bg-background/30 opacity-60' : 'bg-primary/5 border-primary/20 shadow-glow-sm'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-mono text-primary uppercase">{n.type}</span>
                  {!n.read && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 hover:text-primary"
                      onClick={() => markRead.mutate(n.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm font-sans">{n.content}</p>
                <p className="text-[10px] text-muted-foreground mt-2 font-mono">{format(new Date(n.createdAt), "HH:mm, MMM d")}</p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProjectSettings({ project, updateProject }: { project: any, updateProject: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary/10">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel">
        <DialogHeader>
          <DialogTitle className="font-display">PROJECT SETTINGS</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50">
            <div>
              <h4 className="font-display text-sm font-bold">MEMBER TASK CONTROL</h4>
              <p className="text-xs text-muted-foreground font-sans">Allow team members to create and delete tasks</p>
            </div>
            <Button
              variant={project.allowMemberTaskCreation ? "default" : "outline"}
              size="sm"
              onClick={() => updateProject.mutate({ id: project.id, data: { allowMemberTaskCreation: project.allowMemberTaskCreation ? 0 : 1 }})}
              disabled={updateProject.isPending}
            >
              {project.allowMemberTaskCreation ? "ALLOWED" : "RESTRICTED"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewTaskDialog({
  projectId,
  team,
  project,
  user,
}: {
  projectId: number;
  team: any[];
  project: any;
  user: any;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createTask = useCreateTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignedUserId, setAssignedUserId] = useState<string>("");

  const isLead = project.teamLeadId === user?.id;
  const canCreate = isLead || project.allowMemberTaskCreation;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      toast({ title: "Permission Denied", variant: "destructive" });
      return;
    }
    createTask.mutate(
      {
        projectId,
        task: {
          title,
          description,
          status: "todo",
          deadline: new Date(deadline),
          assignedUserId: assignedUserId ? parseInt(assignedUserId) : undefined,
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle("");
          setDescription("");
          setDeadline("");
          setAssignedUserId("");
          toast({ title: "Task added to backlog" });
        },
        onError: (err) =>
          toast({
            title: "Failed to add task",
            description: err.message,
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          disabled={!canCreate}
          className="font-display tracking-wider bg-secondary hover:bg-secondary/90 text-secondary-foreground border-glow disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-1" /> CREATE TASK
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-secondary">
            NEW TASK
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-background/50"
          />
          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="bg-background/50"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-mono mb-1 block">
                Deadline
              </label>
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="bg-background/50 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-mono mb-1 block">
                Assign To
              </label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {team.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.username}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full font-display tracking-widest mt-2"
            disabled={createTask.isPending}
          >
            {createTask.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "DEPLOY TASK"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TeamMemberDialog({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const addMember = useAddTeamMember();
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMember.mutate(
      {
        projectId,
        payload: { username, role: "member" },
      },
      {
        onSuccess: () => {
          setOpen(false);
          setUsername("");
          toast({ title: "Member Added" });
        },
        onError: (err) =>
          toast({
            title: "Failed",
            description: err.message,
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" className="h-8 w-8">
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-primary">
            ADD HACKER
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex space-x-2 mt-4">
          <Input
            placeholder="Username exactly"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="font-mono bg-background/50"
          />
          <Button type="submit" disabled={addMember.isPending}>
            {addMember.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "ADD"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveMemberBtn({
  projectId,
  memberId,
}: {
  projectId: number;
  memberId: number;
}) {
  const remove = useRemoveTeamMember();
  return (
    <Button
      size="icon"
      variant="ghost"
      className="text-destructive hover:bg-destructive/20 h-8 w-8"
      onClick={() => remove.mutate({ projectId, id: memberId })}
      disabled={remove.isPending}
    >
      {remove.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </Button>
  );
}

function StandupForm({ projectId }: { projectId: number }) {
  const createStandup = useCreateStandup();
  const { toast } = useToast();

  const [done, setDone] = useState("");
  const [todo, setTodo] = useState("");
  const [blockers, setBlockers] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStandup.mutate(
      {
        projectId,
        log: {
          date: new Date(),
          doneToday: done,
          doTomorrow: todo,
          blockers: blockers || "None",
        },
      },
      {
        onSuccess: () => {
          setDone("");
          setTodo("");
          setBlockers("");
          toast({ title: "Standup Logged", description: "Keep hacking!" });
        },
        onError: (err) =>
          toast({
            title: "Failed",
            description: err.message,
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <Card className="glass-panel border-primary/20 sticky top-24">
      <CardHeader>
        <CardTitle className="font-display text-xl tracking-wider text-primary">
          LOG STANDUP
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-muted-foreground uppercase">
              Shipped Today
            </label>
            <Textarea
              value={done}
              onChange={(e) => setDone(e.target.value)}
              required
              className="h-20 bg-background/50 font-sans"
              placeholder="What did you accomplish?"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-mono text-muted-foreground uppercase">
              Queue Tomorrow
            </label>
            <Textarea
              value={todo}
              onChange={(e) => setTodo(e.target.value)}
              required
              className="h-20 bg-background/50 font-sans"
              placeholder="What's next?"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-mono text-destructive uppercase">
              Blockers
            </label>
            <Textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              className="h-16 bg-destructive/5 font-sans border-destructive/30 focus-visible:ring-destructive/50"
              placeholder="Optional"
            />
          </div>
          <Button
            type="submit"
            className="w-full font-display tracking-widest border-glow"
            disabled={createStandup.isPending}
          >
            {createStandup.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "COMMIT LOG"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
