'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from './file-upload';
import { DataPreview } from './data-preview';
import { EmissionsCalculator } from './emissions-calculator';
import { CertificatePreview } from './certificate-preview';
import { 
  Upload, 
  FileText, 
  Calculator, 
  Award,
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

type Step = 'upload' | 'preview' | 'calculate' | 'certificate';

interface UploadData {
  file?: File;
  data?: any[];
  calculations?: {
    totalEmissions: number;
    breakdown: Record<string, number>;
  };
  certificate?: {
    id: string;
    hash: string;
  };
}

export function UploadWizard() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [uploadData, setUploadData] = useState<UploadData>({});

  const steps = [
    { id: 'upload', title: 'Upload File', icon: Upload },
    { id: 'preview', title: 'Preview Data', icon: FileText },
    { id: 'calculate', title: 'Calculate Emissions', icon: Calculator },
    { id: 'certificate', title: 'Generate Certificate', icon: Award },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id as Step);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id as Step);
    }
  };

  const handleFileUpload = (file: File, data: any[]) => {
    setUploadData(prev => ({ ...prev, file, data }));
    handleNext();
  };

  const handleCalculations = (calculations: any) => {
    setUploadData(prev => ({ ...prev, calculations }));
    handleNext();
  };

  const handleCertificateGeneration = (certificate: any) => {
    setUploadData(prev => ({ ...prev, certificate }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Upload Emissions Data</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload your emissions data, calculate your carbon footprint, and generate a verifiable certificate
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                
                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center space-y-2 ${
                      isActive ? 'text-primary' : 
                      isCompleted ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      isActive ? 'border-primary bg-primary/10' :
                      isCompleted ? 'border-green-600 bg-green-600/10' : 'border-muted'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-center">
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-[500px]">
        {currentStep === 'upload' && (
          <FileUpload onUpload={handleFileUpload} />
        )}
        
        {currentStep === 'preview' && uploadData.data && (
          <DataPreview 
            data={uploadData.data} 
            fileName={uploadData.file?.name}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )}
        
        {currentStep === 'calculate' && uploadData.data && (
          <EmissionsCalculator 
            data={uploadData.data}
            onCalculate={handleCalculations}
            onPrevious={handlePrevious}
          />
        )}
        
        {currentStep === 'certificate' && uploadData.calculations && (
          <CertificatePreview 
            calculations={uploadData.calculations}
            onGenerate={handleCertificateGeneration}
            onPrevious={handlePrevious}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {currentStep !== 'certificate' && (
          <Button
            onClick={handleNext}
            disabled={
              (currentStep === 'upload' && !uploadData.data) ||
              (currentStep === 'calculate' && !uploadData.calculations)
            }
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}