import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { ThemeProvider } from "@/components/theme-provider";

import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";

import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import ProjectView from "@/pages/project-view";
import Verify from "@/pages/verify";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={Auth} />
      <Route path="/verify" component={Verify} />

      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/projects/:id">
        <ProtectedRoute>
          <ProjectView />
        </ProtectedRoute>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="hacksync-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Layout>
            <Router />
          </Layout>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
