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
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { Node, Edge, NodeType } from '@shared/schema';
import WorkflowNode from '@/components/workflow/WorkflowNode';
import AddNodeButton from '@/components/workflow/AddNodeButton';
import { 
  Play, 
  Code, 
  Mail, 
  FileText, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  Plus,
} from 'lucide-react';
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
  TEXT: WorkflowNode,
  END: WorkflowNode,
};

// Available node types for the palette
const nodeOptions = [
  { type: 'API', label: 'API Call', icon: Code, color: 'bg-blue-500' },
  { type: 'EMAIL', label: 'Email', icon: Mail, color: 'bg-green-500' },
  { type: 'TEXT', label: 'Text Box', icon: FileText, color: 'bg-purple-500' },
];

const WorkflowCanvasComponent: FC<WorkflowCanvasProps> = ({ nodes, edges, isLoading, onChange }) => {
  const reactFlowInstance = useReactFlow();
  const [reactFlowNodes, setReactFlowNodes] = useState<FlowNode[]>(nodes as FlowNode[]);
  const [reactFlowEdges, setReactFlowEdges] = useState<FlowEdge[]>(edges as FlowEdge[]);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  
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
        type: 'plusButtonEdge', // Set edge type to plusButtonEdge
        animated: true,
        style: { strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
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

  // Find a node by its ID
  const getNodeById = useCallback(
    (id: string) => {
      return reactFlowNodes.find(node => node.id === id);
    },
    [reactFlowNodes]
  );

  // Add a new node between two connected nodes
  const addNodeBetween = useCallback(
    (sourceId: string, targetId: string, edgeId: string, nodeType: NodeType) => {
      // Get the source and target nodes
      const sourceNode = getNodeById(sourceId);
      const targetNode = getNodeById(targetId);
      
      if (!sourceNode || !targetNode) return;
      
      // Calculate the position for the new node (midpoint between source and target)
      const position = {
        x: (sourceNode.position.x + targetNode.position.x) / 2,
        y: (sourceNode.position.y + targetNode.position.y) / 2,
      };
      
      // Create the new node
      const newNode: FlowNode = {
        id: `node-${uuidv4()}`,
        type: nodeType,
        position,
        data: { 
          onDataChange: onNodeDataChange,
          // Default data based on node type
          ...(nodeType === 'API' && { method: 'GET', url: 'https://api.example.com/data' }),
          ...(nodeType === 'EMAIL' && { to: 'recipient@example.com', subject: 'Email Subject' }),
          ...(nodeType === 'TEXT' && { text: 'Text content...' }),
        },
      };
      
      // Remove the original edge
      const filteredEdges = reactFlowEdges.filter(edge => edge.id !== edgeId);
      
      // Create two new edges: source -> new node and new node -> target
      const edge1: FlowEdge = {
        id: `e${uuidv4()}`,
        source: sourceId,
        target: newNode.id,
        type: 'plusButtonEdge', // Set edge type to plusButtonEdge
        animated: true,
        style: { strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      
      const edge2: FlowEdge = {
        id: `e${uuidv4()}`,
        source: newNode.id,
        target: targetId,
        type: 'plusButtonEdge', // Set edge type to plusButtonEdge
        animated: true,
        style: { strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      
      // Update state with the new node and edges
      const updatedNodes = [...reactFlowNodes, newNode];
      const updatedEdges = [...filteredEdges, edge1, edge2];
      
      setReactFlowNodes(updatedNodes);
      setReactFlowEdges(updatedEdges);
      onChange(updatedNodes as Node[], updatedEdges as Edge[]);
      
      // Clear the selected edge
      setSelectedEdge(null);
    },
    [reactFlowNodes, reactFlowEdges, getNodeById, onChange, onNodeDataChange]
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
        type: type as NodeType,
        position,
        data: { 
          onDataChange: onNodeDataChange,
          // Default data based on node type
          ...(type === 'API' && { method: 'GET', url: 'https://api.example.com/data' }),
          ...(type === 'EMAIL' && { to: 'recipient@example.com', subject: 'Email Subject' }),
          ...(type === 'TEXT' && { text: 'Text content...' }),
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

  const handleEdgeClick = (event: React.MouseEvent, edge: FlowEdge) => {
    event.stopPropagation();
    setSelectedEdge(edge.id);
  };

  const handlePaneClick = () => {
    setSelectedEdge(null);
  };

  // Custom edge with a plus button
  const edgeWithPlusButton = useCallback(
    (props: FlowEdge) => {
      // For custom edges with buttons
      const { id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;
      
      return (
        <AddNodeButton
          id={id}
          source={source}
          target={target}
          sourceX={sourceX}
          sourceY={sourceY}
          targetX={targetX}
          targetY={targetY}
          sourcePosition={sourcePosition}
          targetPosition={targetPosition}
          isSelected={selectedEdge === id}
          onAddNode={(type: string) => addNodeBetween(source, target, id, type as NodeType)}
          nodeOptions={nodeOptions}
        />
      );
    },
    [selectedEdge, addNodeBetween]
  );

  // Add a custom edge type
  const edgeTypes = {
    plusButtonEdge: edgeWithPlusButton,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex h-full">
        {/* Workflow Canvas */}
        <div className="flex-1 relative">
          <div className="absolute bottom-4 right-4 z-10 bg-white rounded-md shadow border border-gray-200 flex">
            <Button 
              className="p-2 text-gray-600 hover:bg-gray-100 border-r border-gray-200" 
              variant="ghost"
              onClick={zoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button 
              className="p-2 text-gray-600 hover:bg-gray-100" 
              variant="ghost"
              onClick={zoomIn}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="workflow-canvas h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
            <ReactFlow
              nodes={reactFlowNodes}
              edges={reactFlowEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onEdgeClick={handleEdgeClick}
              onPaneClick={handlePaneClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
              className="bg-[#f9f7e8]"
              minZoom={0.2}
              maxZoom={2}
              defaultEdgeOptions={{
                animated: true,
                style: { strokeWidth: 2 },
                type: 'plusButtonEdge',
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                },
              }}
            >
              <Background 
                color="#ddd"
                gap={20} 
                size={1}
              />
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create the default workflow structure
const createDefaultWorkflow = () => {
  // Default start and end nodes
  const startNode: Node = {
    id: 'start-node',
    type: 'START',
    position: { x: 400, y: 100 },
    data: {},
  };
  
  const endNode: Node = {
    id: 'end-node',
    type: 'END',
    position: { x: 400, y: 250 },
    data: {},
  };
  
  // Connect start to end
  const edges: Edge[] = [
    {
      id: 'edge-start-end',
      source: 'start-node',
      target: 'end-node',
      type: 'plusButtonEdge',
    }
  ];
  
  return {
    nodes: [startNode, endNode],
    edges,
  };
};

// Wrap with ReactFlowProvider to access react-flow methods
const WorkflowCanvas: FC<WorkflowCanvasProps> = (props) => {
  // Check if we need to initialize with default nodes
  const initializedProps = { ...props };
  
  if (props.nodes.length === 0 && !props.isLoading) {
    // Use the function to create a default workflow
    const { nodes, edges } = createDefaultWorkflow();
    
    initializedProps.nodes = nodes;
    initializedProps.edges = edges;
    
    // Call onChange to update the parent component
    if (!props.isLoading) {
      props.onChange(initializedProps.nodes, initializedProps.edges);
    }
  }

  return (
    <ReactFlowProvider>
      <WorkflowCanvasComponent {...initializedProps} />
    </ReactFlowProvider>
  );
};

export default WorkflowCanvas;
