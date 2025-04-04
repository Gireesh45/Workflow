import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  email: text("email").notNull().unique(),
  providerId: text("provider_id"),
  provider: text("provider"),
  photoURL: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Workflow status enum
export const workflowStatus = z.enum(["PASSED", "FAILED", "IDLE"]);
export type WorkflowStatus = z.infer<typeof workflowStatus>;

// Node type enum
export const nodeType = z.enum(["START", "END", "API", "EMAIL", "TEXT", "CONDITION"]);
export type NodeType = z.infer<typeof nodeType>;

// Workflows table
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("IDLE"),
  lastRun: timestamp("last_run"),
  nodes: jsonb("nodes").notNull(),
  edges: jsonb("edges").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workflow execution results table
export const workflowResults = pgTable("workflow_results", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflows.id),
  results: jsonb("results").notNull(),
  status: text("status", { enum: ["PASSED", "FAILED"] }).notNull(),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

// Node schema for workflow nodes
export const nodeSchema = z.object({
  id: z.string(),
  type: nodeType,
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.any()).optional(),
});
export type Node = z.infer<typeof nodeSchema>;

// Edge schema for workflow connections
export const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  type: z.string().optional(),
});
export type Edge = z.infer<typeof edgeSchema>;

// Insert schema for users
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  providerId: true,
  provider: true,
  photoURL: true,
});

// Register schema with validation
export const registerUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Insert schema for workflows
export const insertWorkflowSchema = createInsertSchema(workflows).pick({
  userId: true,
  name: true,
  description: true,
  status: true,
  nodes: true,
  edges: true,
}).extend({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Social login schema
export const socialLoginSchema = z.object({
  email: z.string().email("Email is required"),
  username: z.string().min(1, "Display name is required"),
  providerId: z.string().min(1, "Provider ID is required"),
  provider: z.string().min(1, "Provider is required"),
  photoURL: z.string().optional(),
});

// Schema for workflow results
export const insertWorkflowResultSchema = createInsertSchema(workflowResults).pick({
  workflowId: true,
  results: true,
  status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SocialLogin = z.infer<typeof socialLoginSchema>;

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;

export type InsertWorkflowResult = z.infer<typeof insertWorkflowResultSchema>;
export type WorkflowResult = typeof workflowResults.$inferSelect;
