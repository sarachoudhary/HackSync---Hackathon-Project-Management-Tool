import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useNotifications(projectId: number) {
  return useQuery({
    queryKey: [api.notifications.list.path(projectId)],
    queryFn: async () => {
      const url = api.notifications.list.path(projectId);
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return api.notifications.list.responses[200].parse(await res.json());
    },
    enabled: !!projectId,
    refetchInterval: 30000, // Refetch every 30s for updates
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = api.notifications.markRead.path(id);
      const res = await fetch(url, {
        method: api.notifications.markRead.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");
      return api.notifications.markRead.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects/"] }); // Invalidate project-related queries
    },
  });
}
