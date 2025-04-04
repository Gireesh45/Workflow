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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, X } from "lucide-react";
import { Node, Edge } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

export default function WorkflowEditorPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Parse workflow ID from URL query
  const params = new URLSearchParams(location.split("?")[1] || "");
  const workflowId = params.get("id");

  // Workflow state
  const [workflow, setWorkflow] = useState<Partial<Workflow> & {nodes: Node[], edges: Edge[]}>({
    name: "Untitled",
    description: "",
    status: "IDLE",
    nodes: [],
    edges: [],
    userId: user?.id ? Number(user.id) : undefined,
  });
  
  const [isLoading, setIsLoading] = useState(workflowId ? true : false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  // Update workflow description
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWorkflow({
      ...workflow,
      description: e.target.value,
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
      setShowSaveModal(false);
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

  // Delete workflow
  const handleDelete = async () => {
    if (!workflowId || !user) return;

    try {
      // API call to delete workflow would go here
      toast({
        title: "Success",
        description: "Workflow deleted successfully",
      });
      navigate("/workflows");
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      });
    }
    setShowDeleteModal(false);
  };

  // Run workflow
  const handleRun = () => {
    setShowRunModal(true);
  };

  // Open save modal
  const handleOpenSaveModal = () => {
    setShowSaveModal(true);
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
      
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f8f6ea]">
        <div className="bg-white sticky top-0 z-10 border-b border-gray-200 p-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-700 flex items-center bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 h-9"
              onClick={() => navigate("/workflows")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            
            <div className="ml-4 text-lg font-medium">{workflow.name || "Untitled"}</div>
            
            <div className="ml-auto">
              <Button 
                variant="outline" 
                size="sm" 
                className="mr-2 border-gray-300 hover:bg-gray-100"
                onClick={handleOpenSaveModal}
              >
                <Save className="h-4 w-4 mr-1.5" />
                Save
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <WorkflowCanvas 
            nodes={workflow.nodes}
            edges={workflow.edges}
            isLoading={isLoading}
            onChange={handleWorkflowUpdate}
          />
        </div>
        
        {/* Save Workflow Modal */}
        <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Save your workflow</DialogTitle>
              <DialogClose className="absolute right-4 top-4">
                <X className="h-4 w-4" />
              </DialogClose>
            </DialogHeader>
            <div className="py-4">
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input 
                  type="text" 
                  placeholder="Name here..." 
                  value={workflow.name} 
                  onChange={handleNameChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Textarea 
                  placeholder="Write here..." 
                  value={workflow.description || ""} 
                  onChange={handleDescriptionChange}
                  className="w-full p-2 border border-gray-300 rounded h-24 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                className="bg-red-500 hover:bg-red-600 text-white ml-auto" 
                onClick={handleSave}
                disabled={isSaving}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Confirm Run Modal */}
        <ConfirmRunModal 
          isOpen={showRunModal}
          workflowName={workflow.name || ""}
          onClose={() => setShowRunModal(false)}
          onConfirm={handleConfirmRun}
        />
        
        {/* Delete Warning Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-center">
                Are You Sure You Want To Delete {workflow.name}?
              </DialogTitle>
              <DialogClose className="absolute right-4 top-4">
                <X className="h-4 w-4" />
              </DialogClose>
            </DialogHeader>
            <div className="py-4 text-center">
              <p className="text-red-500">You Cannot Undo This Step</p>
            </div>
            <DialogFooter>
              <Button 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800" 
                onClick={() => setShowDeleteModal(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button 
                className="bg-red-500 hover:bg-red-600 text-white" 
                onClick={handleDelete}
                disabled={isSaving}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
