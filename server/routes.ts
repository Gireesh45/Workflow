import { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  loginSchema, 
  registerUserSchema,
  insertWorkflowSchema, 
  insertWorkflowResultSchema,
  workflowStatus,
  socialLoginSchema
} from "@shared/schema";
import { setupAuth, requireAuth } from "./auth";
import fetch from "node-fetch";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Social login endpoint
  app.post("/api/social-login", async (req, res) => {
    try {
      // Validate request
      const socialData = socialLoginSchema.parse(req.body);
      
      // Check if user already exists with this email
      let user = await storage.getUserByEmail(socialData.email);
      
      if (!user) {
        // Create new user if doesn't exist
        user = await storage.createUser({
          email: socialData.email,
          username: socialData.username,
          password: `social-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
          providerId: socialData.providerId,
          provider: socialData.provider,
          photoURL: socialData.photoURL || null
        });
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Error logging in" });
        }
        
        res.status(200).json(user);
      });
    } catch (error) {
      console.error("Social login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get user's workflows by user ID
  app.get("/api/workflows/user/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const currentUserId = (req.user as any).id;
      
      // Users can only view their own workflows
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const workflows = await storage.getWorkflowsByUserId(userId);
      res.json(workflows);
    } catch (error) {
      console.error("Error getting user workflows:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Search workflows
  app.get("/api/workflows/search", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const query = req.query.query as string;
      const currentUserId = (req.user as any).id;
      
      // Users can only search their own workflows
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const workflows = await storage.searchWorkflows(userId, query);
      res.json(workflows);
    } catch (error) {
      console.error("Error searching workflows:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Execute workflow (without ID)
  app.post("/api/workflows/execute", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const workflow = req.body;
      
      // Check if user owns this workflow
      if (workflow.userId && workflow.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Execute the workflow
      const result = await executeWorkflow(workflow);
      
      // If workflow has an ID, save the result and update the workflow
      if (workflow.id) {
        // Save the workflow execution result
        await storage.createWorkflowResult({
          workflowId: workflow.id,
          results: result.results || {},
          status: result.success ? "PASSED" : "FAILED"
        });
        
        // Update workflow status based on execution result
        await storage.updateWorkflow(workflow.id, {
          status: result.success ? "PASSED" : "FAILED",
          lastRun: new Date()
        });
      }
      
      res.json({
        success: result.success,
        message: result.message,
        results: result.results,
        nodes: result.nodes // Return nodes with status
      });
    } catch (error) {
      console.error("Workflow execution error:", error);
      res.status(500).json({ message: "Error executing workflow" });
    }
  });

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
        workflow: updatedWorkflow,
        nodes: result.nodes // Return nodes with status
      });
    } catch (error) {
      console.error("Workflow execution error:", error);
      res.status(500).json({ message: "Error executing workflow" });
    }
  });
  
  // AI-powered workflow generation endpoint
  app.post("/api/workflows/generate-template", requireAuth, async (req, res) => {
    try {
      const { description } = req.body;
      
      if (!description || typeof description !== 'string') {
        return res.status(400).json({ message: "Description is required" });
      }
      
      // Import dynamically to avoid loading Anthropic if not needed
      const { generateWorkflowTemplate } = await import('./utils/anthropic');
      
      // Generate workflow template using AI
      const template = await generateWorkflowTemplate(description);
      
      res.json(template);
    } catch (error) {
      console.error("Workflow generation error:", error);
      res.status(500).json({ message: "Error generating workflow template" });
    }
  });
  
  // AI-powered workflow analysis endpoint
  app.post("/api/workflows/:id/analyze", requireAuth, async (req, res) => {
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
      
      // Import dynamically to avoid loading Anthropic if not needed
      const { analyzeWorkflow } = await import('./utils/anthropic');
      
      // Analyze workflow using AI
      const analysis = await analyzeWorkflow(workflow);
      
      res.json({ analysis });
    } catch (error) {
      console.error("Workflow analysis error:", error);
      res.status(500).json({ message: "Error analyzing workflow" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to execute a workflow
async function executeWorkflow(workflow: any) {
  try {
    // Get nodes and edges
    const nodes = JSON.parse(JSON.stringify(workflow.nodes || [])); // Deep copy to avoid modifying original
    const edges = workflow.edges || [];
    
    // Find the start node
    const startNode = nodes.find((node: any) => node.type === "START");
    if (!startNode) {
      return { success: false, message: "No start node found" };
    }
    
    // Set initial status for all nodes to IDLE
    nodes.forEach((node: any) => {
      if (!node.data) node.data = {};
      node.data.status = "IDLE";
    });
    
    // Set start node status to PASSED
    const startNodeIndex = nodes.findIndex((node: any) => node.id === startNode.id);
    if (startNodeIndex !== -1) {
      nodes[startNodeIndex].data.status = "PASSED";
    }
    
    try {
      // Execute each node in the workflow
      const results = await executeNode(startNode.id, nodes, edges, {});
      
      return { 
        success: true, 
        message: "Workflow executed successfully",
        results,
        nodes // Return updated nodes with status
      };
    } catch (err) {
      // Find which node failed
      const error = err as any;
      const failedNodeId = error?.nodeId;
      if (failedNodeId) {
        const failedNodeIndex = nodes.findIndex((n: any) => n.id === failedNodeId);
        if (failedNodeIndex !== -1) {
          nodes[failedNodeIndex].data.status = "FAILED";
        }
      }
      
      return { 
        success: false, 
        message: err instanceof Error ? err.message : "Unknown error",
        results: {},
        nodes // Return updated nodes with status
      };
    }
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
  const nodeIndex = nodes.findIndex((n) => n.id === nodeId);
  if (nodeIndex === -1) {
    const error: any = new Error(`Node ${nodeId} not found`);
    error.nodeId = nodeId;
    throw error;
  }
  
  const node = nodes[nodeIndex];
  let nodeResult: any = {};
  
  try {
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
          
          // Update node status to PASSED
          nodes[nodeIndex].data.status = "PASSED";
        } catch (error) {
          // Update node status to FAILED
          nodes[nodeIndex].data.status = "FAILED";
          
          const customError: any = new Error(`API request failed: ${error instanceof Error ? error.message : "Unknown error"}`);
          customError.nodeId = nodeId;
          throw customError;
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
          
          // Update node status to PASSED
          nodes[nodeIndex].data.status = "PASSED";
        } catch (error) {
          // Update node status to FAILED
          nodes[nodeIndex].data.status = "FAILED";
          
          const customError: any = new Error(`Email sending failed: ${error instanceof Error ? error.message : "Unknown error"}`);
          customError.nodeId = nodeId;
          throw customError;
        }
        break;
        
      case "TEXT":
        try {
          // Process text content
          nodeResult = { 
            status: "success", 
            text: node.data?.text || ""
          };
          
          // Update node status to PASSED
          nodes[nodeIndex].data.status = "PASSED";
        } catch (error) {
          // Update node status to FAILED
          nodes[nodeIndex].data.status = "FAILED";
          
          const customError: any = new Error(`Text processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
          customError.nodeId = nodeId;
          throw customError;
        }
        break;
        
      case "CONDITION":
        // In a real app, you would evaluate a condition here
        // For this example, we'll just pass through
        nodeResult = { status: "success" };
        
        // Update node status to PASSED
        nodes[nodeIndex].data.status = "PASSED";
        break;
        
      case "END":
        // End node doesn't do anything
        nodeResult = { status: "success" };
        
        // Update node status to PASSED
        nodes[nodeIndex].data.status = "PASSED";
        
        return { ...data, [nodeId]: nodeResult };
        
      default:
        // Update node status to FAILED
        nodes[nodeIndex].data.status = "FAILED";
        
        const customError: any = new Error(`Unknown node type: ${node.type}`);
        customError.nodeId = nodeId;
        throw customError;
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
  } catch (error) {
    // If a child node failed, propagate the error
    throw error;
  }
}
