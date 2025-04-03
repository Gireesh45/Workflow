import { FC, useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  ReactFlowProvider,
  ReactFlowInstance,
  useReactFlow,
  Node as FlowNode,
  Edge as FlowEdge,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  addEdge,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { Node, Edge } from '@shared/schema';
import WorkflowNode from './WorkflowNode';
import { Play, Code, Mail, GitBranch, Square, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  isLoading: boolean;
  onChange: (nodes: Node[], edges: Edge[]) => void;
}

// Node components mapping
const nodeTypes: NodeTypes = {
  START: WorkflowNode,
  API: WorkflowNode,
  EMAIL: WorkflowNode,
  CONDITION: WorkflowNode,
  END: WorkflowNode,
};

// Available node types for the palette
const nodeOptions = [
  { type: 'START', label: 'Start', icon: Play, color: 'bg-primary' },
  { type: 'API', label: 'API Request', icon: Code, color: 'bg-amber-500' },
  { type: 'EMAIL', label: 'Send Email', icon: Mail, color: 'bg-green-500' },
  { type: 'CONDITION', label: 'Condition', icon: GitBranch, color: 'bg-neutral-700' },
  { type: 'END', label: 'End', icon: Square, color: 'bg-red-500' },
];

const WorkflowCanvasComponent: FC<WorkflowCanvasProps> = ({ nodes, edges, isLoading, onChange }) => {
  const reactFlowInstance = useReactFlow();
  const [reactFlowNodes, setReactFlowNodes] = useState<FlowNode[]>(nodes as FlowNode[]);
  const [reactFlowEdges, setReactFlowEdges] = useState<FlowEdge[]>(edges as FlowEdge[]);

  // Handle node changes (move, select, etc.)
  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, reactFlowNodes);
      setReactFlowNodes(updatedNodes);
      onChange(updatedNodes as Node[], reactFlowEdges as Edge[]);
    },
    [reactFlowNodes, reactFlowEdges, onChange]
  );

  // Handle edge changes
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, reactFlowEdges);
      setReactFlowEdges(updatedEdges);
      onChange(reactFlowNodes as Node[], updatedEdges as Edge[]);
    },
    [reactFlowNodes, reactFlowEdges, onChange]
  );

  // Handle connecting nodes
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        id: `e${uuidv4()}`,
      };
      const updatedEdges = addEdge(newEdge, reactFlowEdges);
      setReactFlowEdges(updatedEdges);
      onChange(reactFlowNodes as Node[], updatedEdges as Edge[]);
    },
    [reactFlowNodes, reactFlowEdges, onChange]
  );

  // Handle node data changes
  const onNodeDataChange = useCallback(
    (nodeId: string, data: any) => {
      const updatedNodes = reactFlowNodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      });
      setReactFlowNodes(updatedNodes);
      onChange(updatedNodes as Node[], reactFlowEdges as Edge[]);
    },
    [reactFlowNodes, reactFlowEdges, onChange]
  );

  // Create a new node on drop
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // Check if the dropped element is valid
      if (!type) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: FlowNode = {
        id: `node-${uuidv4()}`,
        type: type,
        position,
        data: { 
          onDataChange: onNodeDataChange,
          // Default data based on node type
          ...(type === 'API' && { method: 'GET', url: 'https://api.example.com/data' }),
          ...(type === 'EMAIL' && { to: 'recipient@example.com', subject: 'API Data Results' }),
        },
      };

      setReactFlowNodes([...reactFlowNodes, newNode]);
      onChange([...reactFlowNodes, newNode] as Node[], reactFlowEdges as Edge[]);
    },
    [reactFlowInstance, reactFlowNodes, reactFlowEdges, onChange, onNodeDataChange]
  );

  // Allow dropping by preventing the default behavior
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Zoom controls
  const zoomIn = () => {
    reactFlowInstance.zoomIn();
  };

  const zoomOut = () => {
    reactFlowInstance.zoomOut();
  };

  const resetView = () => {
    reactFlowInstance.fitView();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden">
      {/* Tool Palette */}
      <div className="w-64 bg-white border-r border-neutral-200 overflow-y-auto p-4">
        <h3 className="font-medium text-neutral-900 mb-3">Components</h3>
        
        <div className="space-y-3">
          {nodeOptions.map((option) => (
            <div
              key={option.type}
              className="p-3 bg-neutral-50 rounded-md border border-neutral-200 cursor-move"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow', option.type);
                event.dataTransfer.effectAllowed = 'move';
              }}
            >
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full ${option.color} flex items-center justify-center text-white`}>
                  <option.icon className="h-4 w-4" />
                </div>
                <span className="ml-2 font-medium text-sm">{option.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Workflow Canvas */}
      <div className="flex-1 overflow-auto relative">
        <div className="absolute top-4 right-4 z-10 bg-white rounded-md shadow-sm border border-neutral-200 flex">
          <Button 
            className="p-2 text-neutral-600 hover:text-primary border-r border-neutral-200" 
            variant="ghost"
            onClick={zoomIn}
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button 
            className="p-2 text-neutral-600 hover:text-primary border-r border-neutral-200" 
            variant="ghost"
            onClick={zoomOut}
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button 
            className="p-2 text-neutral-600 hover:text-primary" 
            variant="ghost"
            onClick={resetView}
          >
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="workflow-canvas h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={reactFlowNodes}
            edges={reactFlowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            className="bg-neutral-50"
          >
            <Background 
              color="#f1f5f9"
              gap={20} 
              size={1} 
              variant="dots" 
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

// Wrap with ReactFlowProvider to access react-flow methods
const WorkflowCanvas: FC<WorkflowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasComponent {...props} />
    </ReactFlowProvider>
  );
};

export default WorkflowCanvas;
