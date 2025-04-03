import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface AITemplateGeneratorProps {
  onTemplateGenerated: (template: { nodes: any[], edges: any[] }) => void;
}

export function AITemplateGenerator({ onTemplateGenerated }: AITemplateGeneratorProps) {
  const [description, setDescription] = useState<string>('');

  // Mutation for generating workflow template
  const generateMutation = useMutation({
    mutationFn: async (description: string) => {
      const res = await apiRequest('POST', '/api/workflows/generate-template', { description });
      return res.json();
    },
    onSuccess: (data) => {
      onTemplateGenerated(data);
    },
  });

  const handleGenerate = () => {
    if (description.trim()) {
      generateMutation.mutate(description);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI-Powered Workflow Generator
        </CardTitle>
        <CardDescription>
          Describe your workflow in plain language and our AI will create a template for you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            placeholder="Describe your workflow (e.g., 'Create a workflow that fetches data from an API, filters it based on date, and sends an email notification')"
            className="min-h-[120px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={generateMutation.isPending}
          />
          
          {generateMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {generateMutation.error instanceof Error
                  ? generateMutation.error.message
                  : 'Failed to generate workflow template. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleGenerate}
          disabled={!description.trim() || generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Workflow
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}