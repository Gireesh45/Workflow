import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { createWorkflow } from "@/lib/workflow";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";

export default function NewWorkflowPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<{ 
    nodes: any[], 
    edges: any[],
    description?: string 
  } | null>(null);

  // Generate workflow template using AI
  const handleGenerateTemplate = async () => {
    if (!description) {
      toast({
        title: "Description required",
        description: "Please provide a detailed description of your workflow.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/workflows/generate-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate workflow template");
      }

      const data = await response.json();
      setGeneratedTemplate({
        ...data,
        description: description
      });
      
      toast({
        title: "Template generated",
        description: "AI has created a workflow template based on your description.",
      });
    } catch (error) {
      console.error("Error generating template:", error);
      toast({
        title: "Generation failed",
        description: "Unable to generate workflow template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Create and save the workflow
  const handleCreateWorkflow = async () => {
    if (!user) return;
    if (!name) {
      toast({
        title: "Name required",
        description: "Please provide a name for your workflow.",
        variant: "destructive",
      });
      return;
    }
    
    if (!generatedTemplate) {
      toast({
        title: "Template required",
        description: "Please generate a template before creating the workflow.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newWorkflow = await createWorkflow({
        name,
        userId: user.id,
        nodes: generatedTemplate.nodes,
        edges: generatedTemplate.edges,
        status: "IDLE",
      });
      
      toast({
        title: "Workflow created",
        description: "Your workflow has been created successfully.",
      });
      
      // Redirect to editor with the new workflow ID
      setLocation(`/workflows/editor?id=${newWorkflow.id}`);
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast({
        title: "Creation failed",
        description: "Unable to create workflow. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Go back to workflows list
  const handleBack = () => {
    setLocation("/workflows");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto bg-neutral-50 pt-0 md:pt-0">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={handleBack} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Create Workflow with AI</h1>
              <p className="text-neutral-600">Use AI to help design your workflow</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Details</CardTitle>
                <CardDescription>
                  Provide information about your workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <Input
                    id="name"
                    placeholder="Enter workflow name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Describe your workflow in detail for better AI suggestions..."
                    rows={8}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="resize-none"
                  />
                  <p className="text-xs text-neutral-500">
                    Provide a detailed description of what your workflow should do. 
                    The more details you provide, the better the AI can generate an appropriate template.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerateTemplate} 
                  disabled={isGenerating || !description}
                  className="bg-primary text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Template
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
                <CardDescription>
                  AI-generated workflow template
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="min-h-[300px] flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-neutral-600">Generating your workflow template...</p>
                    <p className="text-sm text-neutral-500 mt-2">This may take a few moments</p>
                  </div>
                ) : generatedTemplate ? (
                  <div className="space-y-4">
                    {generatedTemplate.description && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Description</h3>
                        <div className="bg-neutral-50 p-3 rounded-md border text-sm">
                          {generatedTemplate.description}
                        </div>
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-medium mb-2">Generated Structure</h3>
                      <div className="bg-neutral-100 p-4 rounded-md">
                        <p className="text-sm">
                          {generatedTemplate.nodes.length} nodes and {generatedTemplate.edges.length} connections generated
                        </p>
                        <Separator className="my-4" />
                        <div className="text-xs font-mono overflow-auto max-h-[250px] p-2">
                          <pre>
                            {JSON.stringify({ 
                              nodes: generatedTemplate.nodes.map(n => ({ 
                                id: n.id, 
                                type: n.type, 
                                data: { label: n.data?.label || "" }
                              })), 
                              edges: generatedTemplate.edges 
                            }, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500">
                      You can further edit and customize this workflow in the editor after creation.
                    </p>
                  </div>
                ) : (
                  <div className="min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-md p-6 text-center">
                    <Sparkles className="h-12 w-12 text-neutral-300 mb-4" />
                    <h3 className="text-neutral-600 font-medium mb-2">No Template Generated Yet</h3>
                    <p className="text-sm text-neutral-500 max-w-md">
                      Provide a detailed description of your workflow on the left and click "Generate Template" 
                      to create an AI-powered workflow structure.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-primary text-white"
                  disabled={!generatedTemplate}
                  onClick={handleCreateWorkflow}
                >
                  Create Workflow
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}