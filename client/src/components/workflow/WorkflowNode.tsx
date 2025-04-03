import { memo, FC } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Play, 
  Code, 
  Mail, 
  GitBranch,
  Square, 
  MoreHorizontal
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { NodeType } from '@shared/schema';

interface NodeData {
  label?: string;
  method?: string;
  url?: string;
  to?: string;
  subject?: string;
  body?: string;
  onDataChange?: (id: string, data: any) => void;
}

const WorkflowNode: FC<NodeProps<NodeData>> = ({ id, type, data, isConnectable }) => {
  const handleDataChange = (key: string, value: any) => {
    if (data.onDataChange) {
      data.onDataChange(id, { ...data, [key]: value });
    }
  };

  const renderNodeContent = () => {
    switch (type as NodeType) {
      case 'START':
        return (
          <div className="p-4 bg-white rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <Play className="h-4 w-4" />
              </div>
              <span className="ml-2 font-medium">Start</span>
              <div className="ml-auto">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Handle
              type="source"
              position={Position.Bottom}
              id="output"
              isConnectable={isConnectable}
              className="w-3 h-3 rounded-full bg-neutral-400 border-2 border-white"
            />
          </div>
        );

      case 'API':
        return (
          <div className="p-4 bg-white rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
                <Code className="h-4 w-4" />
              </div>
              <span className="ml-2 font-medium">API Request</span>
              <div className="ml-auto">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mb-3">
              <Label className="text-xs text-neutral-500 mb-1">URL</Label>
              <Input
                type="text"
                value={data.url || ''}
                onChange={(e) => handleDataChange('url', e.target.value)}
                className="w-full px-2 py-1 text-sm"
                placeholder="https://api.example.com/data"
              />
            </div>
            
            <div className="mb-3">
              <Label className="text-xs text-neutral-500 mb-1">Method</Label>
              <Select 
                value={data.method || 'GET'} 
                onValueChange={(value) => handleDataChange('method', value)}
              >
                <SelectTrigger className="w-full h-8 text-sm">
                  <SelectValue placeholder="GET" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <Handle
                type="target"
                position={Position.Top}
                id="input"
                isConnectable={isConnectable}
                className="w-3 h-3 rounded-full bg-neutral-400 border-2 border-white"
              />
              <Handle
                type="source"
                position={Position.Bottom}
                id="output"
                isConnectable={isConnectable}
                className="w-3 h-3 rounded-full bg-neutral-400 border-2 border-white"
              />
            </div>
          </div>
        );

      case 'EMAIL':
        return (
          <div className="p-4 bg-white rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                <Mail className="h-4 w-4" />
              </div>
              <span className="ml-2 font-medium">Send Email</span>
              <div className="ml-auto">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mb-3">
              <Label className="text-xs text-neutral-500 mb-1">To</Label>
              <Input
                type="email"
                value={data.to || ''}
                onChange={(e) => handleDataChange('to', e.target.value)}
                className="w-full px-2 py-1 text-sm"
                placeholder="recipient@example.com"
              />
            </div>
            
            <div className="mb-3">
              <Label className="text-xs text-neutral-500 mb-1">Subject</Label>
              <Input
                type="text"
                value={data.subject || ''}
                onChange={(e) => handleDataChange('subject', e.target.value)}
                className="w-full px-2 py-1 text-sm"
                placeholder="API Data Results"
              />
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <Handle
                type="target"
                position={Position.Top}
                id="input"
                isConnectable={isConnectable}
                className="w-3 h-3 rounded-full bg-neutral-400 border-2 border-white"
              />
              <Handle
                type="source"
                position={Position.Bottom}
                id="output"
                isConnectable={isConnectable}
                className="w-3 h-3 rounded-full bg-neutral-400 border-2 border-white"
              />
            </div>
          </div>
        );

      case 'CONDITION':
        return (
          <div className="p-4 bg-white rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-white">
                <GitBranch className="h-4 w-4" />
              </div>
              <span className="ml-2 font-medium">Condition</span>
              <div className="ml-auto">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <Handle
                type="target"
                position={Position.Top}
                id="input"
                isConnectable={isConnectable}
                className="w-3 h-3 rounded-full bg-neutral-400 border-2 border-white"
              />
              <Handle
                type="source"
                position={Position.Bottom}
                id="output"
                isConnectable={isConnectable}
                className="w-3 h-3 rounded-full bg-neutral-400 border-2 border-white"
              />
            </div>
          </div>
        );

      case 'END':
        return (
          <div className="p-4 bg-white rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                <Square className="h-4 w-4" />
              </div>
              <span className="ml-2 font-medium">End</span>
              <div className="ml-auto">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Handle
              type="target"
              position={Position.Top}
              id="input"
              isConnectable={isConnectable}
              className="w-3 h-3 rounded-full bg-neutral-400 border-2 border-white"
            />
          </div>
        );

      default:
        return <div>Unknown node type</div>;
    }
  };

  return (
    <div className="workflow-node" style={{ minWidth: '240px' }}>
      {renderNodeContent()}
    </div>
  );
};

export default memo(WorkflowNode);
