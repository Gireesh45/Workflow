import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Help & Documentation</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Basic information on how to use the Workflow Management System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What is a workflow?</AccordionTrigger>
                <AccordionContent>
                  A workflow is a series of steps that are connected together to automate a process. 
                  In our system, workflows are visualized as flowcharts with different types of nodes 
                  representing various actions, such as API calls, email notifications, and conditional logic.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>How do I create a new workflow?</AccordionTrigger>
                <AccordionContent>
                  To create a new workflow, navigate to the Workflows page and click the "Create Workflow" button. 
                  This will take you to the workflow editor where you can give your workflow a name and start adding nodes.
                  Drag nodes from the panel on the left onto the canvas, then connect them by dragging from one node's output 
                  handle to another node's input handle.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>What types of nodes are available?</AccordionTrigger>
                <AccordionContent>
                  The system currently supports the following node types:
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li><strong>Start</strong>: The entry point of your workflow</li>
                    <li><strong>End</strong>: The termination point of your workflow</li>
                    <li><strong>API</strong>: Make HTTP requests to external services</li>
                    <li><strong>Email</strong>: Send email notifications</li>
                    <li><strong>Condition</strong>: Branch your workflow based on conditions</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>How do I run a workflow?</AccordionTrigger>
                <AccordionContent>
                  To run a workflow, go to the Workflows page, find the workflow you want to run, 
                  and click the "Run" button. You'll see real-time status updates as the workflow executes, 
                  and you can view detailed results including success/failure status for each node.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Features</CardTitle>
            <CardDescription>
              Learn about advanced capabilities of the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced-1">
                <AccordionTrigger>How do conditional nodes work?</AccordionTrigger>
                <AccordionContent>
                  Conditional nodes allow your workflow to take different paths based on specific criteria. 
                  When configuring a condition node, you can define expressions to evaluate data from previous steps 
                  and determine which branch of the workflow to follow next.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="advanced-2">
                <AccordionTrigger>Can I schedule workflows to run automatically?</AccordionTrigger>
                <AccordionContent>
                  Scheduled workflows are planned for a future update. This feature will allow you to set up 
                  workflows to run at specific intervals or at designated times without manual intervention.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="advanced-3">
                <AccordionTrigger>How do I access data from previous nodes?</AccordionTrigger>
                <AccordionContent>
                  Each node in a workflow can access the outputs from previous nodes. When configuring a node, 
                  you can reference these outputs using a special syntax. This allows data to flow through your 
                  workflow and enables complex automation scenarios.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
            <CardDescription>
              Solutions for common issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="troubleshooting-1">
                <AccordionTrigger>My workflow failed to execute</AccordionTrigger>
                <AccordionContent>
                  When a workflow fails, check the execution results to identify which specific node failed. 
                  Common causes include invalid API endpoints, authentication issues with external services, 
                  or improperly configured conditions. Review the error message associated with the failed node 
                  and adjust your workflow configuration accordingly.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="troubleshooting-2">
                <AccordionTrigger>Can't connect nodes in the workflow editor</AccordionTrigger>
                <AccordionContent>
                  Make sure you're dragging from an output handle (usually on the right side of a node) 
                  to an input handle (usually on the left side of another node). Connections must follow 
                  the logical flow of the workflow. Also, some nodes may have restrictions on the types of 
                  connections they can accept.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="troubleshooting-3">
                <AccordionTrigger>How do I recover a deleted workflow?</AccordionTrigger>
                <AccordionContent>
                  Currently, there is no built-in recovery for deleted workflows. We recommend exporting 
                  important workflows or making a backup before making significant changes. A versioning 
                  system is planned for a future update to help with this issue.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}