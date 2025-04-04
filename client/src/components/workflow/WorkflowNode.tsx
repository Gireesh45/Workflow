import { memo, FC, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Play, 
  Code, 
  Mail, 
  GitBranch,
  Square, 
  MoreHorizontal,
  Trash2,
  Edit,
  Plus,
  X,
  Copy,
  FileText,
  CheckCircle,
  AlertCircle,
  PauseCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { NodeType } from '@shared/schema';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

interface NodeData {
  label?: string;
  method?: string;
  url?: string;
  to?: string;
  subject?: string;
  body?: string;
  text?: string;
  status?: 'PASSED' | 'FAILED' | 'PAUSED' | 'IDLE';
  onDataChange?: (id: string, data: any) => void;
}

const WorkflowNode: FC<NodeProps<NodeData>> = ({ id, type, data, isConnectable }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    url: data.url || '',
    method: data.method || 'GET',
    to: data.to || '',
    subject: data.subject || '',
    body: data.body || '',
    text: data.text || ''
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,  // Preserve other form data
      url: data.url || '',
      method: data.method || 'GET',
      to: data.to || '',
      subject: data.subject || '',
      body: data.body || '',
      text: data.text || ''
    }));
  }, [data]);

  const handleNodeDataChange = (id, newData) => {
    setNodes((prevNodes) => 
      prevNodes.map(node => 
        node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  };

  const getNodeIcon = () => {
    switch (type as NodeType) {
      case 'START':
        return <Play className="h-4 w-4" />;
      case 'API':
        return <Code className="h-4 w-4" />;
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      case 'TEXT':
        return <FileText className="h-4 w-4" />;
      case 'CONDITION':
        return <GitBranch className="h-4 w-4" />;
      case 'END':
        return <Square className="h-4 w-4" />;
      default:
        return <div>?</div>;
    }
  };

  const getNodeColor = () => {
    switch (type as NodeType) {
      case 'START':
        return 'bg-green-600';
      case 'API':
        return 'bg-blue-500';
      case 'EMAIL':
        return 'bg-green-500';
      case 'TEXT':
        return 'bg-purple-500';
      case 'CONDITION':
        return 'bg-purple-600';
      case 'END':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getNodeLabel = () => {
    switch (type as NodeType) {
      case 'START':
        return 'Start';
      case 'API':
        return 'API Call';
      case 'EMAIL':
        return 'Email';
      case 'TEXT':
        return 'Text Box';
      case 'CONDITION':
        return 'Condition';
      case 'END':
        return 'End';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = () => {
    if (!data.status) return null;

    switch (data.status) {
      case 'PASSED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'PAUSED':
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const renderEditForm = () => {
    switch (type as NodeType) {
      case 'API':
        return (
          <>
            <div className="mb-4">
              <Label className="text-sm font-medium mb-1 block">URL</Label>
              <Input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="w-full"
                placeholder="Enter URL"
              />
            </div>

            <div className="mb-4">
              <Label className="text-sm font-medium mb-1 block">Method</Label>
              <Select 
                value={formData.method} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, method: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'EMAIL':
        return (
          <>
            <div className="mb-4">
              <Label className="text-sm font-medium mb-1 block">To</Label>
              <Input
                type="email"
                value={formData.to}
                onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                className="w-full"
                placeholder="Enter email address"
              />
            </div>

            <div className="mb-4">
              <Label className="text-sm font-medium mb-1 block">Subject</Label>
              <Input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full"
                placeholder="Enter subject"
              />
            </div>

            <div className="mb-4">
              <Label className="text-sm font-medium mb-1 block">Message</Label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                className="w-full min-h-[100px]"
                placeholder="Enter email message"
              />
            </div>
          </>
        );

      case 'TEXT':
        return (
          <>
            <div className="mb-4">
              <Label className="text-sm font-medium mb-1 block">Text Content</Label>
              <Textarea
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                className="w-full min-h-[120px]"
                autoFocus
              />
            </div>
          </>
        );

      case 'CONDITION':
        return (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">Condition settings will be available soon</p>
          </div>
        );

      default:
        return null;
    }
  };

  const renderNodeContent = () => {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full ${getNodeColor()} flex items-center justify-center text-white shrink-0`}>
              {getNodeIcon()}
            </div>
            <span className="ml-2 font-medium text-sm">{getNodeLabel()}</span>

            {/* Status indicator */}
            {data.status && (
              <div className="ml-2">
                {getStatusIcon()}
              </div>
            )}

            {/* Only show menu for non-START and non-END nodes */}
            {(type !== 'START' && type !== 'END') && (
              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full">
                      <MoreHorizontal className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem onClick={() => setShowEditModal(true)} className="cursor-pointer">
                      <Edit className="h-3.5 w-3.5 mr-2" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-500 cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>



        {/* Connection handles */}
        {type !== 'START' && (
          <Handle
            type="target"
            position={Position.Top}
            id="input"
            isConnectable={isConnectable}
            className="w-2.5 h-2.5 rounded-full bg-gray-400 border-2 border-white"
          />
        )}

        {type !== 'END' && (
          <Handle
            type="source"
            position={Position.Bottom}
            id="output"
            isConnectable={isConnectable}
            className="w-2.5 h-2.5 rounded-full bg-gray-400 border-2 border-white"
          />
        )}
      </div>
    );
  };

  return (
    <>
      <div className="workflow-node" style={{ width: '180px' }}>
        {renderNodeContent()}
      </div>

      {/* Edit Node Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit {getNodeLabel()}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {renderEditForm()}
          </div>

          <DialogFooter className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            {/* <Button 
              type="button"
              onClick={() => {
                  let updatedData = { ...data };

                  // Only update fields relevant to the node type
                  switch (type) {
                    case 'API':
                      updatedData = {
                        ...updatedData,
                        url: formData.url,
                        method: formData.method
                      };
                      break;
                    case 'EMAIL':
                      updatedData = {
                        ...updatedData,
                        to: formData.to,
                        subject: formData.subject,
                        body: formData.body
                      };
                      break;
                    case 'TEXT':
                      updatedData = {
                        ...updatedData,
                        text: formData.text
                      };
                      break;
                  }

                  if (data.onDataChange) {
                    data.onDataChange(id, updatedData);
                  }
                  setShowEditModal(false);
                }}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Save Changes
            </Button> */}
            <Button 
              type="button"
              onClick={() => {
                  const updatedData = {
                    ...data, // Preserve existing data
                    ...(type === 'API' && { url: formData.url, method: formData.method }),
                    ...(type === 'EMAIL' && { to: formData.to, subject: formData.subject, body: formData.body }),
                    ...(type === 'TEXT' && { text: formData.text }),
                  };

                  if (data.onDataChange) {
                    data.onDataChange(id, updatedData);
                  }

                  setShowEditModal(false);
                }}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Save Changes
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default memo(WorkflowNode);