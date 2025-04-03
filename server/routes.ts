import { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  loginSchema, 
  registerUserSchema,
  insertWorkflowSchema, 
  insertWorkflowResultSchema,
  workflowStatus
} from "@shared/schema";
import { setupAuth, requireAuth } from "./auth";
import fetch from "node-fetch";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Workflow routes
  app.get("/api/workflows", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const searchQuery = req.query.q as string | undefined;
      
      let workflows;
      if (searchQuery) {
        workflows = await storage.searchWorkflows(userId, searchQuery);
      } else {
        workflows = await storage.getWorkflowsByUserId(userId);
      }
      
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/workflows", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const workflowData = insertWorkflowSchema.parse({
        ...req.body,
        userId
      });
      
      const workflow = await storage.createWorkflow(workflowData);
      res.status(201).json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/workflows/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const workflowId = parseInt(req.params.id);
      
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Check if user owns this workflow
      if (workflow.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/workflows/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const workflowId = parseInt(req.params.id);
      
      // Verify workflow exists and belongs to user
      const existingWorkflow = await storage.getWorkflow(workflowId);
      if (!existingWorkflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      if (existingWorkflow.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Update workflow
      const updatedWorkflow = await storage.updateWorkflow(workflowId, req.body);
      res.json(updatedWorkflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/workflows/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const workflowId = parseInt(req.params.id);
      
      // Verify workflow exists and belongs to user
      const existingWorkflow = await storage.getWorkflow(workflowId);
      if (!existingWorkflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      if (existingWorkflow.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Delete workflow
      await storage.deleteWorkflow(workflowId);
      res.json({ message: "Workflow deleted" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Workflow execution endpoint
  app.post("/api/workflows/:id/execute", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const workflowId = parseInt(req.params.id);
      
      // Verify workflow exists and belongs to user
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      if (workflow.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Execute the workflow
      const result = await executeWorkflow(workflow);
      
      // Save the workflow execution result
      await storage.createWorkflowResult({
        workflowId,
        results: result.results || {},
        status: result.success ? "PASSED" : "FAILED"
      });
      
      // Update workflow status based on execution result
      const updatedWorkflow = await storage.updateWorkflow(workflowId, {
        status: result.success ? "PASSED" : "FAILED",
        lastRun: new Date()
      });
      
      res.json({
        success: result.success,
        message: result.message,
        workflow: updatedWorkflow
      });
    } catch (error) {
      console.error("Workflow execution error:", error);
      res.status(500).json({ message: "Error executing workflow" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to execute a workflow
async function executeWorkflow(workflow: any) {
  try {
    // Get nodes and edges
    const nodes = workflow.nodes || [];
    const edges = workflow.edges || [];
    
    // Find the start node
    const startNode = nodes.find((node: any) => node.type === "START");
    if (!startNode) {
      return { success: false, message: "No start node found" };
    }
    
    // Execute each node in the workflow
    const results = await executeNode(startNode.id, nodes, edges, {});
    
    return { 
      success: true, 
      message: "Workflow executed successfully",
      results
    };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error",
      results: {}
    };
  }
}

// Helper function to execute a single node and its downstream nodes
async function executeNode(nodeId: string, nodes: any[], edges: any[], data: any) {
  // Find the current node
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) throw new Error(`Node ${nodeId} not found`);
  
  let nodeResult: any = {};
  
  // Execute based on node type
  switch (node.type) {
    case "START":
      // Start node doesn't do anything
      nodeResult = { status: "success" };
      break;
      
    case "API":
      try {
        // Make API request
        const url = node.data?.url || "";
        const method = node.data?.method || "GET";
        
        const response = await fetch(url, { method });
        const responseData = await response.json();
        
        nodeResult = { 
          status: "success", 
          data: responseData 
        };
      } catch (error) {
        throw new Error(`API request failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      break;
      
    case "EMAIL":
      try {
        // In a real app, you would send an actual email here
        // For this example, we'll just simulate success
        nodeResult = { 
          status: "success", 
          to: node.data?.to,
          subject: node.data?.subject,
          body: node.data?.body || JSON.stringify(data)
        };
      } catch (error) {
        throw new Error(`Email sending failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      break;
      
    case "CONDITION":
      // In a real app, you would evaluate a condition here
      // For this example, we'll just pass through
      nodeResult = { status: "success" };
      break;
      
    case "END":
      // End node doesn't do anything
      nodeResult = { status: "success" };
      return { ...data, [nodeId]: nodeResult };
      
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
  
  // Merge result into data
  const updatedData = { ...data, [nodeId]: nodeResult };
  
  // Find outgoing edges
  const outgoingEdges = edges.filter((e) => e.source === nodeId);
  
  // Execute next nodes
  for (const edge of outgoingEdges) {
    await executeNode(edge.target, nodes, edges, updatedData);
  }
  
  return updatedData;
}
