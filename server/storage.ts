import { users, type User, type InsertUser, workflows, type Workflow, type InsertWorkflow } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Workflow operations
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  getWorkflow(id: number): Promise<Workflow | undefined>;
  getWorkflowsByUserId(userId: number): Promise<Workflow[]>;
  updateWorkflow(id: number, workflow: Partial<Workflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<boolean>;
  searchWorkflows(userId: number, query: string): Promise<Workflow[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workflows: Map<number, Workflow>;
  private userIdCounter: number;
  private workflowIdCounter: number;

  constructor() {
    this.users = new Map();
    this.workflows = new Map();
    this.userIdCounter = 1;
    this.workflowIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Workflow methods
  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const id = this.workflowIdCounter++;
    const newWorkflow: Workflow = { 
      ...workflow, 
      id, 
      lastRun: workflow.lastRun || null 
    };
    this.workflows.set(id, newWorkflow);
    return newWorkflow;
  }

  async getWorkflow(id: number): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async getWorkflowsByUserId(userId: number): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(
      (workflow) => workflow.userId === userId
    );
  }

  async updateWorkflow(id: number, workflowUpdate: Partial<Workflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;

    const updatedWorkflow = { ...workflow, ...workflowUpdate };
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async deleteWorkflow(id: number): Promise<boolean> {
    return this.workflows.delete(id);
  }

  async searchWorkflows(userId: number, query: string): Promise<Workflow[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.workflows.values()).filter(
      (workflow) => 
        workflow.userId === userId && 
        (workflow.name.toLowerCase().includes(lowercaseQuery) || 
         `WF-${workflow.id}`.toLowerCase().includes(lowercaseQuery))
    );
  }
}

export const storage = new MemStorage();
