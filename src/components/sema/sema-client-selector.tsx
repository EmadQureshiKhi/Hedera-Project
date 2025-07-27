'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSema } from './sema-context';
import { ChevronDown, Building, Plus } from 'lucide-react';

const DEMO_CLIENT = {
  id: 'demo-client',
  user_id: 'demo-user',
  name: 'Demo Organization',
  description: 'Complete SEMA demonstration with sample data',
  industry: 'Technology',
  size: 'Medium',
  status: 'demo' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function SemaClientSelector() {
  const { clients, activeClient, setActiveClient } = useSema();
  const [isLoading, setIsLoading] = useState(false);

  const handleClientChange = async (client: any) => {
    setIsLoading(true);
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 500));
    setActiveClient(client);
    setIsLoading(false);
  };

  const handleDemoMode = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setActiveClient(DEMO_CLIENT);
    setIsLoading(false);
  };

  if (!activeClient) {
    return (
      <div className="flex items-center gap-2">
        <Building className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No client selected</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">{activeClient.name}</div>
            <div className="text-xs text-muted-foreground">
              {activeClient.status === 'demo' ? 'Demo Mode' : activeClient.industry}
            </div>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">Select Client</p>
        </div>
        <DropdownMenuSeparator />
        
        {clients.map((client) => (
          <DropdownMenuItem
            key={client.id}
            onClick={() => handleClientChange(client)}
            className="flex items-center justify-between"
          >
            <div>
              <div className="font-medium">{client.name}</div>
              <div className="text-xs text-muted-foreground">
                {client.industry} • {client.size}
              </div>
            </div>
            {client.status === 'demo' && (
              <Badge variant="secondary" className="text-xs">Demo</Badge>
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDemoMode}>
          <div className="flex items-center justify-between w-full">
            <div>
              <div className="font-medium">Demo Mode</div>
              <div className="text-xs text-muted-foreground">
                Complete SEMA showcase
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
              Demo
            </Badge>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Plus className="h-4 w-4 mr-2" />
          Add New Client
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}