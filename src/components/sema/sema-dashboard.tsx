'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSema } from './sema-context';
import { 
  Users, 
  Target, 
  FileText, 
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3
} from 'lucide-react';

export default function SemaDashboard() {
  const { 
    activeClient, 
    stakeholders, 
    sampleParameters, 
    materialTopics, 
    internalTopics, 
    reports,
    isLoading 
  } = useSema();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!activeClient) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Client Selected</h3>
            <p className="text-muted-foreground">
              Please select a client to view the SEMA dashboard
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate progress metrics
  const stakeholderProgress = stakeholders.length > 0 ? 100 : 0;
  const sampleSizeProgress = sampleParameters ? 100 : 0;
  const externalProgress = materialTopics.length > 0 ? 100 : 0;
  const internalProgress = internalTopics.length > 0 ? 100 : 0;
  const reportingProgress = reports.length > 0 ? 100 : 0;

  const overallProgress = Math.round(
    (stakeholderProgress + sampleSizeProgress + externalProgress + internalProgress + reportingProgress) / 5
  );

  const materialTopicsCount = materialTopics.filter(t => t.is_material).length;
  const internalMaterialCount = internalTopics.filter(t => t.is_material).length;
  const totalMaterialTopics = materialTopicsCount + internalMaterialCount;

  const priorityStakeholders = stakeholders.filter(s => s.is_priority).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-green-800 dark:text-green-200">
                {activeClient.name}
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                SEMA Process Overview • {activeClient.industry} • {activeClient.size}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-800 dark:text-green-200">
                {overallProgress}%
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Overall Progress
              </div>
            </div>
          </div>
          <Progress value={overallProgress} className="h-2 mt-4" />
        </CardHeader>
      </Card>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stakeholders</p>
                <p className="text-3xl font-bold">{stakeholders.length}</p>
                <p className="text-sm text-muted-foreground">
                  {priorityStakeholders} priority
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sample Size</p>
                <p className="text-3xl font-bold">
                  {sampleParameters?.base_sample_size || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sampleParameters ? `${(sampleParameters.confidence_level * 100)}% confidence` : 'Not calculated'}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Material Topics</p>
                <p className="text-3xl font-bold">{totalMaterialTopics}</p>
                <p className="text-sm text-muted-foreground">
                  {materialTopics.length + internalTopics.length} total assessed
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reports</p>
                <p className="text-3xl font-bold">{reports.length}</p>
                <p className="text-sm text-muted-foreground">
                  {reports.filter(r => r.status === 'final').length} finalized
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Flow */}
      <Card>
        <CardHeader>
          <CardTitle>SEMA Process Flow</CardTitle>
          <CardDescription>
            Track your progress through the materiality assessment process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: 'Stakeholder Engagement',
                description: 'Identify and prioritize key stakeholders',
                progress: stakeholderProgress,
                status: stakeholderProgress === 100 ? 'completed' : stakeholderProgress > 0 ? 'in-progress' : 'pending'
              },
              {
                name: 'Sample Size Calculation',
                description: 'Determine statistically significant sample sizes',
                progress: sampleSizeProgress,
                status: sampleSizeProgress === 100 ? 'completed' : sampleSizeProgress > 0 ? 'in-progress' : 'pending'
              },
              {
                name: 'External Assessment',
                description: 'Gather stakeholder feedback on material topics',
                progress: externalProgress,
                status: externalProgress === 100 ? 'completed' : externalProgress > 0 ? 'in-progress' : 'pending'
              },
              {
                name: 'Internal Assessment',
                description: 'Evaluate internal business impact of topics',
                progress: internalProgress,
                status: internalProgress === 100 ? 'completed' : internalProgress > 0 ? 'in-progress' : 'pending'
              },
              {
                name: 'Report Generation',
                description: 'Create GRI-compliant sustainability reports',
                progress: reportingProgress,
                status: reportingProgress === 100 ? 'completed' : reportingProgress > 0 ? 'in-progress' : 'pending'
              }
            ].map((step, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {step.status === 'completed' && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                  {step.status === 'in-progress' && (
                    <Clock className="h-6 w-6 text-yellow-600" />
                  )}
                  {step.status === 'pending' && (
                    <AlertCircle className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{step.name}</h4>
                    <Badge 
                      variant={
                        step.status === 'completed' ? 'default' : 
                        step.status === 'in-progress' ? 'secondary' : 'outline'
                      }
                    >
                      {step.status === 'completed' ? 'Complete' : 
                       step.status === 'in-progress' ? 'In Progress' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {step.description}
                  </p>
                  <Progress value={step.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GRI Framework Info */}
      <Card>
        <CardHeader>
          <CardTitle>GRI Framework Integration</CardTitle>
          <CardDescription>
            This tool aligns with Global Reporting Initiative standards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">Stakeholder Engagement</h4>
              <p className="text-sm text-muted-foreground">
                Systematic identification and prioritization of stakeholders based on their influence and dependency across economic, social, and environmental dimensions.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Materiality Assessment</h4>
              <p className="text-sm text-muted-foreground">
                Dual-perspective evaluation combining external stakeholder importance with internal business impact to identify material topics.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">GRI Reporting</h4>
              <p className="text-sm text-muted-foreground">
                Automated mapping of material topics to relevant GRI disclosure standards for comprehensive sustainability reporting.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}