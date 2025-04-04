import { apiRequest } from "./queryClient";
import { Node, Edge, Workflow } from "@shared/schema";

// Get workflows for a user
export async function getUserWorkflows(userId: string): Promise<Workflow[]> {
  const response = await apiRequest('GET', `/api/workflows/user/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch workflows');
  }
  return await response.json();
}

// Get a specific workflow
export async function getWorkflow(workflowId: string): Promise<Workflow | null> {
  const response = await apiRequest('GET', `/api/workflows/${workflowId}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to fetch workflow');
  }
  return await response.json();
}

// Create a new workflow
export async function createWorkflow(workflow: Partial<Workflow>): Promise<Workflow> {
  const response = await apiRequest('POST', '/api/workflows', workflow);
  if (!response.ok) {
    throw new Error('Failed to create workflow');
  }
  return await response.json();
}

// Update an existing workflow
export async function updateWorkflow(workflowId: string, workflow: Partial<Workflow>): Promise<Workflow> {
  const response = await apiRequest('PATCH', `/api/workflows/${workflowId}`, workflow);
  if (!response.ok) {
    throw new Error('Failed to update workflow');
  }
  return await response.json();
}

// Execute a workflow
export async function executeWorkflow(workflow: Workflow): Promise<{success: boolean, message?: string}> {
  const response = await apiRequest('POST', `/api/workflows/execute`, workflow);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({message: 'Unknown error occurred'}));
    return {
      success: false,
      message: errorData.message || 'Failed to execute workflow'
    };
  }
  return {
    success: true
  };
}

// Search workflows
export async function searchWorkflows(userId: string, query: string): Promise<Workflow[]> {
  const response = await apiRequest('GET', `/api/workflows/search?userId=${userId}&query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to search workflows');
  }
  return await response.json();
}

// Get workflow execution results
export async function getWorkflowResults(workflowId: number | string): Promise<any[]> {
  try {
    const response = await apiRequest('GET', `/api/workflows/${workflowId}/results`);
    if (!response.ok) {
      throw new Error('Failed to fetch workflow results');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching workflow results:', error);
    return [];
  }
}