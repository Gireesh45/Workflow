import React, { memo, FC, useState } from 'react';
import { EdgeProps, getStraightPath } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AddNodeButtonProps extends Partial<EdgeProps> {
  id: string;
  source: string;
  target: string;
  isSelected: boolean;
  onAddNode: (type: string) => void;
  nodeOptions: Array<{
    type: string;
    label: string;
    icon: React.ComponentType<any>;
    color: string;
  }>;
}

const AddNodeButton: FC<AddNodeButtonProps> = ({
  id,
  source,
  target,
  isSelected,
  onAddNode,
  nodeOptions,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}) => {
  const [open, setOpen] = useState(false);
  
  // Get edge path
  const [edgePath, centerX, centerY] = getStraightPath({
    sourceX: sourceX!,
    sourceY: sourceY!,
    targetX: targetX!,
    targetY: targetY!,
  });

  const handleSelectNodeType = (type: string) => {
    onAddNode(type);
    setOpen(false);
  };

  return (
    <>
      {/* Render regular path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke="#888"
        markerEnd="url(#arrow)"
      />
      
      {/* Add marker definition for arrow */}
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#888" />
        </marker>
      </defs>

      {/* Plus button in the middle of the edge */}
      <foreignObject
        width={40}
        height={40}
        x={centerX - 20}
        y={centerY - 20}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              className="h-6 w-6 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-100 p-0 flex items-center justify-center"
              variant="ghost"
            >
              <Plus className="h-3.5 w-3.5 text-gray-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="center">
            <div className="flex flex-col space-y-1">
              {nodeOptions.map((option) => (
                <Button
                  key={option.type}
                  onClick={() => handleSelectNodeType(option.type)}
                  className="w-full justify-start text-sm font-normal px-2 py-1.5 h-auto"
                  variant="ghost"
                >
                  <div className={`w-5 h-5 rounded-full ${option.color} flex items-center justify-center text-white mr-2 shrink-0`}>
                    <option.icon className="h-3 w-3" />
                  </div>
                  <span>{option.label}</span>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </foreignObject>
    </>
  );
};

export default memo(AddNodeButton);