import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed
  emailVerified: integer("email_verified").notNull().default(0), // 0 for false, 1 for true
  otpCode: text("otp_code"),
  otpExpiry: timestamp("otp_expiry"),
});

// Projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hackathonName: text("hackathon_name").notNull(),
  description: text("description").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  teamLeadId: integer("team_lead_id").notNull(),
  allowMemberTaskCreation: integer("allow_member_task_creation").notNull().default(0), // 0 for false, 1 for true
});

// Team Members
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull(), // 'lead' or 'member'
});

// Tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  assignedUserId: integer("assigned_user_id"),
  status: text("status").notNull(), // 'todo', 'in_progress', 'done'
  deadline: timestamp("deadline").notNull(),
  creatorId: integer("creator_id").notNull(),
});

// Standup Logs
export const standupLogs = pgTable("standup_logs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull(),
  doneToday: text("done_today").notNull(),
  doTomorrow: text("do_tomorrow").notNull(),
  blockers: text("blockers").notNull(),
});

// Notifications (for blocker tags etc.)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'blocker'
  read: integer("read").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  emailVerified: true,
  otpCode: true,
  otpExpiry: true,
});
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  teamLeadId: true,
  allowMemberTaskCreation: true,
});
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  projectId: true,
});
export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  projectId: true,
  creatorId: true,
});
export const insertStandupLogSchema = createInsertSchema(standupLogs).omit({
  id: true,
  projectId: true,
  userId: true,
});
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type StandupLog = typeof standupLogs.$inferSelect;
export type InsertStandupLog = z.infer<typeof insertStandupLogSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
