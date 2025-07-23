'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSema } from './sema-context';
import { 
  Grid3X3, 
  TrendingUp, 
  Target,
  AlertCircle
} from 'lucide-react';

export default function MaterialityMatrix() {
  const { activeClient, materialTopics, internalTopics } = useSema();

  if (!activeClient) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Client Selected</h3>
            <p className="text-muted-foreground">
              Please select a client to view the materiality matrix
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Combine external and internal topics
  const combinedTopics = [
    ...materialTopics.map(topic => ({
      id: topic.id,
      name: topic.name,
      category: topic.category,
      externalImportance: topic.average_score, // 0-10 scale
      internalImpact: 0, // No internal assessment
      source: 'external' as const,
      isMaterial: topic.is_material
    })),
    ...internalTopics.map(topic => ({
      id: topic.id,
      name: topic.name,
      category: topic.category,
      externalImportance: 0, // No external assessment
      internalImpact: topic.significance, // 0-25 scale, normalize to 0-10
      source: 'internal' as const,
      isMaterial: topic.is_material
    }))
  ];

  // Find topics that exist in both assessments and merge them
  const mergedTopics = combinedTopics.reduce((acc, topic) => {
    const existing = acc.find(t => t.name.toLowerCase() === topic.name.toLowerCase());
    if (existing) {
      existing.externalImportance = Math.max(existing.externalImportance, topic.externalImportance);
      existing.internalImpact = Math.max(existing.internalImpact, topic.internalImpact / 2.5); // Normalize 25 scale to 10
      existing.source = 'both';
      existing.isMaterial = existing.isMaterial || topic.isMaterial;
    } else {
      acc.push({
        ...topic,
        internalImpact: topic.source === 'internal' ? topic.internalImpact / 2.5 : topic.internalImpact
      });
    }
    return acc;
  }, [] as any[]);

  const materialTopicsCount = mergedTopics.filter(t => t.isMaterial).length;
  const highPriorityTopics = mergedTopics.filter(t => 
    t.externalImportance >= 7 && t.internalImpact >= 4
  ).length;
  const bothAssessedTopics = mergedTopics.filter(t => t.source === 'both').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Topics</p>
                <p className="text-2xl font-bold">{mergedTopics.length}</p>
              </div>
              <Grid3X3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Material Topics</p>
                <p className="text-2xl font-bold">{materialTopicsCount}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">{highPriorityTopics}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Both Assessed</p>
                <p className="text-2xl font-bold">{bothAssessedTopics}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materiality Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Materiality Matrix</CardTitle>
          <CardDescription>
            Topics plotted by external importance (stakeholder view) vs internal impact (business view)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mergedTopics.length === 0 ? (
            <div className="text-center py-12">
              <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Topics Available</h3>
              <p className="text-muted-foreground">
                Add topics in the Questionnaire Engine and Internal Assessment to see the materiality matrix
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Matrix Chart */}
              <div className="relative">
                <div className="w-full h-96 border-2 border-muted relative bg-gradient-to-tr from-green-50 via-yellow-50 to-red-50">
                  {/* Quadrant lines */}
                  <div className="absolute inset-0">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-muted-foreground/30"></div>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-muted-foreground/30"></div>
                  </div>
                  
                  {/* Quadrant labels */}
                  <div className="absolute top-2 left-2 text-xs text-muted-foreground">
                    Low External<br/>High Internal
                  </div>
                  <div className="absolute top-2 right-2 text-xs text-muted-foreground text-right">
                    High External<br/>High Internal<br/>
                    <span className="font-bold text-red-600">PRIORITY</span>
                  </div>
                  <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
                    Low External<br/>Low Internal
                  </div>
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground text-right">
                    High External<br/>Low Internal
                  </div>

                  {/* Plot topics */}
                  {mergedTopics.map((topic, index) => {
                    const x = (topic.externalImportance / 10) * 100; // Convert to percentage
                    const y = 100 - (topic.internalImpact / 10) * 100; // Invert Y axis
                    
                    return (
                      <div
                        key={topic.id}
                        className={`absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${
                          topic.isMaterial ? 'bg-red-500' : 'bg-blue-500'
                        } hover:scale-150 transition-transform`}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        title={`${topic.name} (${topic.externalImportance.toFixed(1)}, ${topic.internalImpact.toFixed(1)})`}
                      >
                        <div className="absolute left-4 top-0 bg-white border rounded px-1 py-0.5 text-xs whitespace-nowrap shadow-lg opacity-0 hover:opacity-100 transition-opacity z-10">
                          {topic.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Axis labels */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm font-medium">
                  External Importance (Stakeholder Perspective) →
                </div>
                <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm font-medium">
                  Internal Impact (Business Perspective) →
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Material Topics</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Non-Material Topics</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Topics Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Topic Analysis</CardTitle>
          <CardDescription>
            Complete breakdown of all topics with their scores and materiality status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mergedTopics.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No topics to analyze</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Topic</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-center p-2">External Importance</th>
                    <th className="text-center p-2">Internal Impact</th>
                    <th className="text-center p-2">Assessment</th>
                    <th className="text-center p-2">Material</th>
                    <th className="text-center p-2">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {mergedTopics
                    .sort((a, b) => (b.externalImportance + b.internalImpact) - (a.externalImportance + a.internalImpact))
                    .map((topic) => {
                      const isHighPriority = topic.externalImportance >= 7 && topic.internalImpact >= 4;
                      
                      return (
                        <tr key={topic.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{topic.name}</td>
                          <td className="p-2">
                            <Badge variant={topic.category === 'Environmental' ? 'default' : 
                                          topic.category === 'Social' ? 'secondary' : 'outline'}>
                              {topic.category}
                            </Badge>
                          </td>
                          <td className="p-2 text-center">
                            <span className={topic.externalImportance >= 7 ? 'font-bold text-green-600' : ''}>
                              {topic.externalImportance.toFixed(1)}/10
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <span className={topic.internalImpact >= 4 ? 'font-bold text-green-600' : ''}>
                              {topic.internalImpact.toFixed(1)}/10
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <Badge variant={topic.source === 'both' ? 'default' : 'outline'}>
                              {topic.source === 'both' ? 'Both' : 
                               topic.source === 'external' ? 'External' : 'Internal'}
                            </Badge>
                          </td>
                          <td className="p-2 text-center">
                            {topic.isMaterial ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline">No</Badge>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            {isHighPriority ? (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                High
                              </Badge>
                            ) : (
                              <Badge variant="outline">Standard</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matrix Methodology */}
      <Card>
        <CardHeader>
          <CardTitle>Matrix Methodology</CardTitle>
          <CardDescription>
            Understanding the materiality assessment framework
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">External Importance (X-Axis)</h4>
              <div className="space-y-2 text-sm">
                <p>• Derived from stakeholder questionnaire responses</p>
                <p>• Scale: 1-10 (stakeholder rating of topic importance)</p>
                <p>• Threshold: Topics scoring ≥7 are considered externally material</p>
                <p>• Represents: How important stakeholders consider this topic</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Internal Impact (Y-Axis)</h4>
              <div className="space-y-2 text-sm">
                <p>• Derived from internal business impact assessment</p>
                <p>• Scale: 1-10 (normalized from severity × likelihood)</p>
                <p>• Threshold: Topics scoring ≥4 are considered internally material</p>
                <p>• Represents: Business significance and potential impact</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Materiality Determination</h4>
              <div className="space-y-2 text-sm">
                <p>• A topic is material if it meets either threshold</p>
                <p>• High Priority: Both external ≥7 AND internal ≥4</p>
                <p>• Topics in the top-right quadrant require immediate attention</p>
                <p>• Regular review ensures materiality remains current</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">GRI Alignment</h4>
              <div className="space-y-2 text-sm">
                <p>• Follows GRI Standards materiality principle</p>
                <p>• Considers both impact on stakeholders and business</p>
                <p>• Supports GRI 3: Material Topics disclosure</p>
                <p>• Enables focused sustainability reporting</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}