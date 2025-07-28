'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSema } from './sema-context';
import { 
  Grid3X3, 
  TrendingUp, 
  Target,
  AlertCircle,
  Info
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
      internalImpactRaw: 0, // Keep raw 25-scale for display
      source: 'external' as const,
      isMaterial: topic.is_material
    })),
    ...internalTopics.map(topic => ({
      id: topic.id,
      name: topic.name,
      category: topic.category,
      externalImportance: 0, // No external assessment
      internalImpact: topic.significance / 2.5, // Normalize to 0-10 for positioning
      internalImpactRaw: topic.significance, // Keep raw 25-scale for display
      source: 'internal' as const,
      isMaterial: topic.is_material
    }))
  ];

  // Find topics that exist in both assessments and merge them
  const mergedTopics = combinedTopics.reduce((acc, topic) => {
    const existing = acc.find(t => t.name.toLowerCase() === topic.name.toLowerCase());
    if (existing) {
      existing.externalImportance = Math.max(existing.externalImportance, topic.externalImportance);
      existing.internalImpact = Math.max(existing.internalImpact, topic.internalImpact);
      existing.internalImpactRaw = Math.max(existing.internalImpactRaw, topic.internalImpactRaw);
      existing.source = 'both';
      existing.isMaterial = existing.isMaterial || topic.isMaterial;
    } else {
      acc.push(topic);
    }
    return acc;
  }, [] as any[]);

  const materialTopicsCount = mergedTopics.filter(t => t.isMaterial).length;
  const highPriorityTopics = mergedTopics.filter(t => 
    t.externalImportance >= 7 && t.internalImpact >= 4
  ).length;
  const bothAssessedTopics = mergedTopics.filter(t => t.source === 'both').length;

  // State for selected topic
  const [selectedTopic, setSelectedTopic] = useState<any>(null);

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
          <div className="flex items-center justify-between">
            <CardTitle>Materiality Matrix</CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span>Economic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>Environmental</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span>Social</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-red-600"></div>
                <span>Material</span>
              </div>
            </div>
          </div>
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
              <div className="relative bg-gray-50 dark:bg-gray-900 p-8 rounded-xl">
                <div className="w-full h-96 border-2 border-gray-200 dark:border-gray-700 relative bg-white dark:bg-gray-800 rounded-lg">
                  {/* Grid lines */}
                  <div className="absolute inset-0">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"></div>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300 dark:bg-gray-600"></div>
                  </div>
                  
                  {/* Quadrant labels */}
                  <div className="absolute top-4 left-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="font-medium">Low-High</div>
                    <div className="text-xs">Manage</div>
                  </div>
                  <div className="absolute top-4 right-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                    <div className="font-medium">High-High</div>
                    <div className="text-xs font-bold text-red-600">Priority</div>
                  </div>
                  <div className="absolute bottom-4 left-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="font-medium">Low-Low</div>
                    <div className="text-xs">Minimal</div>
                  </div>
                  <div className="absolute bottom-4 right-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                    <div className="font-medium">High-Low</div>
                    <div className="text-xs">Monitor</div>
                  </div>

                  {/* Axis labels */}
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    External Stakeholder Importance →
                  </div>
                  <div className="absolute -left-20 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Internal Impact Significance →
                  </div>

                  {/* Plot topics */}
                  {mergedTopics.map((topic, index) => {
                    // Add padding to keep points inside the chart area
                    const padding = 5; // 5% padding on each side
                    const x = padding + (topic.externalImportance / 10) * (100 - 2 * padding);
                    const y = padding + (1 - topic.internalImpact / 10) * (100 - 2 * padding);
                    
                    // Determine color based on category
                    let color = 'bg-blue-500'; // Default Economic
                    if (topic.category === 'Environmental') color = 'bg-green-500';
                    if (topic.category === 'Social') color = 'bg-purple-500';
                    
                    // Add red border for material topics
                    const borderClass = topic.isMaterial ? 'border-2 border-red-600' : 'border border-gray-300';
                    
                    return (
                      <div
                        key={topic.id}
                        className={`absolute w-5 h-5 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${color} ${borderClass} hover:scale-125 transition-all duration-200 shadow-lg z-10 group`}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        onMouseEnter={() => setSelectedTopic(topic)}
                        onMouseLeave={() => setSelectedTopic(null)}
                      >
                        {/* Hover tooltip */}
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg p-3 shadow-xl min-w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                          <h4 className="font-bold text-sm mb-2">{topic.name}</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">External:</span>
                              <span className="font-medium">{topic.externalImportance.toFixed(1)}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Internal:</span>
                              <span className="font-medium">{topic.internalImpactRaw}/25</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Category:</span>
                              <Badge variant={topic.category === 'Environmental' ? 'default' : 
                                            topic.category === 'Social' ? 'secondary' : 'outline'} className="text-xs">
                                {topic.category}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Material:</span>
                              <Badge variant={topic.isMaterial ? 'default' : 'outline'} className="text-xs">
                                {topic.isMaterial ? 'Yes' : 'No'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                            <span className={topic.internalImpactRaw >= 10 ? 'font-bold text-green-600' : ''}>
                              {topic.internalImpactRaw}/25
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

      {/* Matrix Methodology - Blue Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent"></div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
          <div className="h-full w-full bg-gradient-to-l from-white/20 to-transparent"></div>
        </div>
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Matrix Methodology</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* X-Axis Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4 text-white">X-Axis: External Importance</h3>
              <p className="text-blue-50 leading-relaxed">
                Based on stakeholder feedback scores (1-10 scale). Topics scoring 
                ≥7 are considered externally material by stakeholders.
              </p>
            </div>
            
            {/* Y-Axis Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4 text-white">Y-Axis: Internal Impact</h3>
              <p className="text-blue-50 leading-relaxed">
                Based on internal assessment using Severity × Likelihood (1-25 
                scale). Topics scoring ≥10 are considered internally material.
              </p>
            </div>
            
            {/* Quadrant Analysis */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4 text-white">Quadrant Analysis</h3>
              <div className="space-y-2 text-blue-50">
                <div>• High-High: Priority topics for immediate action</div>
                <div>• High-Low: Monitor external stakeholder concerns</div>
                <div>• Low-High: Manage internal risks effectively</div>
                <div>• Low-Low: Minimal attention required</div>
              </div>
            </div>
            
            {/* Materiality Determination */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4 text-white">Materiality Determination</h3>
              <p className="text-blue-50 leading-relaxed">
                Topics are considered material if they meet either external (≥7) or 
                internal (≥10) thresholds, with priority given to high-high quadrant 
                topics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}