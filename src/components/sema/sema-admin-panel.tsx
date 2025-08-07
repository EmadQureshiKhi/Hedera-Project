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
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { HcsTransactionDisplay } from '@/components/ui/hcs-transaction-display';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Building,
  Users,
  FileText,
  Database
} from 'lucide-react';

// Import your SemaClient type if not already in scope
// import type { SemaClient } from '@/types/sema'; // <-- Uncomment and adjust path if needed

export default function SemaAdminPanel() {
  const { clients, addClient, updateClient, deleteClient, reloadClients, latestClientHcsTx } = useSema();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // FIX: Explicitly type editingClient as SemaClient | null
  const [editingClient, setEditingClient] = useState<any | null>(null); // <-- Replace 'any' with 'SemaClient' if you have the type

  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    size: 'Medium' as 'Small' | 'Medium' | 'Large' | 'Enterprise',
    status: 'active' as 'active' | 'inactive'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      industry: '',
      size: 'Medium',
      status: 'active'
    });
    setEditingClient(null);
    setIsFormOpen(false);
  };

  const handleEdit = (client: any) => {
    setFormData({
      name: client.name,
      description: client.description || '',
      industry: client.industry || '',
      size: client.size,
      status: client.status
    });
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id) {
      toast({
        title: "Authentication Error",
        description: `You must be logged in to create clients. User: ${user ? 'exists but no ID' : 'null'}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (editingClient) {
        // FIX: Use non-null assertion for id
        await updateClient(editingClient!.id, formData);
        toast({
          title: "Client Updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        // Try direct Supabase insertion to debug
        const { data, error } = await supabase
          .from('sema_clients')
          .insert([{
            name: formData.name,
            description: formData.description,
            industry: formData.industry,
            size: formData.size,
            status: formData.status,
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        toast({
          title: "Client Added",
          description: `${formData.name} has been added successfully.`,
        });
        
        // Refresh the clients list
        await reloadClients();
      }
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to save client. Error: ${JSON.stringify(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (client: any) => {
    if (client.status === 'demo') {
      toast({
        title: "Cannot Delete",
        description: "Demo client cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${client.name}?`)) return;

    try {
      await deleteClient(client.id);
      toast({
        title: "Client Deleted",
        description: `${client.name} has been deleted.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Client Management</TabsTrigger>
          <TabsTrigger value="settings">General Settings</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          {/* Add/Edit Form */}
          {isFormOpen && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingClient ? 'Edit Client' : 'Add New Client'}
                </CardTitle>
                <CardDescription>
                  Manage SEMA client organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter organization name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        value={formData.industry}
                        onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                        placeholder="e.g., Technology, Manufacturing"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="size">Organization Size</Label>
                      <Select
                        value={formData.size}
                        onValueChange={(value: 'Small' | 'Medium' | 'Large' | 'Enterprise') => 
                          setFormData(prev => ({ ...prev, size: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Small">Small (1-50 employees)</SelectItem>
                          <SelectItem value="Medium">Medium (51-250 employees)</SelectItem>
                          <SelectItem value="Large">Large (251-1000 employees)</SelectItem>
                          <SelectItem value="Enterprise">Enterprise (1000+ employees)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'active' | 'inactive') => 
                          setFormData(prev => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
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
                      placeholder="Brief description of the organization"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : editingClient ? 'Update Client' : 'Add Client'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Clients List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Client Organizations</CardTitle>
                  <CardDescription>
                    Manage SEMA client organizations and their settings
                  </CardDescription>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    No clients found. Add your first client to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{client.name}</h4>
                          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                            {client.status}
                          </Badge>
                          {client.status === 'demo' && (
                            <Badge variant="outline">Demo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{client.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Industry: {client.industry}</span>
                          <span>Size: {client.size}</span>
                          <span>Created: {new Date(client.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(client)}
                          disabled={client.status === 'demo'}
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

          {/* HCS Transaction Display */}
          <HcsTransactionDisplay 
            transaction={latestClientHcsTx}
            title="Client Management Verification"
            description="Latest client management action logged to Hedera Consensus Service"
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure global SEMA tool settings and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>External Materiality Threshold</Label>
                    <Input type="number" defaultValue="7" min="1" max="10" />
                    <p className="text-xs text-muted-foreground">
                      Topics scoring above this threshold are considered externally material
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Internal Materiality Threshold</Label>
                    <Input type="number" defaultValue="10" min="1" max="25" />
                    <p className="text-xs text-muted-foreground">
                      Topics with significance above this threshold are considered internally material
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Default Confidence Level</Label>
                    <Select defaultValue="0.95">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.90">90%</SelectItem>
                        <SelectItem value="0.95">95%</SelectItem>
                        <SelectItem value="0.99">99%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Default Margin of Error</Label>
                    <Select defaultValue="0.05">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.01">1%</SelectItem>
                        <SelectItem value="0.03">3%</SelectItem>
                        <SelectItem value="0.05">5%</SelectItem>
                        <SelectItem value="0.10">10%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user access and permissions (Coming Soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  User management features will be available in a future update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Templates & Standards
              </CardTitle>
              <CardDescription>
                Manage questionnaire templates and industry standards (Coming Soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Template management features will be available in a future update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}