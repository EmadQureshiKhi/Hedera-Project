'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSema } from './sema-context';
import { 
  FileText, 
  Download, 
  Share2, 
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Users,
  Target
} from 'lucide-react';

export default function ReportingDashboard() {
  const { 
    activeClient, 
    stakeholders, 
    sampleParameters, 
    materialTopics, 
    internalTopics, 
    reports 
  } = useSema();

  if (!activeClient) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Client Selected</h3>
            <p className="text-muted-foreground">
              Please select a client to view reporting dashboard
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate final material topics
  const externalMaterialTopics = materialTopics.filter(t => t.is_material);
  const internalMaterialTopics = internalTopics.filter(t => t.is_material);
  
  // Combine and deduplicate by name
  const finalMaterialTopics = [
    ...externalMaterialTopics.map(t => ({ ...t, source: 'external' })),
    ...internalMaterialTopics.map(t => ({ ...t, source: 'internal' }))
  ].reduce((acc, topic) => {
    const existing = acc.find(t => t.name.toLowerCase() === topic.name.toLowerCase());
    if (!existing) {
      acc.push(topic);
    }
    return acc;
  }, [] as any[]);

  // GRI Disclosure mapping
  const griDisclosures = finalMaterialTopics.map(topic => ({
    topic: topic.name,
    category: topic.category,
    griCode: topic.gri_code || 'TBD',
    status: topic.gri_code ? 'Mapped' : 'Pending'
  }));

  // Process completion status
  const processSteps = [
    {
      name: 'Stakeholder Engagement',
      description: 'Identify and prioritize stakeholders',
      completed: stakeholders.length > 0,
      progress: stakeholders.length > 0 ? 100 : 0,
      icon: Users
    },
    {
      name: 'Sample Size Calculation',
      description: 'Determine engagement sample sizes',
      completed: !!sampleParameters,
      progress: sampleParameters ? 100 : 0,
      icon: Target
    },
    {
      name: 'External Assessment',
      description: 'Gather stakeholder feedback',
      completed: materialTopics.length > 0,
      progress: materialTopics.length > 0 ? 100 : 0,
      icon: BarChart3
    },
    {
      name: 'Internal Assessment',
      description: 'Evaluate business impact',
      completed: internalTopics.length > 0,
      progress: internalTopics.length > 0 ? 100 : 0,
      icon: CheckCircle
    },
    {
      name: 'Report Generation',
      description: 'Create sustainability reports',
      completed: finalMaterialTopics.length > 0,
      progress: finalMaterialTopics.length > 0 ? 100 : 0,
      icon: FileText
    }
  ];

  const overallProgress = Math.round(
    processSteps.reduce((sum, step) => sum + step.progress, 0) / processSteps.length
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Material Topics</p>
                <p className="text-2xl font-bold">{finalMaterialTopics.length}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">GRI Disclosures</p>
                <p className="text-2xl font-bold">{griDisclosures.filter(d => d.status === 'Mapped').length}</p>
                <p className="text-xs text-muted-foreground">of {griDisclosures.length} mapped</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Process Complete</p>
                <p className="text-2xl font-bold">{overallProgress}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reports</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
              <Download className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEMA Process Summary */}
      <Card>
        <CardHeader>
          <CardTitle>SEMA Process Summary</CardTitle>
          <CardDescription>
            Overview of completed assessment stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {step.completed ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <Clock className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{step.name}</h4>
                      <Badge 
                        variant={step.completed ? 'default' : 'outline'}
                        className={step.completed ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                      >
                        {step.completed ? 'Complete' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {step.description}
                    </p>
                    <Progress value={step.progress} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Final Material Topics */}
      <Card>
        <CardHeader>
          <CardTitle>Final Material Topics</CardTitle>
          <CardDescription>
            Topics identified as material through the SEMA process
          </CardDescription>
        </CardHeader>
        <CardContent>
          {finalMaterialTopics.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                No material topics identified yet. Complete the assessment process to generate material topics.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {finalMaterialTopics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{topic.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={topic.category === 'Environmental' ? 'default' : 
                                    topic.category === 'Social' ? 'secondary' : 'outline'}>
                        {topic.category}
                      </Badge>
                      <Badge variant="outline">
                        {topic.source === 'external' ? 'External' : 'Internal'} Assessment
                      </Badge>
                      {topic.gri_code && (
                        <Badge variant="outline">{topic.gri_code}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {topic.source === 'external' ? (
                      <p className="text-sm">Score: {topic.average_score?.toFixed(1)}/10</p>
                    ) : (
                      <p className="text-sm">Significance: {topic.significance}/25</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GRI Disclosures */}
      <Card>
        <CardHeader>
          <CardTitle>GRI Disclosure Mapping</CardTitle>
          <CardDescription>
            Material topics mapped to GRI Standards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {griDisclosures.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                No GRI disclosures to map yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Material Topic</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-center p-2">GRI Code</th>
                    <th className="text-center p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {griDisclosures.map((disclosure, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{disclosure.topic}</td>
                      <td className="p-2">
                        <Badge variant={disclosure.category === 'Environmental' ? 'default' : 
                                      disclosure.category === 'Social' ? 'secondary' : 'outline'}>
                          {disclosure.category}
                        </Badge>
                      </td>
                      <td className="p-2 text-center">
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {disclosure.griCode}
                        </code>
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant={disclosure.status === 'Mapped' ? 'default' : 'outline'}>
                          {disclosure.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export & Sharing</CardTitle>
          <CardDescription>
            Generate and share your SEMA assessment results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="h-auto p-4 flex flex-col items-center space-y-2">
              <Download className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Export to Excel</p>
                <p className="text-xs text-muted-foreground">Complete data export</p>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <FileText className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Generate PDF Report</p>
                <p className="text-xs text-muted-foreground">Executive summary</p>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Share2 className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Share Results</p>
                <p className="text-xs text-muted-foreground">Stakeholder distribution</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GRI Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>GRI Compliance Status</CardTitle>
          <CardDescription>
            Assessment against GRI Standards requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium text-green-600">✓ Completed Requirements</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Stakeholder identification and engagement</li>
                  <li>• Material topic identification process</li>
                  <li>• Impact assessment methodology</li>
                  <li>• Materiality determination criteria</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-orange-600">⚠ Next Steps</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Validate material topics with stakeholders</li>
                  <li>• Complete GRI disclosure mapping</li>
                  <li>• Develop management approach for each topic</li>
                  <li>• Establish performance indicators and targets</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}