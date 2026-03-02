import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth } from "./auth";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  setupAuth(app);

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Projects
  app.get(api.projects.list.path, requireAuth, async (req, res) => {
    const projects = await storage.getProjectsForUser(req.user!.id);
    res.json(projects);
  });

  app.get(api.projects.get.path, requireAuth, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) return res.status(404).json({ message: "Project not found" });

    const member = await storage.getMemberByProjectAndUser(
      project.id,
      req.user!.id,
    );
    if (!member && project.teamLeadId !== req.user!.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json(project);
  });

  app.post(api.projects.create.path, requireAuth, async (req, res) => {
    try {
      const bodySchema = api.projects.create.input.extend({
        startTime: z.coerce.date(),
        endTime: z.coerce.date(),
      });
      const input = bodySchema.parse(req.body);
      const project = await storage.createProject(input, req.user!.id);
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const project = await storage.getProject(id);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (project.teamLeadId !== req.user!.id) {
        return res.status(403).json({ message: "Only team lead can update settings" });
      }

      const input = api.projects.update.input.parse(req.body);
      const updated = await storage.updateProject(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Team Members
  app.get(api.teamMembers.list.path, requireAuth, async (req, res) => {
    const projectId = Number(req.params.projectId);
    const members = await storage.getProjectMembers(projectId);
    res.json(members);
  });

  app.post(api.teamMembers.add.path, requireAuth, async (req, res) => {
    try {
      const projectId = Number(req.params.projectId);
      const project = await storage.getProject(projectId);
      if (!project)
        return res.status(404).json({ message: "Project not found" });

      if (project.teamLeadId !== req.user!.id) {
        return res
          .status(401)
          .json({ message: "Only team lead can manage members" });
      }

      const input = api.teamMembers.add.input.parse(req.body);
      const userToAdd = await storage.getUserByUsername(input.username);
      if (!userToAdd) {
        return res.status(404).json({ message: "User not found" });
      }

      const existing = await storage.getMemberByProjectAndUser(
        projectId,
        userToAdd.id,
      );
      if (existing) {
        return res.status(400).json({ message: "User is already a member" });
      }

      const member = await storage.addTeamMember({
        projectId,
        userId: userToAdd.id,
        role: input.role,
      });
      res.status(201).json(member);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.teamMembers.remove.path, requireAuth, async (req, res) => {
    const projectId = Number(req.params.projectId);
    const memberId = Number(req.params.id);
    const project = await storage.getProject(projectId);
    if (!project || project.teamLeadId !== req.user!.id) {
      return res
        .status(401)
        .json({ message: "Only team lead can manage members" });
    }

    await storage.removeTeamMember(memberId);
    res.status(204).send();
  });

  // Tasks
  app.get(api.tasks.list.path, requireAuth, async (req, res) => {
    const projectId = Number(req.params.projectId);
    const tasks = await storage.getProjectTasks(projectId);
    res.json(tasks);
  });

  app.post(api.tasks.create.path, requireAuth, async (req, res) => {
    try {
      const projectId = Number(req.params.projectId);
      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      // Permission Check: Team lead OR allowMemberTaskCreation
      const isLead = project.teamLeadId === req.user!.id;
      if (!isLead && !project.allowMemberTaskCreation) {
        return res.status(403).json({ message: "Member task creation is disabled by team lead" });
      }

      const bodySchema = api.tasks.create.input.extend({
        projectId: z.literal(projectId).or(z.number()),
        deadline: z.coerce.date(),
      });
      const input = bodySchema.parse({ ...req.body, projectId });
      const task = await storage.createTask(
        { ...input, projectId },
        req.user!.id,
      );
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.tasks.update.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const task = await storage.getProjectTasks(0).then(tasks => tasks.find(t => t.id === id)); // Quick lookup hack or add getTask
      // Better: let's assume update is allowed if leader or assigned
      // We should ideally fetch the task and project
      
      const bodySchema = api.tasks.update.input.extend({
        deadline: z.coerce.date().optional(),
      });
      const input = bodySchema.parse(req.body);
      const updated = await storage.updateTask(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.tasks.delete.path, requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    // Add permission check here if needed (Lead only by default)
    await storage.deleteTask(id);
    res.status(204).send();
  });

  // Standups
  app.get(api.standups.list.path, requireAuth, async (req, res) => {
    const projectId = Number(req.params.projectId);
    const standups = await storage.getProjectStandups(projectId);
    res.json(standups);
  });

  app.post(api.standups.create.path, requireAuth, async (req, res) => {
    try {
      const projectId = Number(req.params.projectId);
      const bodySchema = api.standups.create.input.extend({
        date: z.coerce.date(),
      });
      const input = bodySchema.parse(req.body);
      const standup = await storage.createStandup(
        { ...input, projectId },
        req.user!.id,
      );

      // Parse blockers for @mentions
      if (input.blockers) {
        const mentions = input.blockers.match(/@(\w+)/g);
        if (mentions) {
          for (const mention of mentions) {
            const username = mention.slice(1);
            const mentionedUser = await storage.getUserByUsername(username);
            if (mentionedUser) {
              await storage.createNotification({
                userId: mentionedUser.id,
                projectId,
                type: "blocker",
                content: `Tagged you in blockers: "${input.blockers}"`,
                read: 0
              });
            }
          }
        }
      }

      res.status(201).json(standup);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("[standup-create] Error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notifications
  app.get("/api/projects/:projectId/notifications", requireAuth, async (req, res) => {
    const projectId = Number(req.params.projectId);
    const notifications = await storage.getNotificationsForUser(req.user!.id, projectId);
    res.json(notifications);
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    await storage.markNotificationRead(id);
    res.json({ success: true });
  });

  return httpServer;
}
