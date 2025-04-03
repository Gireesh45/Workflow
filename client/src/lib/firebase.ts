import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged, 
  type User 
} from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc } from "firebase/firestore";
import { Node, Edge } from "@shared/schema";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo"}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "demo",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth functions
export const loginWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
  return signOut(auth);
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Workflow Types
export interface Workflow {
  id?: string;
  name: string;
  status: 'PASSED' | 'FAILED' | 'IDLE';
  lastRun?: Date;
  nodes: Node[];
  edges: Edge[];
  userId: string;
}

// Workflow CRUD operations
export const createWorkflow = async (workflow: Workflow) => {
  const workflowsCollection = collection(db, "workflows");
  const newWorkflowRef = doc(workflowsCollection);
  
  await setDoc(newWorkflowRef, {
    ...workflow,
    id: newWorkflowRef.id,
    lastRun: workflow.lastRun || null,
    createdAt: new Date()
  });
  
  return { ...workflow, id: newWorkflowRef.id };
};

export const getWorkflow = async (id: string): Promise<Workflow | null> => {
  const workflowRef = doc(db, "workflows", id);
  const workflowSnapshot = await getDoc(workflowRef);
  
  if (workflowSnapshot.exists()) {
    return { 
      id: workflowSnapshot.id, 
      ...workflowSnapshot.data() 
    } as Workflow;
  }
  
  return null;
};

export const getUserWorkflows = async (userId: string): Promise<Workflow[]> => {
  const workflowsCollection = collection(db, "workflows");
  const q = query(workflowsCollection, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  
  const workflows: Workflow[] = [];
  querySnapshot.forEach((doc) => {
    workflows.push({ id: doc.id, ...doc.data() } as Workflow);
  });
  
  return workflows;
};

export const searchWorkflows = async (userId: string, searchQuery: string): Promise<Workflow[]> => {
  // In a real app, you would use a more sophisticated search, possibly with Firebase extensions
  const allWorkflows = await getUserWorkflows(userId);
  const lowercaseQuery = searchQuery.toLowerCase();
  
  return allWorkflows.filter(workflow => 
    workflow.name.toLowerCase().includes(lowercaseQuery) || 
    (workflow.id && workflow.id.toLowerCase().includes(lowercaseQuery))
  );
};

export const updateWorkflow = async (id: string, data: Partial<Workflow>) => {
  const workflowRef = doc(db, "workflows", id);
  await updateDoc(workflowRef, { ...data });
  
  // Return the updated workflow
  return getWorkflow(id);
};

export const deleteWorkflow = async (id: string) => {
  const workflowRef = doc(db, "workflows", id);
  await deleteDoc(workflowRef);
  return true;
};

export const executeWorkflow = async (workflow: Workflow): Promise<{ success: boolean; message: string }> => {
  try {
    const { nodes, edges } = workflow;
    
    // Find the start node
    const startNode = nodes.find(node => node.type === "START");
    if (!startNode) {
      throw new Error("No start node found in workflow");
    }

    // In a real implementation, this would execute the workflow logic
    // For this demo, we'll simulate success/failure
    // In production, you would call your backend or use cloud functions

    // Simulate API call
    const apiNode = nodes.find(node => node.type === "API");
    if (apiNode && apiNode.data?.url) {
      try {
        const response = await fetch(apiNode.data.url, {
          method: apiNode.data.method || 'GET'
        });
        
        if (!response.ok) {
          throw new Error(`API call failed: ${response.statusText}`);
        }
        
        // Update workflow as passed
        if (workflow.id) {
          await updateWorkflow(workflow.id, {
            status: 'PASSED',
            lastRun: new Date()
          });
        }
        
        return { success: true, message: "Workflow executed successfully" };
      } catch (error) {
        // Update workflow as failed
        if (workflow.id) {
          await updateWorkflow(workflow.id, {
            status: 'FAILED',
            lastRun: new Date()
          });
        }
        
        return { 
          success: false, 
          message: `Workflow execution failed: ${error instanceof Error ? error.message : "Unknown error"}`
        };
      }
    }
    
    // If no API node, just simulate success
    if (workflow.id) {
      await updateWorkflow(workflow.id, {
        status: 'PASSED',
        lastRun: new Date()
      });
    }
    
    return { success: true, message: "Workflow executed successfully" };
  } catch (error) {
    if (workflow.id) {
      await updateWorkflow(workflow.id, {
        status: 'FAILED',
        lastRun: new Date()
      });
    }
    
    return { 
      success: false, 
      message: `Workflow execution failed: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
};

export { auth, db };
