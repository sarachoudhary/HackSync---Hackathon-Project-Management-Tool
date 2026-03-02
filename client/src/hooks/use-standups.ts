import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { z } from "zod";

export function useStandups(projectId: number) {
  return useQuery({
    queryKey: [api.standups.list.path, projectId],
    queryFn: async () => {
      const url = buildUrl(api.standups.list.path, { projectId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch standups");
      return api.standups.list.responses[200].parse(await res.json());
    },
    enabled: !!projectId,
  });
}

export function useCreateStandup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      projectId: number;
      log: z.infer<typeof api.standups.create.input>;
    }) => {
      const url = buildUrl(api.standups.create.path, {
        projectId: data.projectId,
      });
      const res = await fetch(url, {
        method: api.standups.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.log),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create standup log");
      return api.standups.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.standups.list.path, variables.projectId],
      });
    },
  });
}
