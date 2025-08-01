'use client';

import React from 'react';
import { Calculator, RefreshCw, RotateCcw } from 'lucide-react';
import { useGHGCalculator } from '../../hooks/useGHGCalculator';
import GHGQuestionnaire from './GHGQuestionnaire';
import GHGCalculatorForm from './GHGCalculatorForm';
import GHGResultsSidebar from './GHGResultsSidebar';
import GHGResults from './GHGResults';
import SuccessNotification from './SuccessNotification';

const GHGCalculator: React.FC = () => {
  const {
    currentStep,
    setCurrentStep,
    questionnaire,
    setQuestionnaire,
    entries,
    currentCalculation,
    setCurrentCalculation,
    customFuel,
    setCustomFuel,
    customEquipment,
    setCustomEquipment,
    customEquipmentTypes,
    errors,
    emissionFactors,
    totalEmissions,
    isDataLoaded,
    showSuccessNotification,
    setShowSuccessNotification,
    lastCalculation,
    highlightResults,
    submitQuestionnaire,
    calculateEmissions,
    deleteEntry,
    deleteAllEntries,
    addCustomFuel,
    deleteCustomFuel,
    addCustomEquipment,
    deleteCustomEquipment,
    getCurrentEmissionFactor,
    goToResults,
    resetToQuestionnaire,
    refreshGHGData
  } = useGHGCalculator();

  console.log('🔄 GHGCalculator render:', {
    currentStep,
    entriesCount: entries.length,
    questionnaireComplete: !!questionnaire.orgName,
    isDataLoaded,
    totalEmissions
  });

  // Show loading state while data is being loaded
  if (!isDataLoaded) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Loading GHG Calculator</h2>
            <p className="text-gray-600">Restoring your saved data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'questionnaire') {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GHG Emissions Calculator</h1>
          <p className="text-gray-600">
            Comprehensive greenhouse gas emissions assessment for your organization
          </p>
        
          {/* Show restore info if we have saved data */}
          {(entries.length > 0 || questionnaire.orgName) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <p className="text-blue-800 text-sm">
                  <strong>Saved data found:</strong> {questionnaire.orgName && `"${questionnaire.orgName}"`} 
                  {entries.length > 0 && ` • ${entries.length} calculations`}
                </p>
              </div>
              {questionnaire.orgName && (
                <button
                  onClick={() => setCurrentStep('calculator')}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Continue with saved data →
                </button>
              )}
            </div>
          )}
        </div>
      
        <GHGQuestionnaire
          questionnaire={questionnaire}
          setQuestionnaire={setQuestionnaire}
          errors={errors}
          onSubmit={submitQuestionnaire}
        />
      </div>
    );
  }

  if (currentStep === 'results') {
    console.log('📊 Rendering results page with:', { 
      questionnaire: questionnaire.orgName, 
      entries: entries.length, 
      totalEmissions 
    });
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <GHGResults
          questionnaire={questionnaire}
          entries={entries}
          totalEmissions={totalEmissions}
          emissionFactors={emissionFactors}
          onBackToCalculator={() => setCurrentStep('calculator')}
          onDeleteEntry={deleteEntry}
        />
      </div>
    );
  }

  // Calculator step
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header with Green Calculator Logo */}
      <div className="mb-6">
        {/* GHG Calculator Header - Smaller Size */}
        <div className="flex items-center space-x-3 mb-6">
          {/* Green Calculator Icon - Smaller */}
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
            <Calculator className="w-7 h-7 text-white" />
          </div>
        
          {/* Title and Subtitle - Smaller */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">GHG Calculator</h1>
            <p className="text-sm text-gray-600">
              Calculate greenhouse gas emissions for your organization
            </p>
          </div>
        </div>

        {/* Data Persistence Status */}
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-green-800 text-sm">
                <strong>Data automatically saved</strong> • All calculations are preserved across sessions
              </p>
            </div>
            <button
              onClick={refreshGHGData}
              className="text-green-600 hover:text-green-700 text-sm flex items-center space-x-1"
              title="Refresh data"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{questionnaire.orgName || 'Organization'}</span> • {entries.length} calculations
            {totalEmissions > 0 && (
              <span className="ml-2 text-green-600 font-medium">
                • {(totalEmissions / 1000).toFixed(2)} tonnes CO₂e
              </span>
            )}
          </div>
        
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentStep('questionnaire')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-2"
            >
              <span>Back to Questionnaire</span>
            </button>
            <button
              onClick={goToResults}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              View All Results ({entries.length})
            </button>
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Assessment Configuration:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Organizational Boundary:</span>
              <p className="font-medium">{questionnaire.boundaryApproach || 'Not set'}</p>
              {questionnaire.controlSubtype && (
                <p className="text-gray-600">→ {questionnaire.controlSubtype}</p>
              )}
            </div>
            <div>
              <span className="text-gray-600">Operational Boundary:</span>
              <p className="font-medium">{questionnaire.operationalBoundary || 'Not set'}</p>
            </div>
            <div>
              <span className="text-gray-600">Emission Sources:</span>
              <p className="font-medium">{questionnaire.emissionSources || 'Not set'}</p>
            </div>
            <div>
              <span className="text-gray-600">Total Calculations:</span>
              <p className="font-medium">{entries.length} activities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calculator Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Form */}
        <div className="lg:col-span-2">
          <GHGCalculatorForm
            currentCalculation={currentCalculation}
            setCurrentCalculation={setCurrentCalculation}
            emissionFactors={emissionFactors}
            customFuel={customFuel}
            setCustomFuel={setCustomFuel}
            customEquipment={customEquipment || { name: '', description: '', category: 'Stationary' }}
            setCustomEquipment={setCustomEquipment || (() => {})}
            customEquipmentTypes={customEquipmentTypes || {}}
            errors={errors}
            onCalculate={calculateEmissions}
            onAddCustomFuel={addCustomFuel}
            onDeleteCustomFuel={deleteCustomFuel}
            onAddCustomEquipment={addCustomEquipment || (() => {})}
            onDeleteCustomEquipment={deleteCustomEquipment || (() => {})}
            getCurrentEmissionFactor={getCurrentEmissionFactor}
            questionnaireScope={questionnaire.emissionSources}
          />
        </div>

        {/* Results Sidebar */}
        <div>
          <GHGResultsSidebar
            entries={entries}
            totalEmissions={totalEmissions}
            onDeleteEntry={deleteEntry}
            onDeleteAll={deleteAllEntries}
            highlightResults={highlightResults}
            lastEntryId={entries.length > 0 ? entries[entries.length - 1].id : undefined}
          />
        </div>
      </div>

      {/* Success Notification */}
      <SuccessNotification
        isVisible={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        emissionAmount={lastCalculation?.emissionAmount || 0}
        fuelType={lastCalculation?.fuelType || ''}
        totalEmissions={totalEmissions}
        scope={lastCalculation?.scope || ''}
      />

      {/* Reset Option - Positioned at the bottom */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-900 mb-1">Reset Calculator</h4>
              <p className="text-sm text-red-700">
                Clear all data and return to the questionnaire. This will remove all calculations and settings.
              </p>
            </div>
            <button
              onClick={resetToQuestionnaire}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset All</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GHGCalculator;