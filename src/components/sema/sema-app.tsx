'use client';

import { useState, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SemaClientSelector } from './sema-client-selector';
import { SemaProvider, SemaModule } from './sema-context';
import { 
  BarChart3, 
  Users, 
  Calculator, 
  MessageSquare, 
  Target, 
  Grid3X3, 
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy load components for better performance
const SemaDashboard = lazy(() => import('./sema-dashboard'));
const StakeholderManagement = lazy(() => import('./stakeholder-management'));
const SampleSizeCalculator = lazy(() => import('./sample-size-calculator'));
const QuestionnaireEngine = lazy(() => import('./questionnaire-engine'));
const InternalAssessment = lazy(() => import('./internal-assessment'));
const MaterialityMatrix = lazy(() => import('./materiality-matrix'));
const ReportingDashboard = lazy(() => import('./reporting-dashboard'));
const SemaAdminPanel = lazy(() => import('./sema-admin-panel'));

import { lazy } from 'react';

const modules = [
  {
    id: 'dashboard' as SemaModule,
    name: 'Dashboard',
    icon: BarChart3,
    description: 'Overview of SEMA process',
  },
  {
    id: 'stakeholders' as SemaModule,
    name: 'Stakeholder Management',
    icon: Users,
    description: 'Identify and prioritize stakeholders',
  },
  {
    id: 'sample-size' as SemaModule,
    name: 'Sample Size Calculator',
    icon: Calculator,
    description: 'Calculate engagement sample sizes',
  },
  {
    id: 'questionnaire' as SemaModule,
    name: 'Questionnaire Engine',
    icon: MessageSquare,
    description: 'External materiality assessment',
  },
  {
    id: 'internal-assessment' as SemaModule,
    name: 'Internal Assessment',
    icon: Target,
    description: 'Internal impact evaluation',
  },
  {
    id: 'materiality-matrix' as SemaModule,
    name: 'Materiality Matrix',
    icon: Grid3X3,
    description: 'Visualize material topics',
  },
  {
    id: 'reporting' as SemaModule,
    name: 'Reporting Dashboard',
    icon: FileText,
    description: 'Generate GRI reports',
  },
  {
    id: 'admin' as SemaModule,
    name: 'Admin Panel',
    icon: Settings,
    description: 'Manage clients and settings',
  },
];

export function SemaApp() {
  const [activeModule, setActiveModule] = useState<SemaModule>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openAdminClientForm, setOpenAdminClientForm] = useState(false);

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <SemaDashboard />;
      case 'stakeholders':
        return <StakeholderManagement />;
      case 'sample-size':
        return <SampleSizeCalculator />;
      case 'questionnaire':
        return <QuestionnaireEngine />;
      case 'internal-assessment':
        return <InternalAssessment />;
      case 'materiality-matrix':
        return <MaterialityMatrix />;
      case 'reporting':
        return <ReportingDashboard />;
      case 'admin':
        return <SemaAdminPanel 
          isOpenClientForm={openAdminClientForm}
          setIsOpenClientForm={setOpenAdminClientForm}
        />;
      default:
        return <SemaDashboard />;
    }
  };

  const activeModuleData = modules.find(m => m.id === activeModule);

  return (
    <SemaProvider
      setActiveSemaModule={setActiveModule}
      setOpenAdminClientForm={setOpenAdminClientForm}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">SEMA Automation Tool</h1>
                  <p className="text-sm text-muted-foreground">
                    Stakeholder Engagement & Materiality Assessment • Hedera Verified
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <SemaClientSelector />
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className={cn(
            "sticky top-[73px] h-[calc(100vh-73px)] bg-white dark:bg-gray-900 border-r transition-all duration-300 overflow-y-auto",
            sidebarCollapsed ? "w-16" : "w-80"
          )}>
            <div className="p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-full justify-start mb-4"
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
              </Button>

              <div className="space-y-2">
                {modules.map((module) => {
                  const Icon = module.icon;
                  const isActive = activeModule === module.id;
                  
                  return (
                    <Button
                      key={module.id}
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start h-auto p-3",
                        sidebarCollapsed ? "px-3 justify-center h-14" : "px-4"
                      )}
                      onClick={() => setActiveModule(module.id)}
                    >
                      <Icon className={cn(
                        "flex-shrink-0",
                        sidebarCollapsed ? "h-10 w-10" : "h-5 w-5 mr-3"
                      )} />
                      {!sidebarCollapsed && (
                        <div className="text-left">
                          <div className="font-medium">{module.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {module.description}
                          </div>
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                {activeModuleData && (
                  <>
                    <activeModuleData.icon className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">{activeModuleData.name}</h2>
                  </>
                )}
              </div>
              <p className="text-muted-foreground">
                {activeModuleData?.description}
              </p>
            </div>

            <Suspense fallback={
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </CardContent>
              </Card>
            }>
              {renderActiveModule()}
            </Suspense>
          </div>
        </div>
      </div>
    </SemaProvider>
  );
}