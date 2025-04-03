import { 
  users, type User, type InsertUser, 
  workflows, type Workflow, type InsertWorkflow,
  workflowResults, type WorkflowResult, type InsertWorkflowResult 
} from "@shared/schema";
import { db } from "./db";
import { eq, like, or, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

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
  
  // Workflow result operations
  createWorkflowResult(result: InsertWorkflowResult): Promise<WorkflowResult>;
  getWorkflowResults(workflowId: number): Promise<WorkflowResult[]>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Workflow methods
  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [newWorkflow] = await db.insert(workflows).values(workflow).returning();
    return newWorkflow;
  }

  async getWorkflow(id: number): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow;
  }

  async getWorkflowsByUserId(userId: number): Promise<Workflow[]> {
    return await db.select().from(workflows).where(eq(workflows.userId, userId));
  }

  async updateWorkflow(id: number, workflowUpdate: Partial<Workflow>): Promise<Workflow | undefined> {
    const [updatedWorkflow] = await db
      .update(workflows)
      .set(workflowUpdate)
      .where(eq(workflows.id, id))
      .returning();
    return updatedWorkflow;
  }

  async deleteWorkflow(id: number): Promise<boolean> {
    const result = await db.delete(workflows).where(eq(workflows.id, id));
    return result.count > 0;
  }

  async searchWorkflows(userId: number, query: string): Promise<Workflow[]> {
    const lowercaseQuery = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.userId, userId),
          or(
            like(workflows.name.toLowerCase(), lowercaseQuery)
          )
        )
      );
  }
  
  // Workflow result methods
  async createWorkflowResult(result: InsertWorkflowResult): Promise<WorkflowResult> {
    const [newResult] = await db.insert(workflowResults).values(result).returning();
    return newResult;
  }
  
  async getWorkflowResults(workflowId: number): Promise<WorkflowResult[]> {
    return await db
      .select()
      .from(workflowResults)
      .where(eq(workflowResults.workflowId, workflowId))
      .orderBy(workflowResults.executedAt, "desc");
  }
}

// Replace MemStorage with DatabaseStorage
export const storage = new DatabaseStorage();
