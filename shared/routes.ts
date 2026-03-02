import { z } from "zod";
import {
  insertUserSchema,
  insertProjectSchema,
  insertTeamMemberSchema,
  insertTaskSchema,
  insertStandupLogSchema,
  users,
  projects,
  teamMembers,
  tasks,
  standupLogs,
  notifications,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// Extended schema to include user object for tasks/members
export const teamMemberWithUserSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  userId: z.number(),
  role: z.string(),
  user: z.object({
    id: z.number(),
    username: z.string(),
  }),
});

export const taskWithUserSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  title: z.string(),
  description: z.string(),
  assignedUserId: z.number().nullable(),
  status: z.string(),
  deadline: z.string().or(z.date()),
  creatorId: z.number(),
  assignee: z
    .object({
      id: z.number(),
      username: z.string(),
    })
    .nullable(),
});

export const standupWithUserSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  userId: z.number(),
  date: z.string().or(z.date()),
  doneToday: z.string(),
  doTomorrow: z.string(),
  blockers: z.string(),
  user: z.object({
    id: z.number(),
    username: z.string(),
  }),
});

export const api = {
  auth: {
    user: {
      method: "GET" as const,
      path: "/api/user" as const,
      responses: {
        200: z.custom<Omit<typeof users.$inferSelect, "password">>(),
        401: errorSchemas.unauthorized,
      },
    },
    register: {
      method: "POST" as const,
      path: "/api/register" as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<Omit<typeof users.$inferSelect, "password">>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: "POST" as const,
      path: "/api/login" as const,
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: {
        200: z.custom<Omit<typeof users.$inferSelect, "password">>(),
        401: errorSchemas.unauthorized,
      },
    },
    registerCheck: {
      method: "POST" as const,
      path: "/api/auth/register-check" as const,
      input: z.object({
        username: z.string().min(3),
        email: z.string().email(),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout" as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    sendVerification: {
      method: "POST" as const,
      path: "/api/auth/send-verification" as const,
      input: z.object({ email: z.string().email() }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
      },
    },
    verifyOtp: {
      method: "POST" as const,
      path: "/api/auth/verify-otp" as const,
      input: z.object({
        email: z.string().email(),
        code: z.string().length(6),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
      },
    },
    firebaseVerify: {
      method: "POST" as const,
      path: "/api/auth/firebase-verify" as const,
      input: z.object({
        idToken: z.string(),
        username: z.string().optional(),
        password: z.string().optional(),
      }),
      responses: {
        200: z.custom<Omit<typeof users.$inferSelect, "password">>(),
        401: errorSchemas.unauthorized,
        400: errorSchemas.validation,
      },
    },
  },
  notifications: {
    list: {
      method: "GET" as const,
      path: (projectId: number) => `/api/projects/${projectId}/notifications` as const,
      responses: {
        200: z.array(z.custom<typeof notifications.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    markRead: {
      method: "POST" as const,
      path: (id: number) => `/api/notifications/${id}/read` as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  projects: {
    list: {
      method: "GET" as const,
      path: "/api/projects" as const,
      responses: {
        200: z.array(z.custom<typeof projects.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/projects/:id" as const,
      responses: {
        200: z.custom<typeof projects.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: "PATCH" as const,
      path: (id: number) => `/api/projects/${id}` as const,
      input: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        allowMemberTaskCreation: z.number().optional(),
      }),
      responses: {
        200: z.custom<typeof projects.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/projects" as const,
      input: insertProjectSchema,
      responses: {
        201: z.custom<typeof projects.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  teamMembers: {
    list: {
      method: "GET" as const,
      path: "/api/projects/:projectId/members" as const,
      responses: {
        200: z.array(teamMemberWithUserSchema),
        401: errorSchemas.unauthorized,
      },
    },
    add: {
      method: "POST" as const,
      path: "/api/projects/:projectId/members" as const,
      input: z.object({
        username: z.string(),
        role: z.enum(["lead", "member"]),
      }),
      responses: {
        201: z.custom<typeof teamMembers.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    remove: {
      method: "DELETE" as const,
      path: "/api/projects/:projectId/members/:id" as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  tasks: {
    list: {
      method: "GET" as const,
      path: "/api/projects/:projectId/tasks" as const,
      responses: {
        200: z.array(taskWithUserSchema),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/projects/:projectId/tasks" as const,
      input: insertTaskSchema,
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/tasks/:id" as const,
      input: insertTaskSchema.partial(),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/tasks/:id" as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  standups: {
    list: {
      method: "GET" as const,
      path: "/api/projects/:projectId/standups" as const,
      responses: {
        200: z.array(standupWithUserSchema),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/projects/:projectId/standups" as const,
      input: insertStandupLogSchema,
      responses: {
        201: z.custom<typeof standupLogs.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
