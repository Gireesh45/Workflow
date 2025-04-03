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
import { WorkflowAnalyzer } from "@/components/workflow/WorkflowAnalyzer";
import ConfirmRunModal from "@/components/workflow/ConfirmRunModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, RefreshCw, Play, Save, LineChart, Cable } from "lucide-react";
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
  const [workflow, setWorkflow] = useState<Partial<Workflow> & {nodes: Node[], edges: Edge[]}>({
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
          // Cast the nodes and edges to the correct types
          const typedWorkflow = {
            ...data,
            nodes: Array.isArray(data.nodes) ? data.nodes : [],
            edges: Array.isArray(data.edges) ? data.edges : []
          };
          setWorkflow(typedWorkflow);
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
    setWorkflow((prev) => ({
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
        if (data) {
          // Cast the nodes and edges to the correct types
          const typedWorkflow = {
            ...data,
            nodes: Array.isArray(data.nodes) ? data.nodes : [],
            edges: Array.isArray(data.edges) ? data.edges : []
          };
          setWorkflow(typedWorkflow);
        }
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
      // Cast workflow to Workflow type for execution 
      const workflowWithId = { 
        ...workflow, 
        id: Number(workflowId) || 0
      } as Workflow;
      const result = await executeWorkflow(workflowWithId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Workflow executed successfully",
        });
        
        // Refresh workflow to get updated status
        if (workflowId) {
          const updatedWorkflow = await getWorkflow(workflowId);
          if (updatedWorkflow) {
            // Cast the nodes and edges to the correct types
            const typedWorkflow = {
              ...updatedWorkflow,
              nodes: Array.isArray(updatedWorkflow.nodes) ? updatedWorkflow.nodes : [],
              edges: Array.isArray(updatedWorkflow.edges) ? updatedWorkflow.edges : []
            };
            setWorkflow(typedWorkflow);
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
          
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="border-b border-neutral-200 w-full justify-start rounded-none h-auto p-0">
              <TabsTrigger 
                value="editor" 
                className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
              >
                <Cable className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
              
              {workflowId && (
                <TabsTrigger 
                  value="analysis" 
                  className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
                >
                  <LineChart className="h-4 w-4 mr-2" />
                  AI Analysis
                </TabsTrigger>
              )}
              
              <TabsTrigger 
                value="settings" 
                className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
              >
                Settings
              </TabsTrigger>
              
              <TabsTrigger 
                value="history" 
                className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
              >
                History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <Tabs defaultValue="editor" className="flex-1 overflow-hidden">
          <TabsContent value="editor" className="h-full m-0 p-0 data-[state=active]:flex-1 data-[state=active]:flex">
            <WorkflowCanvas 
              nodes={workflow.nodes}
              edges={workflow.edges}
              isLoading={isLoading}
              onChange={handleWorkflowUpdate}
            />
          </TabsContent>
          
          <TabsContent value="analysis" className="m-0 p-6 overflow-y-auto">
            {workflowId ? (
              <WorkflowAnalyzer workflow={workflow as Workflow} />
            ) : (
              <div className="text-center p-6">
                <p>Save your workflow first to access AI analysis</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="m-0 p-6 overflow-y-auto">
            <div className="text-center p-6">
              <p>Workflow settings will be available soon</p>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="m-0 p-6 overflow-y-auto">
            <div className="text-center p-6">
              <p>Workflow execution history will be available soon</p>
            </div>
          </TabsContent>
        </Tabs>
        
        <ConfirmRunModal 
          isOpen={showRunModal}
          workflowName={workflow.name || ""}
          onClose={() => setShowRunModal(false)}
          onConfirm={handleConfirmRun}
        />
      </div>
    </div>
  );
}
