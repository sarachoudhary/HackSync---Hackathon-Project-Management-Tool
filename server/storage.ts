import { db } from "./db";
import {
  users,
  projects,
  teamMembers,
  tasks,
  standupLogs,
  notifications,
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type TeamMember,
  type InsertTeamMember,
  type Task,
  type InsertTask,
  type StandupLog,
  type InsertStandupLog,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;

  // Projects
  getProjectsForUser(userId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject, teamLeadId: number): Promise<Project>;
  updateProject(id: number, updates: Partial<Project>): Promise<Project>;

  // Team Members
  getProjectMembers(
    projectId: number,
  ): Promise<(TeamMember & { user: { id: number; username: string } })[]>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(id: number): Promise<void>;
  getMemberByProjectAndUser(
    projectId: number,
    userId: number,
  ): Promise<TeamMember | undefined>;

  // Tasks
  getProjectTasks(
    projectId: number,
  ): Promise<(Task & { assignee: { id: number; username: string } | null })[]>;
  createTask(task: InsertTask, creatorId: number): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // Standups
  getProjectStandups(
    projectId: number,
  ): Promise<(StandupLog & { user: { id: number; username: string } })[]>;
  createStandup(standup: InsertStandupLog, userId: number): Promise<StandupLog>;

  // Notifications
  getNotificationsForUser(userId: number, projectId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Projects
  async getProjectsForUser(userId: number): Promise<Project[]> {
    const ledProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.teamLeadId, userId));
    const memberProjectsQuery = await db
      .select({ project: projects })
      .from(teamMembers)
      .innerJoin(projects, eq(teamMembers.projectId, projects.id))
      .where(eq(teamMembers.userId, userId));

    const memberProjects = memberProjectsQuery.map((row) => row.project);

    // Deduplicate
    const allProjects = [...ledProjects, ...memberProjects];
    const uniqueMap = new Map();
    for (const p of allProjects) {
      uniqueMap.set(p.id, p);
    }
    return Array.from(uniqueMap.values());
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project;
  }

  async createProject(
    insertProject: InsertProject,
    teamLeadId: number,
  ): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values({
        ...insertProject,
        teamLeadId,
        allowMemberTaskCreation: 0,
      })
      .returning();

    await this.addTeamMember({
      projectId: project.id,
      userId: teamLeadId,
      role: "lead",
    });

    return project;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project> {
    const [updated] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  // Team Members
  async getProjectMembers(
    projectId: number,
  ): Promise<(TeamMember & { user: { id: number; username: string } })[]> {
    const rows = await db
      .select({
        member: teamMembers,
        user: { id: users.id, username: users.username },
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.projectId, projectId));

    return rows.map((r) => ({ ...r.member, user: r.user }));
  }

  async addTeamMember(member: InsertTeamMember & { projectId: number }): Promise<TeamMember> {
    const [newMember] = await db.insert(teamMembers).values(member).returning();
    return newMember;
  }

  async removeTeamMember(id: number): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  async getMemberByProjectAndUser(
    projectId: number,
    userId: number,
  ): Promise<TeamMember | undefined> {
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.projectId, projectId),
          eq(teamMembers.userId, userId),
        ),
      );
    return member;
  }

  // Tasks
  async getProjectTasks(
    projectId: number,
  ): Promise<(Task & { assignee: { id: number; username: string } | null })[]> {
    const rows = await db
      .select({
        task: tasks,
        assignee: { id: users.id, username: users.username },
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedUserId, users.id))
      .where(eq(tasks.projectId, projectId));

    return rows.map((r) => ({ ...r.task, assignee: r.assignee }));
  }

  async createTask(task: InsertTask & { projectId: number }, creatorId: number): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values({ ...task, creatorId })
      .returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task> {
    const [updated] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Standups
  async getProjectStandups(
    projectId: number,
  ): Promise<(StandupLog & { user: { id: number; username: string } })[]> {
    const rows = await db
      .select({
        standup: standupLogs,
        user: { id: users.id, username: users.username },
      })
      .from(standupLogs)
      .innerJoin(users, eq(standupLogs.userId, users.id))
      .where(eq(standupLogs.projectId, projectId));

    return rows.map((r) => ({ ...r.standup, user: r.user }));
  }

  async createStandup(
    standup: InsertStandupLog & { projectId: number },
    userId: number,
  ): Promise<StandupLog> {
    const [newStandup] = await db
      .insert(standupLogs)
      .values({ ...standup, userId })
      .returning();
    return newStandup;
  }

  // Notifications
  async getNotificationsForUser(userId: number, projectId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.projectId, projectId)
        )
      );
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: 1 })
      .where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
