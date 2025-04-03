import { FC, useState } from "react";
import { Play, Edit2, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Workflow } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmRunModal from "./ConfirmRunModal";
import { executeWorkflow } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface WorkflowListProps {
  workflows: Workflow[];
  isLoading: boolean;
  onEdit: (id: string) => void;
}

const WorkflowList: FC<WorkflowListProps> = ({ workflows, isLoading, onEdit }) => {
  const { toast } = useToast();
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Handle workflow run button click
  const handleRunClick = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setShowRunModal(true);
  };

  // Execute the selected workflow
  const handleConfirmRun = async () => {
    if (!selectedWorkflow) return;
    
    setShowRunModal(false);
    setIsExecuting(true);
    
    try {
      const result = await executeWorkflow(selectedWorkflow);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Workflow executed successfully",
        });
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
      setIsExecuting(false);
    }
  };

  // Format the last run date
  const formatLastRun = (date: Date | undefined) => {
    if (!date) return "Never";
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Render loading skeletons
  if (isLoading) {
    return (
      <div className="divide-y divide-neutral-200">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4">
            <div className="flex items-center">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-16 ml-2" />
            </div>
            <div className="flex items-center mt-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28 ml-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render empty state
  if (workflows.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-600">No workflows found</p>
        <p className="text-neutral-500 text-sm mt-1">Create a new workflow to get started</p>
      </div>
    );
  }

  // Render workflow list
  return (
    <>
      <div className="divide-y divide-neutral-200">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="p-4 hover:bg-neutral-50 transition duration-150 flex flex-col sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="flex items-center">
                <h3 className="font-medium text-neutral-900">{workflow.name}</h3>
                <span 
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    workflow.status === "PASSED" 
                      ? "bg-green-100 text-green-600" 
                      : workflow.status === "FAILED" 
                      ? "bg-red-100 text-red-600" 
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {workflow.status}
                </span>
              </div>
              <div className="flex items-center text-sm text-neutral-500 mt-1">
                <span>WF-{workflow.id}</span>
                <span className="mx-2">•</span>
                <span>Last run: {formatLastRun(workflow.lastRun)}</span>
              </div>
            </div>
            
            <div className="flex items-center mt-4 sm:mt-0">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-neutral-500 hover:text-primary mr-2" 
                onClick={() => handleRunClick(workflow)}
                disabled={isExecuting}
              >
                <Play className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-neutral-500 hover:text-primary mr-2" 
                onClick={() => onEdit(workflow.id || "")}
              >
                <Edit2 className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-neutral-500 hover:text-neutral-700" 
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmRunModal
        isOpen={showRunModal}
        workflowName={selectedWorkflow?.name || ""}
        onClose={() => setShowRunModal(false)}
        onConfirm={handleConfirmRun}
      />
    </>
  );
};

export default WorkflowList;
