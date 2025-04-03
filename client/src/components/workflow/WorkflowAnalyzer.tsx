import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, LineChart, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Workflow } from '@shared/schema';

interface WorkflowAnalyzerProps {
  workflow: Workflow;
}

export function WorkflowAnalyzer({ workflow }: WorkflowAnalyzerProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  
  // Mutation for analyzing workflow
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/workflows/${workflow.id}/analyze`);
      return res.json();
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
    },
  });

  const handleAnalyze = () => {
    analyzeMutation.mutate();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-primary" />
          Workflow Analysis
        </CardTitle>
        <CardDescription>
          Get AI-powered insights and improvement suggestions for your workflow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analysis ? (
            <div className="p-4 bg-secondary/30 rounded-md">
              <h3 className="font-medium text-lg mb-2">Analysis Results:</h3>
              {analysis.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-2">{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Click "Analyze Workflow" to receive AI-powered insights on how to optimize and improve your workflow.
            </p>
          )}
          
          {analyzeMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {analyzeMutation.error instanceof Error
                  ? analyzeMutation.error.message
                  : 'Failed to analyze workflow. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleAnalyze}
          disabled={analyzeMutation.isPending}
          variant={analysis ? "outline" : "default"}
        >
          {analyzeMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <LineChart className="mr-2 h-4 w-4" />
              {analysis ? "Refresh Analysis" : "Analyze Workflow"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}