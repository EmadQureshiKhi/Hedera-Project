'use client';

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
import { useSema, SemaStakeholder } from './sema-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp,
  Target,
  AlertCircle,
  Info
} from 'lucide-react';

const STAKEHOLDER_TYPES = [
  'Employees',
  'Customers',
  'Investors',
  'Suppliers',
  'Local Community',
  'Government',
  'NGOs',
  'Media',
  'Industry Associations',
  'Competitors',
  'Other'
];

export default function StakeholderManagement() {
  const { activeClient, stakeholders, refreshData } = useSema();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<SemaStakeholder | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'External' as 'Internal' | 'External',
    stakeholder_type: '',
    dependency_economic: 3,
    dependency_social: 3,
    dependency_environmental: 3,
    influence_economic: 3,
    influence_social: 3,
    influence_environmental: 3,
    population_size: 0
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'External',
      stakeholder_type: '',
      dependency_economic: 3,
      dependency_social: 3,
      dependency_environmental: 3,
      influence_economic: 3,
      influence_social: 3,
      influence_environmental: 3,
      population_size: 0
    });
    setEditingStakeholder(null);
    setIsFormOpen(false);
  };

  const handleEdit = (stakeholder: SemaStakeholder) => {
    setFormData({
      name: stakeholder.name,
      category: stakeholder.category,
      stakeholder_type: stakeholder.stakeholder_type || '',
      dependency_economic: stakeholder.dependency_economic,
      dependency_social: stakeholder.dependency_social,
      dependency_environmental: stakeholder.dependency_environmental,
      influence_economic: stakeholder.influence_economic,
      influence_social: stakeholder.influence_social,
      influence_environmental: stakeholder.influence_environmental,
      population_size: stakeholder.population_size
    });
    setEditingStakeholder(stakeholder);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient) return;

    setIsLoading(true);
    try {
      if (editingStakeholder) {
        // Update existing stakeholder
        const { error } = await supabase
          .from('sema_stakeholders')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingStakeholder.id);

        if (error) throw error;

        toast({
          title: "Stakeholder Updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        // Create new stakeholder
        const { error } = await supabase
          .from('sema_stakeholders')
          .insert([{
            ...formData,
            client_id: activeClient.id
          }]);

        if (error) throw error;

        toast({
          title: "Stakeholder Added",
          description: `${formData.name} has been added successfully.`,
        });
      }

      await refreshData();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save stakeholder",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (stakeholder: SemaStakeholder) => {
    if (!confirm(`Are you sure you want to delete ${stakeholder.name}?`)) return;

    try {
      const { error } = await supabase
        .from('sema_stakeholders')
        .delete()
        .eq('id', stakeholder.id);

      if (error) throw error;

      toast({
        title: "Stakeholder Deleted",
        description: `${stakeholder.name} has been deleted.`,
      });

      await refreshData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete stakeholder",
        variant: "destructive",
      });
    }
  };

  if (!activeClient) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Client Selected</h3>
            <p className="text-muted-foreground">
              Please select a client to manage stakeholders
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const priorityStakeholders = stakeholders.filter(s => s.is_priority);
  const highInfluenceStakeholders = stakeholders.filter(s => s.influence_category === 'High');
  const lowPriorityStakeholders = stakeholders.filter(s => !s.is_priority);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Stakeholders</p>
                <p className="text-2xl font-bold">{stakeholders.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Priority Stakeholders</p>
                <p className="text-2xl font-bold">{priorityStakeholders.length}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Influence</p>
                <p className="text-2xl font-bold">{highInfluenceStakeholders.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Priority</p>
                <p className="text-2xl font-bold">{lowPriorityStakeholders.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingStakeholder ? 'Edit Stakeholder' : 'Add New Stakeholder'}
            </CardTitle>
            <CardDescription>
              Assess stakeholder dependency and influence across three dimensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Stakeholder Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter stakeholder name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stakeholder_type">Type</Label>
                  <Select
                    value={formData.stakeholder_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, stakeholder_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stakeholder type" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAKEHOLDER_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: 'Internal' | 'External') => 
                      setFormData(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Internal">Internal</SelectItem>
                      <SelectItem value="External">External</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="population_size">Population Size</Label>
                  <Input
                    id="population_size"
                    type="number"
                    min="0"
                    value={formData.population_size}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      population_size: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="Estimated population size"
                  />
                </div>
              </div>

              {/* Dependency Scores */}
              <div className="space-y-4">
                <h4 className="font-medium">Dependency Assessment (1-5 scale)</h4>
                <p className="text-sm text-muted-foreground">
                  How much does this stakeholder depend on your organization?
                </p>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Economic Dependency</Label>
                    <Select
                      value={formData.dependency_economic.toString()}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        dependency_economic: parseInt(value) 
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
                  </div>

                  <div className="space-y-2">
                    <Label>Social Dependency</Label>
                    <Select
                      value={formData.dependency_social.toString()}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        dependency_social: parseInt(value) 
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
                  </div>

                  <div className="space-y-2">
                    <Label>Environmental Dependency</Label>
                    <Select
                      value={formData.dependency_environmental.toString()}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        dependency_environmental: parseInt(value) 
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
                  </div>
                </div>
              </div>

              {/* Influence Scores */}
              <div className="space-y-4">
                <h4 className="font-medium">Influence Assessment (1-5 scale)</h4>
                <p className="text-sm text-muted-foreground">
                  How much influence does this stakeholder have over your organization?
                </p>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Economic Influence</Label>
                    <Select
                      value={formData.influence_economic.toString()}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        influence_economic: parseInt(value) 
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
                  </div>

                  <div className="space-y-2">
                    <Label>Social Influence</Label>
                    <Select
                      value={formData.influence_social.toString()}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        influence_social: parseInt(value) 
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
                  </div>

                  <div className="space-y-2">
                    <Label>Environmental Influence</Label>
                    <Select
                      value={formData.influence_environmental.toString()}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        influence_environmental: parseInt(value) 
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
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingStakeholder ? 'Update Stakeholder' : 'Add Stakeholder'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stakeholder List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stakeholder List</CardTitle>
              <CardDescription>
                Manage and prioritize your key stakeholders
              </CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Stakeholder
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stakeholders.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Stakeholders Added</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your key stakeholders to begin the assessment
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Stakeholder
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-center p-2">Total Score</th>
                    <th className="text-center p-2">Influence</th>
                    <th className="text-center p-2">Priority</th>
                    <th className="text-center p-2">Population</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stakeholders.map((stakeholder) => (
                    <tr key={stakeholder.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{stakeholder.name}</td>
                      <td className="p-2">
                        <Badge variant={stakeholder.category === 'Internal' ? 'default' : 'secondary'}>
                          {stakeholder.category}
                        </Badge>
                      </td>
                      <td className="p-2">{stakeholder.stakeholder_type}</td>
                      <td className="p-2 text-center">
                        <span className="font-bold">{stakeholder.total_score}</span>
                        <span className="text-muted-foreground">/30</span>
                      </td>
                      <td className="p-2 text-center">
                        <Badge 
                          variant={
                            stakeholder.influence_category === 'High' ? 'default' :
                            stakeholder.influence_category === 'Medium' ? 'secondary' : 'outline'
                          }
                        >
                          {stakeholder.influence_category}
                        </Badge>
                      </td>
                      <td className="p-2 text-center">
                        {stakeholder.is_priority ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Priority
                          </Badge>
                        ) : (
                          <Badge variant="outline">Standard</Badge>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {stakeholder.population_size.toLocaleString()}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(stakeholder)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(stakeholder)}
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

      {/* Stakeholder Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Stakeholder Reference Guide
          </CardTitle>
          <CardDescription>
            Common stakeholder types and their characteristics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'Employees',
                category: 'Internal',
                description: 'Current workforce including management, staff, and contractors'
              },
              {
                name: 'Customers',
                category: 'External',
                description: 'End users of products/services, including B2B and B2C segments'
              },
              {
                name: 'Investors',
                category: 'External',
                description: 'Shareholders, institutional investors, and financial stakeholders'
              },
              {
                name: 'Suppliers',
                category: 'External',
                description: 'Vendors, contractors, and supply chain partners'
              },
              {
                name: 'Local Community',
                category: 'External',
                description: 'Communities where operations are located or impacted'
              },
              {
                name: 'Government',
                category: 'External',
                description: 'Regulatory bodies, local authorities, and policy makers'
              }
            ].map((stakeholder, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{stakeholder.name}</h4>
                  <Badge variant={stakeholder.category === 'Internal' ? 'default' : 'secondary'}>
                    {stakeholder.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {stakeholder.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}