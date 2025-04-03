import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
});

// Workflow status enum
export const workflowStatus = z.enum(["PASSED", "FAILED", "IDLE"]);
export type WorkflowStatus = z.infer<typeof workflowStatus>;

// Node type enum
export const nodeType = z.enum(["START", "END", "API", "EMAIL", "CONDITION"]);
export type NodeType = z.infer<typeof nodeType>;

// Workflows table
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("IDLE"),
  lastRun: timestamp("last_run"),
  nodes: jsonb("nodes").notNull(),
  edges: jsonb("edges").notNull(),
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
});
export type Edge = z.infer<typeof edgeSchema>;

// Insert schema for users
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

// Insert schema for workflows
export const insertWorkflowSchema = createInsertSchema(workflows).pick({
  userId: true,
  name: true,
  status: true,
  nodes: true,
  edges: true,
}).extend({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;
