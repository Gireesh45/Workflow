import React, { FC, useState, useEffect } from "react";
import { Play, Edit2, MoreVertical, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Workflow, WorkflowStatus, WorkflowResult } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import ConfirmRunModal from "./ConfirmRunModal";
import { executeWorkflow } from "@/lib/workflow";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkflowListProps {
  workflows: Workflow[];
  isLoading: boolean;
  onEdit: (id: string) => void;
}

// Dummy mock execution history (replace with actual API data)
const getDummyExecutionHistory = (workflowId: number): any[] => {
  return [
    {
      id: 1,
      workflowId,
      status: "PASSED",
      executedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      results: { message: "Workflow executed successfully" }
    },
    {
      id: 2,
      workflowId,
      status: "FAILED", 
      executedAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      results: { error: "API call failed with status 500" }
    },
    {
      id: 3,
      workflowId,
      status: "FAILED",
      executedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      results: { error: "Email sending failed: Invalid recipient address" }
    }
  ];
};

const WorkflowList: FC<WorkflowListProps> = ({ workflows, isLoading, onEdit }) => {
  const { toast } = useToast();
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [expandedWorkflows, setExpandedWorkflows] = useState<Record<string, boolean>>({});
  const [workflowResults, setWorkflowResults] = useState<Record<number, any[]>>({});

  // Get execution history for workflows
  useEffect(() => {
    const fetchResults = async () => {
      const results = {} as Record<number, any[]>;
      
      // In a real implementation, we would fetch from the API
      workflows.forEach((workflow) => {
        if (workflow.id) {
          results[workflow.id] = getDummyExecutionHistory(workflow.id);
        }
      });
      
      setWorkflowResults(results);
    };
    
    fetchResults();
  }, [workflows]);
  
  // Toggle expanded state for a workflow
  const toggleWorkflowExpansion = (workflowId: string) => {
    setExpandedWorkflows(prev => ({
      ...prev,
      [workflowId]: !prev[workflowId]
    }));
  };

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

  // Format the edited date
  const formatEditedDate = (date: string | Date | undefined) => {
    if (!date) return "Never";
    const editedDate = new Date(date);
    return `${editedDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })} | ${editedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
  };

  // Render loading skeletons
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                <Skeleton className="h-4 w-24" />
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                <Skeleton className="h-4 w-24" />
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                <Skeleton className="h-4 w-32" />
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50"></th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i}>
                <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                  <Skeleton className="h-5 w-32" />
                </td>
                <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                  <Skeleton className="h-4 w-48" />
                </td>
                <td className="px-6 py-4 whitespace-no-wrap text-right border-b border-gray-200">
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-20 mx-1" />
                    <Skeleton className="h-8 w-16 mx-1" />
                    <Skeleton className="h-8 w-8 mx-1" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Render empty state
  if (workflows.length === 0) {
    return (
      <div className="border rounded-lg bg-white p-8 text-center">
        <p className="text-neutral-600">No workflows found</p>
        <p className="text-neutral-500 text-sm mt-1">Create a new workflow to get started</p>
      </div>
    );
  }

  // Generate page numbers
  const totalPages = Math.max(1, Math.ceil(workflows.length / 8));
  const pageNumbers = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1);
    if (activePage > 3) pageNumbers.push('...');
    
    for (let i = Math.max(2, activePage - 1); i <= Math.min(activePage + 1, totalPages - 1); i++) {
      pageNumbers.push(i);
    }
    
    if (activePage < totalPages - 2) pageNumbers.push('...');
    pageNumbers.push(totalPages);
  }

  // Render workflow list
  return (
    <>
      <div className="border rounded-lg bg-white">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium">Workflow Builder</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workflow Name
                </th>
                <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Edited On
                </th>
                <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 bg-gray-50 text-right"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workflows.map((workflow) => (
                <React.Fragment key={workflow.id?.toString()}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{workflow.name ?? "Workflow Name here..."}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">#{workflow.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatEditedDate(workflow.updatedAt || new Date())}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {workflow.description ?? "Some Description here Regarding The flow..."}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mx-1"
                          onClick={() => handleRunClick(workflow)}
                          disabled={isExecuting}
                        >
                          Execute
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mx-1"
                          onClick={() => onEdit(workflow.id?.toString() || "")}
                        >
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 mx-1">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => alert("Duplicate feature coming soon")}>
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => alert("Export feature coming soon")}>
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => alert("Delete feature coming soon")}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 mx-1"
                          onClick={() => toggleWorkflowExpansion(workflow.id?.toString() || "")}
                        >
                          {expandedWorkflows[workflow.id?.toString() || ""] ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Execution History Panel */}
                  {expandedWorkflows[workflow.id?.toString() || ""] && workflow.id && (
                    <tr>
                      <td colSpan={5} className="bg-gray-50 px-4 py-2">
                        <div className="px-2 py-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Execution History</h4>
                          
                          <div className="space-y-3">
                            {workflowResults[workflow.id]?.length > 0 ? (
                              workflowResults[workflow.id].map((result, index) => (
                                <div key={index} className="bg-white rounded-md border p-3 flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                      <Badge className={result.status === "PASSED" 
                                        ? "bg-green-500 text-white border-transparent hover:bg-green-600" 
                                        : "bg-destructive text-destructive-foreground border-transparent hover:bg-destructive/80"}>
                                        {result.status}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        {new Date(result.executedAt).toLocaleDateString()} {new Date(result.executedAt).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {result.status === "PASSED" 
                                        ? (result.results)?.message || "Workflow executed successfully" 
                                        : (result.results)?.error || "Execution failed"}
                                    </p>
                                  </div>
                                  <Button variant="ghost" size="sm" className="h-8 w-8">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-sm text-gray-500">No execution history available</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-6 py-3 flex items-center justify-center border-t border-gray-200">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 mr-2"
              onClick={() => setActivePage(Math.max(1, activePage - 1))}
              disabled={activePage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {pageNumbers.map((page, index) => (
              typeof page === 'number' ? (
                <Button
                  key={index}
                  variant={page === activePage ? "default" : "ghost"}
                  size="sm"
                  className={`h-8 w-8 mx-1 ${page === activePage ? 'bg-primary text-white' : ''}`}
                  onClick={() => setActivePage(page)}
                >
                  {page}
                </Button>
              ) : (
                <span key={index} className="mx-1">...</span>
              )
            ))}
            
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 ml-2"
              onClick={() => setActivePage(Math.min(totalPages, activePage + 1))}
              disabled={activePage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
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