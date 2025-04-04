import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getUserWorkflows, searchWorkflows } from "@/lib/workflow";
import type { Workflow } from "@shared/schema";
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
        const data = await getUserWorkflows(user.id.toString());
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
        const data = await getUserWorkflows(user.id.toString());
        setWorkflows(data);
      } else {
        const results = await searchWorkflows(user.id.toString(), query);
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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-100">
        <div className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">Workflow Creator - List View</h1>
            <Button 
              className="bg-black hover:bg-black/90 text-white" 
              onClick={handleCreateWorkflow}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Process
            </Button>
          </div>
          
          <div className="bg-white rounded-md shadow">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">Workflow Builder</h2>
              
              <div className="relative w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input 
                  type="text" 
                  placeholder="Search by Workflow name/Id..." 
                  className="pl-10 h-9 border-gray-300 focus:border-gray-400 focus:ring-gray-400"
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
