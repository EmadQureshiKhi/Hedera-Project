'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { HcsTransactionDisplay } from '@/components/ui/hcs-transaction-display';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Clock,
  Star,
  BarChart3
} from 'lucide-react';

const GRI_CODES = [
  'GRI 201', 'GRI 202', 'GRI 203', 'GRI 204', 'GRI 205', 'GRI 206', 'GRI 207',
  'GRI 301', 'GRI 302', 'GRI 303', 'GRI 304', 'GRI 305', 'GRI 306', 'GRI 307', 'GRI 308',
  'GRI 401', 'GRI 402', 'GRI 403', 'GRI 404', 'GRI 405', 'GRI 406', 'GRI 407', 'GRI 408', 
  'GRI 409', 'GRI 410', 'GRI 411', 'GRI 412', 'GRI 413', 'GRI 414', 'GRI 415', 'GRI 416', 
  'GRI 417', 'GRI 418'
];

export default function QuestionnaireEngine() {
  const { 
    activeClient, 
    materialTopics, 
    questionnaireResponses, 
    refreshData, 
    latestMaterialTopicHcsTx,
    addMaterialTopic,
    updateMaterialTopic,
    deleteMaterialTopic
  } = useSema();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Environmental' as 'Economic' | 'Environmental' | 'Social',
    gri_code: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Environmental',
      gri_code: ''
    });
    setEditingTopic(null);
    setIsFormOpen(false);
  };

  const handleEdit = (topic: any) => {
    setFormData({
      name: topic.name,
      description: topic.description || '',
      category: topic.category,
      gri_code: topic.gri_code || ''
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
        await updateMaterialTopic(editingTopic.id, formData);

        toast({
          title: "Topic Updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        await addMaterialTopic(formData);

        toast({
          title: "Topic Added",
          description: `${formData.name} has been added successfully.`,
        });
      }

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
      await deleteMaterialTopic(topic.id);

      toast({
        title: "Topic Deleted",
        description: `${topic.name} has been deleted.`,
      });
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
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Client Selected</h3>
            <p className="text-muted-foreground">
              Please select a client to manage questionnaires
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const materialTopicsCount = materialTopics.filter(t => t.is_material).length;
  const averageScore = materialTopics.length > 0 ? 
    materialTopics.reduce((sum, t) => sum + t.average_score, 0) / materialTopics.length : 0;
  const totalResponses = materialTopics.reduce((sum, t) => sum + t.response_count, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Topics</p>
                <p className="text-2xl font-bold">{materialTopics.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
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
              <Star className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Responses</p>
                <p className="text-2xl font-bold">{totalResponses}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Score</p>
                <p className="text-2xl font-bold">{averageScore.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">out of 10</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTopic ? 'Edit Material Topic' : 'Add New Material Topic'}
            </CardTitle>
            <CardDescription>
              Define topics for stakeholder assessment
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
                    placeholder="e.g., GHG Emissions"
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

                <div className="space-y-2">
                  <Label htmlFor="gri_code">GRI Code (Optional)</Label>
                  <Select
                    value={formData.gri_code}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gri_code: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select GRI code" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRI_CODES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
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

      {/* Topics Management */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topics">Material Topics</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Material Topics Overview</CardTitle>
                  <CardDescription>
                    External stakeholder assessment of topic importance
                  </CardDescription>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Topic
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {materialTopics.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    No topics defined. Add your first material topic to begin assessment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {materialTopics.map((topic) => (
                    <div key={topic.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{topic.name}</h4>
                          <Badge variant={topic.category === 'Environmental' ? 'default' : 
                                        topic.category === 'Social' ? 'secondary' : 'outline'}>
                            {topic.category}
                          </Badge>
                          {topic.is_material && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Material
                            </Badge>
                          )}
                          {topic.gri_code && (
                            <Badge variant="outline">{topic.gri_code}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{topic.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Score: {topic.average_score.toFixed(1)}/10</span>
                          <span>Responses: {topic.response_count}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Material Topics Analysis</CardTitle>
              <CardDescription>
                Topics scoring 7+ are considered material
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {materialTopics
                  .sort((a, b) => b.average_score - a.average_score)
                  .map((topic) => (
                    <div key={topic.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{topic.name}</h4>
                        <p className="text-sm text-muted-foreground">{topic.category}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(topic.average_score / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-bold">{topic.average_score.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {topic.response_count} responses
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simulated Responses</CardTitle>
              <CardDescription>
                Mock stakeholder feedback on topic importance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Response simulation feature coming soon. This will show individual stakeholder responses to each topic.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* HCS Transaction Display */}
      <HcsTransactionDisplay 
        transaction={latestMaterialTopicHcsTx}
        title="Material Topics Verification"
        description="Latest material topic action logged to Hedera Consensus Service"
      />
    </div>
  );
}