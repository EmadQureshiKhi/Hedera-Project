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

export function SemaClientSelector() {
  const { clients, activeClient, setActiveClient } = useSema();
  const { setActiveSemaModule, setOpenAdminClientForm } = useSema();
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
    // Find demo client from the clients list
    const demoClient = clients.find(c => c.status === 'demo');
    if (demoClient) {
      setActiveClient(demoClient);
    }
    setIsLoading(false);
  };

  const handleAddNewClient = () => {
    setActiveSemaModule('admin');
    setOpenAdminClientForm(true);
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
        <DropdownMenuItem onClick={handleAddNewClient}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Client
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}