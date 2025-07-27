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
  Info,
  Building,
  Heart,
  ShoppingCart,
  MapPin,
  Truck,
  Shield
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
      <div className="space-y-8">
        {/* Blue Gradient Header Container */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent"></div>
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
            <div className="h-full w-full bg-gradient-to-l from-white/20 to-transparent"></div>
          </div>
          
          <div className="relative z-10 text-center space-y-6">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-3xl font-bold">Stakeholder Group Reference</h2>
                <p className="text-blue-100 text-lg">12 Key Stakeholder Categories</p>
              </div>
            </div>
            
            <p className="text-xl text-blue-50 max-w-4xl mx-auto leading-relaxed">
              Understanding the different stakeholder groups and their importance in the materiality assessment 
              process. Each group plays a unique role in influencing and being affected by organizational decisions.
            </p>
            
            <div className="flex justify-center gap-8 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-blue-100 font-medium">Comprehensive Coverage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100 font-medium">GRI Framework Aligned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-300 rounded-full"></div>
                <span className="text-blue-100 font-medium">Industry Best Practices</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stakeholder Cards Grid */}
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                id: '#01',
                name: 'Employees',
                subtitle: 'Shareholders and other Investors',
                category: 'Internal',
                description: 'As partial owners, they provide guidance and decisions around all key dimensions of an organization\'s activities, including ESG. Their interests and concerns are of paramount importance since they can influence business decisions, strategic direction, funding, and investment, and demand accountability from organizational stakeholders.',
                color: 'blue',
                icon: Users
              },
              {
                id: '#02',
                name: 'Business Partners',
                subtitle: 'Business Partners',
                category: 'External',
                description: 'These are entities with which the organization has some level of direct and formal engagement for the purpose of meeting its business objectives, and may include lenders, insurers, industry associations, networks & memberships, B2B customers, or JV partners.',
                color: 'green',
                icon: Building
              },
              {
                id: '#03',
                name: 'Civil Society Organizations',
                subtitle: 'Civil Society Organizations',
                category: 'External',
                description: 'They are key partners in an CSR initiatives and may have a role in deciding the funds allocations and project implementation; they also impact overall brand image as they influence other stakeholders through media, publications, lobbying, etc. Includes media, intergovernmental organizations, multilateral organizations.',
                color: 'purple',
                icon: Heart
              },
              {
                id: '#04',
                name: 'Customers',
                subtitle: 'Consumers',
                category: 'External',
                description: 'Consumers are ultimate users of a product/service even if the company is not directly selling to them. They are becoming increasingly important in informing business decisions and reputational standing.',
                color: 'orange',
                icon: ShoppingCart
              },
              {
                id: '#05',
                name: 'Customers',
                subtitle: 'Customers',
                category: 'External',
                description: 'Customers play one of the most integral roles in impacting strategic decisions, branding, and investment/funds allocation.',
                color: 'teal',
                icon: Users
              },
              {
                id: '#06',
                name: 'Employees and other Workers',
                subtitle: 'Employees and other Workers',
                category: 'Internal',
                description: 'Employees and workers are an indispensable form of human and social capital within an organization, and their rights and preferences influence policy-making to a significant degree.',
                color: 'blue',
                icon: Users
              },
              {
                id: '#07',
                name: 'Government and/or Regulators',
                subtitle: 'Government and/or Regulators',
                category: 'External',
                description: 'Governmental stakeholders play a crucial role in maintaining the legal architecture to ensure an overall level playing field, and policies that are conducive to a thriving and competitive market.',
                color: 'red',
                icon: Building
              },
              {
                id: '#08',
                name: 'Local Communities',
                subtitle: 'Local Communities',
                category: 'External',
                description: 'Local communities provide a crucial contribution to the labor force and towards ensuring uninterrupted plant operations. These also include the communities and regions that might be impacted by company operations and activities due to proximity, and their wellbeing and input need to be taken into account for this reason.',
                color: 'yellow',
                icon: MapPin
              },
              {
                id: '#09',
                name: 'NGOs',
                subtitle: 'NGOs',
                category: 'External',
                description: 'A crucial implementing arm for an organization\'s CSR and community-engagement activities.',
                color: 'pink',
                icon: Heart
              },
              {
                id: '#10',
                name: 'Suppliers',
                subtitle: 'Suppliers',
                category: 'External',
                description: 'As critical components of the value chain, suppliers and fluctuations in their operations might critically impact business decisions and outputs.',
                color: 'cyan',
                icon: Truck
              },
              {
                id: '#11',
                name: 'Trade Unions',
                subtitle: 'Trade Unions',
                category: 'External',
                description: 'Any trade union represents worker interests, and they have substantial influence on the company as they negotiate collective bargaining agreements and can determine worker protection and barriers to hiring new workers.',
                color: 'amber',
                icon: Users
              },
              {
                id: '#12',
                name: 'Vulnerable Groups',
                subtitle: 'Vulnerable Groups',
                category: 'External',
                description: 'This covers any group of individuals that could potentially experience negative impacts as a result of the organization\'s activities more severely than the general population. It is vital to understand how the company\'s operations or value chains impacts different vulnerable groups if it is to work on mitigating those impacts.',
                color: 'red',
                icon: Shield
              }
            ].map((stakeholder, index) => {
              const Icon = stakeholder.icon;
              
              const iconColorClasses = {
                blue: 'bg-blue-600 text-white',
                green: 'bg-green-600 text-white',
                purple: 'bg-purple-600 text-white',
                orange: 'bg-orange-600 text-white',
                teal: 'bg-teal-600 text-white',
                red: 'bg-red-600 text-white',
                yellow: 'bg-yellow-600 text-white',
                pink: 'bg-pink-600 text-white',
                cyan: 'bg-cyan-600 text-white',
                amber: 'bg-amber-600 text-white'
              };

              return (
                <div key={index} className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 relative overflow-hidden">
                  {/* Colored bottom border */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                    stakeholder.color === 'blue' ? 'bg-blue-500' :
                    stakeholder.color === 'green' ? 'bg-green-500' :
                    stakeholder.color === 'purple' ? 'bg-purple-500' :
                    stakeholder.color === 'orange' ? 'bg-orange-500' :
                    stakeholder.color === 'teal' ? 'bg-teal-500' :
                    stakeholder.color === 'red' ? 'bg-red-500' :
                    stakeholder.color === 'yellow' ? 'bg-yellow-500' :
                    stakeholder.color === 'pink' ? 'bg-pink-500' :
                    stakeholder.color === 'cyan' ? 'bg-cyan-500' :
                    'bg-amber-500'
                  }`}></div>
                  
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColorClasses[stakeholder.color]}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-500">{stakeholder.id}</span>
                        <Badge variant={stakeholder.category === 'Internal' ? 'default' : 'secondary'} className="text-xs">
                          {stakeholder.category}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">{stakeholder.name}</h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {stakeholder.description}
                  </p>
                </div>
              );
            })}
          </div>
          
          {/* How to Use This Reference - Clean Design */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">How to Use This Reference</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  When adding stakeholders to your assessment, refer to these descriptions to ensure you're capturing the right groups and understanding their unique characteristics. Each stakeholder group has different levels of influence and dependency on your organization's activities, which should be reflected in your scoring during the stakeholder management process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}