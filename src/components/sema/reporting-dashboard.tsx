'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSema } from './sema-context';
import { HcsTransactionDisplay } from '@/components/ui/hcs-transaction-display';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Share2, 
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Users,
  Target,
  Database,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';

export default function ReportingDashboard() {
  const { 
    activeClient, 
    stakeholders, 
    sampleParameters, 
    materialTopics, 
    internalTopics, 
    reports,
    latestReportHcsTx,
    finalizeReport
  } = useSema();
  const { toast } = useToast();
  const [isFinalizingReport, setIsFinalizingReport] = useState(false);

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
    } else {
      // Merge data if topic exists in both assessments
      if (topic.source === 'external' && existing.source === 'internal') {
        existing.external_score = topic.average_score;
        existing.external_responses = topic.response_count;
        existing.gri_code = topic.gri_code;
        existing.source = 'both';
      } else if (topic.source === 'internal' && existing.source === 'external') {
        existing.internal_score = topic.significance;
        existing.severity = topic.severity;
        existing.likelihood = topic.likelihood;
        existing.source = 'both';
      }
    }
    return acc;
  }, [] as any[]);

  // GRI Disclosure mapping
  const griDisclosures = finalMaterialTopics
    .filter(topic => topic.gri_code)
    .map(topic => ({
      topic: topic.name,
      category: topic.category,
      griCode: topic.gri_code,
      status: 'Mapped'
    }));

  const totalGriDisclosures = finalMaterialTopics.length;
  const mappedGriDisclosures = griDisclosures.length;

  // Calculate progress metrics
  const stakeholderProgress = stakeholders.length > 0 ? 100 : 0;
  const sampleSizeProgress = sampleParameters ? 100 : 0;
  const externalProgress = materialTopics.length > 0 ? 100 : 0;
  const internalProgress = internalTopics.length > 0 ? 100 : 0;
  const overallProgress = Math.round((stakeholderProgress + sampleSizeProgress + externalProgress + internalProgress) / 4);

  const priorityStakeholders = stakeholders.filter(s => s.is_priority).length;

  const handleFinalizeReport = async () => {
    if (!activeClient) return;

    setIsFinalizingReport(true);
    try {
      const reportData = {
        clientId: activeClient.id,
        clientName: activeClient.name,
        materialTopics: finalMaterialTopics,
        stakeholders: stakeholders.length,
        priorityStakeholders,
        griDisclosures: mappedGriDisclosures,
        processMetrics: {
          stakeholderProgress,
          sampleSizeProgress,
          externalProgress,
          internalProgress,
          overallProgress
        }
      };

      await finalizeReport(reportData);
      
      toast({
        title: "Report Finalized",
        description: "SEMA report has been logged to Hedera Consensus Service for verification.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to finalize report",
        variant: "destructive",
      });
    } finally {
      setIsFinalizingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reporting Dashboard</h1>
            <p className="text-muted-foreground">
              Final material topics and GRI-ready sustainability disclosures for {activeClient.name}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Generated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'numeric', 
              day: 'numeric' 
            })}</span>
            <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
          </div>
        </div>

        {/* SEMA Process Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Process Steps */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">SEMA Process Summary</h3>
                <div className="space-y-5">
                  {[
                    { name: 'Stakeholder Engagement', icon: Users, progress: 100 },
                    { name: 'Materiality Assessment', icon: TrendingUp, progress: 100 },
                    { name: 'Topic Validation', icon: CheckCircle, progress: 100 },
                    { name: 'Report Preparation', icon: FileText, progress: 100 }
                  ].map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={index} className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <Icon className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{step.name}</span>
                            <span className="text-sm font-bold">{step.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${step.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-xl font-bold mb-6 text-blue-900 dark:text-blue-100">Key Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 px-4 bg-white dark:bg-blue-900 rounded-lg border border-blue-100 dark:border-blue-700">
                    <span className="text-muted-foreground">Stakeholders Engaged</span>
                    <span className="text-2xl font-bold text-blue-600">{stakeholders.filter(s => s.is_priority).length}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-white dark:bg-blue-900 rounded-lg border border-blue-100 dark:border-blue-700">
                    <span className="text-muted-foreground">Topics Assessed</span>
                    <span className="text-2xl font-bold text-blue-600">{materialTopics.length + internalTopics.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-white dark:bg-blue-900 rounded-lg border border-blue-100 dark:border-blue-700">
                    <span className="text-muted-foreground">Material Topics</span>
                    <span className="text-2xl font-bold text-green-600">{finalMaterialTopics.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-white dark:bg-blue-900 rounded-lg border border-blue-100 dark:border-blue-700">
                    <span className="text-muted-foreground">GRI Disclosures</span>
                    <span className="text-2xl font-bold text-blue-600">{mappedGriDisclosures}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Summary Cards - Matching your design */}
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
                <p className="text-2xl font-bold">{mappedGriDisclosures}</p>
                <p className="text-xs text-muted-foreground">of {totalGriDisclosures} mapped</p>
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
                <p className="text-2xl font-bold">100%</p>
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

      {/* Finalize Report Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
            <CheckCircle className="h-5 w-5" />
            Finalize SEMA Report
          </CardTitle>
          <CardDescription>
            Log your completed SEMA assessment to Hedera for immutable verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-purple-200 dark:border-purple-700">
            <h4 className="font-semibold mb-4">Report Summary</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Stakeholders:</span>
                  <span className="font-medium">{stakeholders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority Stakeholders:</span>
                  <span className="font-medium">{priorityStakeholders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material Topics:</span>
                  <span className="font-medium">{finalMaterialTopics.length}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GRI Disclosures:</span>
                  <span className="font-medium">{mappedGriDisclosures}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Process Complete:</span>
                  <span className="font-medium">{overallProgress}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assessment Date:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Button 
              onClick={handleFinalizeReport}
              disabled={isFinalizingReport || overallProgress < 70}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isFinalizingReport ? (
                <>
                  <Clock className="h-5 w-5 mr-2 animate-spin" />
                  Logging to Hedera...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Finalize & Log to Hedera
                </>
              )}
            </Button>
            {overallProgress < 70 && (
              <p className="text-sm text-muted-foreground mt-2">
                Complete at least 70% of the SEMA process to finalize the report
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* HCS Transaction Display */}
      <HcsTransactionDisplay 
        transaction={latestReportHcsTx}
        title="Report Finalization Verification"
        description="SEMA report completion logged to Hedera Consensus Service"
      />

      {/* Final Material Topics - New Card-based Design */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle>Final Material Topics</CardTitle>
          </div>
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
            <div className="space-y-6">
              {finalMaterialTopics.map((topic, index) => {
                const externalScore = topic.external_score || topic.average_score || 0;
                const internalScore = topic.internal_score || topic.significance || 0;
                const hasExternal = topic.source === 'external' || topic.source === 'both';
                const hasInternal = topic.source === 'internal' || topic.source === 'both';
                
                return (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{topic.name}</h3>
                          <Badge variant={topic.category === 'Environmental' ? 'default' : 
                                        topic.category === 'Social' ? 'secondary' : 'outline'}>
                            {topic.category}
                          </Badge>
                        </div>
                      </div>
                      {topic.gri_code && (
                        <div className="text-right">
                          <p className="text-sm text-blue-600 font-medium">GRI Disclosure</p>
                          <p className="text-lg font-bold text-blue-600">{topic.gri_code}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 mb-4">
                      {hasExternal && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">External Score:</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${(externalScore / 10) * 100}%` }}
                              ></div>
                            </div>
                            <span className="font-bold">{externalScore}/10</span>
                          </div>
                        </div>
                      )}

                      {hasInternal && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Internal Score:</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${(internalScore / 25) * 100}%` }}
                              ></div>
                            </div>
                            <span className="font-bold">{internalScore}/25</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Rationale</h4>
                      <p className="text-sm text-muted-foreground">
                        {topic.description || getTopicRationale(topic.name, topic.category)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GRI Disclosures - Cleaner Design */}
      <Card>
        <CardHeader>
          <CardTitle>GRI Disclosure Mapping</CardTitle>
          <CardDescription>
            Material topics mapped to GRI Standards for comprehensive reporting
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
            <div className="grid gap-3">
              {griDisclosures.map((disclosure, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{disclosure.topic}</h4>
                      <Badge variant={disclosure.category === 'Environmental' ? 'default' : 
                                    disclosure.category === 'Social' ? 'secondary' : 'outline'} 
                             className="text-xs">
                        {disclosure.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="bg-blue-100 dark:bg-blue-900 text-blue-600 px-3 py-1 rounded-lg font-mono text-sm">
                      {disclosure.griCode}
                    </code>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {disclosure.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options - New Design Matching Your Screenshot */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            <CardTitle>Export Options</CardTitle>
          </div>
          <CardDescription>
            Generate and download your SEMA assessment results in multiple formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Excel Report */}
            <div className="bg-green-50 dark:bg-green-950 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-800 dark:text-green-200">Excel Report</h3>
                  <p className="text-sm text-green-600 dark:text-green-400">Complete SEMA analysis</p>
                </div>
              </div>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 mb-4">
                <li>• Stakeholder engagement data</li>
                <li>• Material topics with scores</li>
                <li>• GRI disclosure mapping</li>
                <li>• Statistical calculations</li>
              </ul>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                Download Excel
              </Button>
            </div>

            {/* PDF Summary */}
            <div className="bg-red-50 dark:bg-red-950 rounded-xl p-6 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-red-800 dark:text-red-200">PDF Summary</h3>
                  <p className="text-sm text-red-600 dark:text-red-400">Executive summary</p>
                </div>
              </div>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 mb-4">
                <li>• Final material topics</li>
                <li>• Materiality matrix</li>
                <li>• Process methodology</li>
                <li>• GRI compliance checklist</li>
              </ul>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                Download PDF
              </Button>
            </div>

            {/* JSON Data */}
            <div className="bg-purple-50 dark:bg-purple-950 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-800 dark:text-purple-200">JSON Data</h3>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Raw data export</p>
                </div>
              </div>
              <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1 mb-4">
                <li>• Structured data format</li>
                <li>• API integration ready</li>
                <li>• All assessment data</li>
                <li>• Custom processing</li>
              </ul>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                Download JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRI Compliance Status - Cleaner Design */}
      <Card>
        <CardHeader>
          <CardTitle>GRI Compliance Status</CardTitle>
          <CardDescription>
            Assessment against GRI Standards requirements for materiality determination
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Completed Requirements */}
            <div className="bg-green-50 dark:bg-green-950 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold text-green-800 dark:text-green-200">Completed Requirements</h3>
              </div>
              <div className="space-y-3">
                {[
                  'Stakeholder identification and engagement',
                  'Material topic identification process',
                  'Impact assessment methodology',
                  'Materiality determination criteria',
                  'Dual materiality perspective applied',
                  'GRI disclosure mapping completed'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-green-700 dark:text-green-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Next Steps */}
            <div className="bg-orange-50 dark:bg-orange-950 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-6 w-6 text-orange-600" />
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">Recommended Next Steps</h3>
              </div>
              <div className="space-y-3">
                {[
                  'Validate material topics with stakeholders',
                  'Develop management approach for each topic',
                  'Establish performance indicators and targets',
                  'Create disclosure timeline and responsibilities',
                  'Implement monitoring and review processes',
                  'Prepare for external assurance'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <span className="text-sm text-orange-700 dark:text-orange-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to generate rationale text for topics
function getTopicRationale(topicName: string, category: string): string {
  const rationales: Record<string, string> = {
    'GHG Emissions': 'High regulatory risk and stakeholder concern regarding climate impact and carbon footprint management.',
    'Economic Performance': 'Core business performance metric with high impact on stakeholders and long-term sustainability.',
    'Employee Health & Safety': 'Critical for operational continuity, regulatory compliance, and employee retention.',
    'Data Privacy': 'Increasing regulatory requirements and stakeholder expectations for data protection.',
    'Supply Chain Ethics': 'Growing stakeholder awareness and regulatory focus on ethical sourcing practices.',
    'Water Management': 'Environmental stewardship concern with moderate stakeholder interest.',
    'Cybersecurity Threats': 'High business risk with significant operational and reputational impact.',
    'Supply Chain Disruption': 'Critical business continuity risk affecting operational resilience.',
    'Regulatory Compliance': 'Essential for maintaining operating license and avoiding penalties.',
    'Talent Retention': 'Key to maintaining competitive advantage and operational capability.',
    'Climate Change Impact': 'Long-term physical risk requiring strategic planning and adaptation.',
    'Renewable Energy Transition': 'Strategic priority for reducing environmental impact and meeting stakeholder expectations.',
    'Employee Well-being & Diversity': 'Critical for talent attraction, retention, and organizational culture.',
    'Circular Economy Practices': 'Emerging stakeholder expectation for sustainable resource management.',
    'Ethical AI Development': 'Growing concern for responsible technology development and deployment.'
  };
  
  return rationales[topicName] || `${category} topic with significant stakeholder interest and business impact.`;
}