'use client';

import React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSema } from './sema-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  TrendingUp,
  Grid3X3
} from 'lucide-react';

export default function InternalAssessment() {
  const { activeClient, internalTopics, refreshData } = useSema();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Environmental' as 'Economic' | 'Environmental' | 'Social',
    severity: 3,
    likelihood: 3
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Environmental',
      severity: 3,
      likelihood: 3
    });
    setEditingTopic(null);
    setIsFormOpen(false);
  };

  const handleEdit = (topic: any) => {
    setFormData({
      name: topic.name,
      description: topic.description || '',
      category: topic.category,
      severity: topic.severity,
      likelihood: topic.likelihood
    });
    setEditingTopic(topic);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient) return;

    setIsLoading(true);
    try {
      if (editingTopic) {
        const { error } = await supabase
          .from('sema_internal_topics')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTopic.id);

        if (error) throw error;

        toast({
          title: "Topic Updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase
          .from('sema_internal_topics')
          .insert([{
            ...formData,
            client_id: activeClient.id
          }]);

        if (error) throw error;

        toast({
          title: "Topic Added",
          description: `${formData.name} has been added successfully.`,
        });
      }

      await refreshData();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save topic",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (topic: any) => {
    if (!confirm(`Are you sure you want to delete ${topic.name}?`)) return;

    try {
      const { error } = await supabase
        .from('sema_internal_topics')
        .delete()
        .eq('id', topic.id);

      if (error) throw error;

      toast({
        title: "Topic Deleted",
        description: `${topic.name} has been deleted.`,
      });

      await refreshData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete topic",
        variant: "destructive",
      });
    }
  };

  if (!activeClient) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Client Selected</h3>
            <p className="text-muted-foreground">
              Please select a client to manage internal assessments
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const materialTopicsCount = internalTopics.filter(t => t.is_material).length;
  const averageSignificance = internalTopics.length > 0 ? 
    internalTopics.reduce((sum, t) => sum + t.significance, 0) / internalTopics.length : 0;
  const highRiskTopics = internalTopics.filter(t => t.significance >= 15).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Topics</p>
                <p className="text-2xl font-bold">{internalTopics.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
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
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold">{highRiskTopics}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Significance</p>
                <p className="text-2xl font-bold">{averageSignificance.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">out of 25</p>
              </div>
              <Grid3X3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTopic ? 'Edit Internal Topic' : 'Add New Internal Topic'}
            </CardTitle>
            <CardDescription>
              Assess internal business impact of sustainability topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Topic Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Regulatory Compliance"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: 'Economic' | 'Environmental' | 'Social') => 
                      setFormData(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Economic">Economic</SelectItem>
                      <SelectItem value="Environmental">Environmental</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the topic"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Severity (Impact)</Label>
                  <Select
                    value={formData.severity.toString()}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      severity: parseInt(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score} - {score === 1 ? 'Very Low' : score === 2 ? 'Low' : score === 3 ? 'Medium' : score === 4 ? 'High' : 'Very High'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How severe would the impact be if this topic materialized?
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Likelihood (Probability)</Label>
                  <Select
                    value={formData.likelihood.toString()}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      likelihood: parseInt(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score} - {score === 1 ? 'Very Low' : score === 2 ? 'Low' : score === 3 ? 'Medium' : score === 4 ? 'High' : 'Very High'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How likely is this topic to occur or become an issue?
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">
                  Calculated Significance: {formData.severity * formData.likelihood}
                </p>
                <p className="text-xs text-muted-foreground">
                  Topics with significance ≥ 10 are considered material
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingTopic ? 'Update Topic' : 'Add Topic'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Topics List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Internal Topics Assessment</CardTitle>
              <CardDescription>
                Evaluate business impact based on severity and likelihood
              </CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Topic
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {internalTopics.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                No internal topics defined. Add your first topic to begin assessment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Topic</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-center p-2">Severity</th>
                    <th className="text-center p-2">Likelihood</th>
                    <th className="text-center p-2">Significance</th>
                    <th className="text-center p-2">Material</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {internalTopics
                    .sort((a, b) => b.significance - a.significance)
                    .map((topic) => (
                      <tr key={topic.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{topic.name}</p>
                            {topic.description && (
                              <p className="text-xs text-muted-foreground">{topic.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant={topic.category === 'Environmental' ? 'default' : 
                                        topic.category === 'Social' ? 'secondary' : 'outline'}>
                            {topic.category}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">{topic.severity}</td>
                        <td className="p-2 text-center">{topic.likelihood}</td>
                        <td className="p-2 text-center">
                          <span className={`font-bold ${topic.significance >= 15 ? 'text-red-600' : 
                                         topic.significance >= 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {topic.significance}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          {topic.is_material ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(topic)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(topic)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Assessment Matrix */}
      {internalTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment Matrix</CardTitle>
            <CardDescription>
              Visual representation of topics by severity and likelihood
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2 text-xs">
              {/* Header row */}
              <div></div>
              <div className="text-center font-medium">1</div>
              <div className="text-center font-medium">2</div>
              <div className="text-center font-medium">3</div>
              <div className="text-center font-medium">4</div>
              <div className="text-center font-medium">5</div>
              
              {/* Matrix rows */}
              {[5, 4, 3, 2, 1].map((severity) => (
                <React.Fragment key={severity}>
                  <div className="flex items-center justify-center font-medium">{severity}</div>
                  {[1, 2, 3, 4, 5].map((likelihood) => {
                    const significance = severity * likelihood;
                    const topicsInCell = internalTopics.filter(
                      t => t.severity === severity && t.likelihood === likelihood
                    );
                    
                    return (
                      <div
                        key={`${severity}-${likelihood}`}
                        className={`aspect-square border rounded p-1 text-xs ${
                          significance >= 15 ? 'bg-red-100 border-red-300' :
                          significance >= 10 ? 'bg-yellow-100 border-yellow-300' :
                          'bg-green-100 border-green-300'
                        }`}
                      >
                        <div className="text-center font-bold">{significance}</div>
                        {topicsInCell.map((topic, index) => (
                          <div key={index} className="truncate" title={topic.name}>
                            {topic.name.substring(0, 8)}...
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span>High Risk (15-25)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span>Medium Risk (10-14)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>Low Risk (1-9)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}