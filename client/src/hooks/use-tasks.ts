import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { z } from "zod";

export function useTasks(projectId: number) {
  return useQuery({
    queryKey: [api.tasks.list.path, projectId],
    queryFn: async () => {
      const url = buildUrl(api.tasks.list.path, { projectId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return api.tasks.list.responses[200].parse(await res.json());
    },
    enabled: !!projectId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      projectId: number;
      task: z.infer<typeof api.tasks.create.input>;
    }) => {
      const url = buildUrl(api.tasks.create.path, {
        projectId: data.projectId,
      });
      const res = await fetch(url, {
        method: api.tasks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.task),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create task");
      return api.tasks.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.tasks.list.path, variables.projectId],
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: number;
      projectId: number;
      updates: z.infer<typeof api.tasks.update.input>;
    }) => {
      const url = buildUrl(api.tasks.update.path, { id: data.id });
      const res = await fetch(url, {
        method: api.tasks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update task");
      return api.tasks.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.tasks.list.path, variables.projectId],
      });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; projectId: number }) => {
      const url = buildUrl(api.tasks.delete.path, { id: data.id });
      const res = await fetch(url, {
        method: api.tasks.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete task");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.tasks.list.path, variables.projectId],
      });
    },
  });
}
