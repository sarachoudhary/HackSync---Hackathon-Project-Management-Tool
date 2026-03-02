import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { z } from "zod";

export function useTeamMembers(projectId: number) {
  return useQuery({
    queryKey: [api.teamMembers.list.path, projectId],
    queryFn: async () => {
      const url = buildUrl(api.teamMembers.list.path, { projectId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch team members");
      return api.teamMembers.list.responses[200].parse(await res.json());
    },
    enabled: !!projectId,
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      projectId: number;
      payload: z.infer<typeof api.teamMembers.add.input>;
    }) => {
      const url = buildUrl(api.teamMembers.add.path, {
        projectId: data.projectId,
      });
      const res = await fetch(url, {
        method: api.teamMembers.add.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add team member");
      return api.teamMembers.add.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.teamMembers.list.path, variables.projectId],
      });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { projectId: number; id: number }) => {
      const url = buildUrl(api.teamMembers.remove.path, {
        projectId: data.projectId,
        id: data.id,
      });
      const res = await fetch(url, {
        method: api.teamMembers.remove.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove team member");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.teamMembers.list.path, variables.projectId],
      });
    },
  });
}
