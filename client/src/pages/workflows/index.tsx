import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { getUserWorkflows, searchWorkflows, Workflow } from "@/lib/firebase";
import Sidebar from "@/components/layout/Sidebar";
import WorkflowList from "@/components/workflow/WorkflowList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

export default function WorkflowsPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Load workflows on component mount
  useEffect(() => {
    const loadWorkflows = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const data = await getUserWorkflows(user.uid);
        setWorkflows(data);
      } catch (error) {
        console.error("Error loading workflows:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflows();
  }, [user]);

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!user) return;
    
    setIsLoading(true);
    try {
      if (query.trim() === "") {
        const data = await getUserWorkflows(user.uid);
        setWorkflows(data);
      } else {
        const results = await searchWorkflows(user.uid, query);
        setWorkflows(results);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new workflow
  const handleCreateWorkflow = () => {
    setLocation("/workflows/editor");
  };

  // Handle workflow editing
  const handleEditWorkflow = (workflowId: string) => {
    setLocation(`/workflows/editor?id=${workflowId}`);
  };

  // Redirect to login if not authenticated
  if (!user && !isLoading) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto bg-neutral-50 pt-0 md:pt-0">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Workflows</h1>
              <p className="text-neutral-600 mt-1">Manage and create your automation workflows</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <Button 
                className="bg-primary text-white" 
                onClick={handleCreateWorkflow}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create workflow
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-4 border-b border-neutral-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-500" />
                </div>
                <Input 
                  type="text" 
                  placeholder="Search workflows by name or ID..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            
            <WorkflowList 
              workflows={workflows} 
              isLoading={isLoading} 
              onEdit={handleEditWorkflow}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
