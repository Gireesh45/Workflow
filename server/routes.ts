import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  loginSchema, 
  insertUserSchema, 
  insertWorkflowSchema, 
  workflowStatus
} from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";

// Create a session store backed by memorystore
const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "workflow-management-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Set session
      req.session.userId = user.id;
      
      res.status(201).json({ 
        id: user.id, 
        username: user.username, 
        email: user.email 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      res.json({ 
        id: user.id, 
        username: user.username, 
        email: user.email 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }
    
    res.json({ 
      id: user.id, 
      username: user.username, 
      email: user.email 
    });
  });

  // Workflow routes
  app.get("/api/workflows", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
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
      const userId = req.session.userId as number;
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
      const userId = req.session.userId as number;
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
      const userId = req.session.userId as number;
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
      const userId = req.session.userId as number;
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
      const userId = req.session.userId as number;
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
      // This is a simplified example - in a real app, you would:
      // 1. Parse the workflow nodes and edges
      // 2. Execute each node in the correct order based on edges
      // 3. Handle API calls, email sending, etc.

      const result = await executeWorkflow(workflow);
      
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
      message: error instanceof Error ? error.message : "Unknown error" 
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
