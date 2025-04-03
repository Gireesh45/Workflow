import { FC } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmRunModalProps {
  isOpen: boolean;
  workflowName: string;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmRunModal: FC<ConfirmRunModalProps> = ({
  isOpen,
  workflowName,
  onClose,
  onConfirm,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Run Workflow</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to run the workflow "{workflowName}"? This action will execute all steps in the workflow.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-primary text-white hover:bg-primary-dark"
          >
            Run
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmRunModal;
