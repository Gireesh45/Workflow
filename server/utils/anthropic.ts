import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Extract text from content block
 */
function getTextFromContentBlock(block: any): string {
  if (!block) return '';
  return block.type === 'text' ? block.text : '';
}

/**
 * Generate workflow templates based on user inputs
 */
export async function generateWorkflowTemplate(description: string): Promise<{nodes: any[], edges: any[]}> {
  try {
    const systemPrompt = `You are a workflow design expert. 
    Based on the given description, create a workflow structure with nodes and edges.
    Return ONLY a JSON object with 'nodes' and 'edges' arrays that match the ReactFlow format.
    Each node should have id, type (START, END, API, EMAIL, or CONDITION), position {x, y}, and data properties.
    Each edge should have id, source, target, and sourceHandle/targetHandle properties.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      system: systemPrompt,
      max_tokens: 2000,
      messages: [
        { 
          role: 'user', 
          content: `Create a workflow based on this description: ${description}` 
        }
      ],
    });

    // Extract the JSON from the response
    const content = getTextFromContentBlock(response.content[0]);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const workflowData = JSON.parse(jsonMatch[0]);
      return workflowData;
    }
    
    throw new Error('Failed to parse workflow template from AI response');
  } catch (error) {
    console.error('Error generating workflow template:', error);
    // Return a basic template as fallback
    return {
      nodes: [
        {
          id: 'start',
          type: 'START',
          position: { x: 250, y: 25 },
          data: { label: 'Start' }
        },
        {
          id: 'end',
          type: 'END',
          position: { x: 250, y: 250 },
          data: { label: 'End' }
        }
      ],
      edges: [
        {
          id: 'start-end',
          source: 'start',
          target: 'end'
        }
      ]
    };
  }
}

/**
 * Analyze an existing workflow and suggest improvements
 */
export async function analyzeWorkflow(workflow: any): Promise<string> {
  try {
    const workflowJson = JSON.stringify(workflow);
    
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1500,
      messages: [
        { 
          role: 'user', 
          content: `Analyze this workflow and suggest improvements: ${workflowJson}` 
        }
      ],
    });

    return getTextFromContentBlock(response.content[0]);
  } catch (error) {
    console.error('Error analyzing workflow:', error);
    return 'Unable to analyze workflow at this time. Please try again later.';
  }
}

/**
 * Extract key insights from workflow execution results
 */
export async function analyzeWorkflowResults(results: any): Promise<string> {
  try {
    const resultsJson = JSON.stringify(results);
    
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      messages: [
        { 
          role: 'user', 
          content: `Analyze these workflow execution results and provide key insights: ${resultsJson}` 
        }
      ],
    });

    return getTextFromContentBlock(response.content[0]);
  } catch (error) {
    console.error('Error analyzing workflow results:', error);
    return 'Unable to analyze execution results at this time. Please try again later.';
  }
}