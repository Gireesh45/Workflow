import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  getWorkflow, 
  createWorkflow, 
  updateWorkflow,
  executeWorkflow
} from "@/lib/workflow";
import type { Workflow } from "@shared/schema";
import Sidebar from "@/components/layout/Sidebar";
import WorkflowCanvas from "@/components/workflow/WorkflowCanvas";
import ConfirmRunModal from "@/components/workflow/ConfirmRunModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Play, Save } from "lucide-react";
import { Node, Edge } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function WorkflowEditorPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Parse workflow ID from URL query
  const params = new URLSearchParams(location.split("?")[1] || "");
  const workflowId = params.get("id");

  // Workflow state
  const [workflow, setWorkflow] = useState<Partial<Workflow>>({
    name: "New Workflow",
    status: "IDLE",
    nodes: [],
    edges: [],
    userId: user?.id ? Number(user.id) : undefined,
  });
  
  const [isLoading, setIsLoading] = useState(workflowId ? true : false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);

  // Load workflow if editing existing one
  useEffect(() => {
    const loadWorkflow = async () => {
      if (!workflowId || !user) return;

      setIsLoading(true);
      try {
        const data = await getWorkflow(workflowId);
        if (data) {
          setWorkflow(data);
        } else {
          toast({
            title: "Workflow not found",
            description: "The requested workflow could not be found",
            variant: "destructive",
          });
          navigate("/workflows");
        }
      } catch (error) {
        console.error("Error loading workflow:", error);
        toast({
          title: "Error",
          description: "Failed to load workflow",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadWorkflow();
    }
  }, [workflowId, user, navigate, toast]);

  // Update workflow name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkflow({
      ...workflow,
      name: e.target.value,
    });
  };

  // Update nodes and edges
  const handleWorkflowUpdate = useCallback((nodes: Node[], edges: Edge[]) => {
    setWorkflow((prev: Workflow) => ({
      ...prev,
      nodes,
      edges,
    }));
  }, []);

  // Save workflow
  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to save workflows",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      let savedWorkflow;
      
      if (workflowId) {
        // Update existing workflow
        savedWorkflow = await updateWorkflow(workflowId, workflow);
        toast({
          title: "Success",
          description: "Workflow updated successfully",
        });
      } else {
        // Create new workflow
        savedWorkflow = await createWorkflow({
          ...workflow,
          userId: Number(user.id),
        });
        toast({
          title: "Success",
          description: "Workflow created successfully",
        });
        // Redirect to edit page with ID
        navigate(`/workflows/editor?id=${savedWorkflow.id}`);
      }
    } catch (error) {
      console.error("Error saving workflow:", error);
      toast({
        title: "Error",
        description: "Failed to save workflow",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset workflow
  const handleReset = () => {
    if (workflowId) {
      // If editing, reload from server
      getWorkflow(workflowId).then((data: Workflow | null) => {
        if (data) setWorkflow(data);
      });
    } else {
      // If new, reset to empty
      setWorkflow({
        name: "New Workflow",
        status: "IDLE",
        nodes: [],
        edges: [],
        userId: user?.id ? Number(user.id) : undefined,
      });
    }
    
    toast({
      title: "Workflow reset",
      description: "All changes have been discarded",
    });
  };

  // Run workflow
  const handleRun = () => {
    setShowRunModal(true);
  };

  // Confirm workflow execution
  const handleConfirmRun = async () => {
    setShowRunModal(false);
    setIsRunning(true);
    
    try {
      const result = await executeWorkflow(workflow);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Workflow executed successfully",
        });
        
        // Refresh workflow to get updated status
        if (workflowId) {
          const updatedWorkflow = await getWorkflow(workflowId);
          if (updatedWorkflow) {
            setWorkflow(updatedWorkflow);
          }
        }
      } else {
        toast({
          title: "Execution failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error executing workflow:", error);
      toast({
        title: "Error",
        description: "Failed to execute workflow",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Redirect to login if not authenticated
  if (!user && !isLoading) {
    navigate("/login");
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-4 text-neutral-500 hover:text-neutral-700" 
                onClick={() => navigate("/workflows")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div>
                <Input
                  type="text" 
                  value={workflow.name}
                  onChange={handleNameChange}
                  placeholder="Enter workflow name..." 
                  className="text-xl font-bold text-neutral-900 border-0 focus:ring-0 focus:outline-none bg-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center mt-4 md:mt-0 space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                disabled={isLoading || isSaving}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Reset
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRun}
                disabled={isLoading || isSaving || isRunning || workflow.nodes.length === 0}
              >
                <Play className="h-4 w-4 mr-1.5" />
                Run
              </Button>
              
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSave}
                disabled={isLoading || isSaving}
              >
                <Save className="h-4 w-4 mr-1.5" />
                Save
              </Button>
            </div>
          </div>
          
          <div className="flex border-t border-neutral-200 px-2">
            <Button variant="link" className="px-4 py-2 text-neutral-700 border-b-2 border-primary">
              Editor
            </Button>
            <Button variant="link" className="px-4 py-2 text-neutral-500">
              Settings
            </Button>
            <Button variant="link" className="px-4 py-2 text-neutral-500">
              History
            </Button>
          </div>
        </div>
        
        <WorkflowCanvas 
          nodes={workflow.nodes}
          edges={workflow.edges}
          isLoading={isLoading}
          onChange={handleWorkflowUpdate}
        />
        
        <ConfirmRunModal 
          isOpen={showRunModal}
          workflowName={workflow.name}
          onClose={() => setShowRunModal(false)}
          onConfirm={handleConfirmRun}
        />
      </div>
    </div>
  );
}
