import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";

// Pages
import LoginPage from "@/pages/login";
import WorkflowsPage from "@/pages/workflows/index";
import WorkflowEditorPage from "@/pages/workflows/editor";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/workflows" component={WorkflowsPage} />
      <Route path="/workflows/editor" component={WorkflowEditorPage} />
      <Route path="/" component={WorkflowsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
