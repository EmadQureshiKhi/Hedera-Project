'use client';

import React, { useState } from 'react';
import { ArrowLeft, Download, Calculator, Leaf, FileSpreadsheet, Archive, Trash2, Award } from 'lucide-react';
import { EmissionEntry, QuestionnaireData } from '../../types/ghg';
import { exportToExcel, ExportData } from '../../utils/excelExport';
import { GHGCertificatePreview } from './GHGCertificatePreview';

interface GHGResultsProps {
  questionnaire: QuestionnaireData;
  entries: EmissionEntry[];
  totalEmissions: number;
  emissionFactors: any;
  customEquipmentTypes?: any;
  onBackToCalculator: () => void;
  onDeleteEntry?: (entryId: string) => void;
}

const GHGResults: React.FC<GHGResultsProps> = ({
  questionnaire,
  entries,
  totalEmissions,
  emissionFactors,
  customEquipmentTypes = {},
  onBackToCalculator,
  onDeleteEntry
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
  const [showCertificatePreview, setShowCertificatePreview] = useState(false);
  const [generatedCertificate, setGeneratedCertificate] = useState<any>(null);

  console.log('GHGResults rendered with:', { questionnaire, entries: entries.length, totalEmissions });

  // If showing certificate preview, render that instead
  if (showCertificatePreview) {
    // Create calculations object for certificate preview
    const calculations = {
      totalEmissions,
      categoryBreakdown: entries.reduce((acc, entry) => {
        const category = entry.category || 'Other';
        acc[category] = (acc[category] || 0) + entry.emissions;
        return acc;
      }, {} as Record<string, number>),
      breakdown: entries.reduce((acc, entry) => {
        const key = `${entry.scope} - ${entry.fuelType}`;
        acc[key] = (acc[key] || 0) + entry.emissions;
        return acc;
      }, {} as Record<string, number>),
      summary: {
        processedRows: entries.length,
        totalRows: entries.length,
        categories: Object.keys(entries.reduce((acc, entry) => {
          acc[entry.category || 'Other'] = true;
          return acc;
        }, {} as Record<string, boolean>)).length
      },
      processedData: entries
    };

    return (
      <div className="max-w-6xl mx-auto">
        <GHGCertificatePreview
          questionnaire={questionnaire}
          entries={entries}
          totalEmissions={totalEmissions}
          calculations={calculations}
          onGenerate={(certificate) => {
            setGeneratedCertificate(certificate);
            // Stay on certificate preview to show success
          }}
          onPrevious={() => setShowCertificatePreview(false)}
        />
      </div>
    );
  }

  // Calculate emissions by scope
  const scope1Emissions = entries.filter(e => e.scope === 'Scope 1').reduce((sum, e) => sum + e.emissions, 0);
  const scope2Emissions = entries.filter(e => e.scope === 'Scope 2').reduce((sum, e) => sum + e.emissions, 0);

  const handleExport = async () => {
    setIsExporting(true);
  
    try {
      const exportData: ExportData = {
        questionnaire,
        entries,
        emissionFactors,
        totalEmissions
      };
    
      await exportToExcel(exportData, exportFormat, customEquipmentTypes);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Calculation Results</h2>
            <p className="text-gray-600">{questionnaire.orgName || 'Organization'} • {entries.length} calculations</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onBackToCalculator}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Calculator</span>
            </button>
          
            {/* Export Format Selection */}
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'excel' | 'csv')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="csv">CSV Files (.zip)</option>
            </select>
          
            <button 
              onClick={handleExport}
              disabled={isExporting || entries.length === 0}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  {exportFormat === 'excel' ? <FileSpreadsheet className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  <span>Export Report</span>
                </>
              )}
            </button>

            <button 
              onClick={() => setShowCertificatePreview(true)}
              disabled={entries.length === 0}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Award className="w-4 h-4" />
              <span>Generate Certificate</span>
            </button>
          </div>
        </div>

        {/* Export Information */}
        {entries.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Available Actions:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
              <div>
                <strong>Export Report:</strong> Download Excel/CSV with all calculation data
              </div>
              <div>
                <strong>Generate Certificate:</strong> Create blockchain-verified certificate on Hedera
              </div>
              {Object.values(emissionFactors)
                .filter(scope => typeof scope === 'object' && scope !== null)
                .some(scope =>
                  Object.values(scope)
                    .filter(category => typeof category === 'object' && category !== null)
                    .some(category =>
                      Object.values(category)
                        .filter(fuel => typeof fuel === 'object' && fuel !== null)
                        .some(fuel => (fuel as any).custom)
                    )
                ) && (
                <div>
                  <strong>Custom Fuels Sheet:</strong> User-defined emission factors
                </div>
              )}
              <div>
                <strong>Certificate Features:</strong> NFT minting, HCS logging, IPFS metadata
              </div>
              <div>
                <strong>Verification:</strong> HashScan links for on-chain proof
              </div>
            </div>
          </div>
        )}

        {/* Green Banner with Plant Logo */}
        <div className="relative bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 rounded-xl p-8 text-white overflow-hidden mb-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-6 right-20 w-20 h-20 border-2 border-white rounded-full"></div>
            <div className="absolute top-12 right-32 w-12 h-12 border border-white rounded-full"></div>
            <div className="absolute bottom-8 right-24 w-6 h-6 bg-white rounded-full"></div>
            <div className="absolute top-16 right-8 w-8 h-8 border border-white rounded-full"></div>
            <div className="absolute bottom-12 right-40 w-4 h-4 bg-white rounded-full"></div>
          </div>
        
          {/* Plant/Leaf Icon */}
          <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white border-opacity-30">
              <Leaf className="w-10 h-10 text-white" />
            </div>
          </div>
        
          {/* Content */}
          <div className="relative z-10 grid grid-cols-3 gap-8">
            {/* Scope 1 Emissions */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-white">Scope 1 Emissions</h3>
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-4xl font-bold">{(scope1Emissions / 1000).toFixed(2)}</span>
                <span className="text-lg font-medium">tonnes</span>
              </div>
              <p className="text-green-100 text-sm">direct emissions</p>
            </div>

            {/* Scope 2 Emissions */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-white">Scope 2 Emissions</h3>
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-4xl font-bold">{(scope2Emissions / 1000).toFixed(2)}</span>
                <span className="text-lg font-medium">tonnes</span>
              </div>
              <p className="text-green-100 text-sm">indirect emissions</p>
            </div>

            {/* Total CO2 Equivalent */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-white">Total CO₂ Equivalent</h3>
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-4xl font-bold">{(totalEmissions / 1000).toFixed(2)}</span>
                <span className="text-lg font-medium">tonnes</span>
              </div>
              <p className="text-green-100 text-sm">{entries.length} activities</p>
            </div>
          </div>
          {Object.values(customEquipmentTypes)
            .filter(category => typeof category === 'object' && category !== null)
            .some(category =>
              Object.values(category)
                .filter(equipment => typeof equipment === 'object' && equipment !== null)
                .some(equipment => equipment.custom)
            ) && (
            <div>
              <strong>Custom Equipment Sheet:</strong> User-defined equipment types
            </div>
          )}
        </div>
      </div>

      {/* Detailed Results */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Detailed Calculations</h3>
        </div>
      
        {entries.length === 0 ? (
          <div className="p-12 text-center">
            <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No calculations available</h4>
            <p className="text-gray-600">Go back to the calculator to add emission calculations</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Scope</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Category & Equipment</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Fuel Type</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Emission Factor</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Total Emissions</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Date</th>
                  {onDeleteEntry && (
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 group">
                    <td className="p-4 font-medium text-gray-900">{entry.scope}</td>
                    <td className="p-4 text-gray-600">
                      <div>
                        <div className="font-medium">{entry.category}</div>
                        {entry.equipmentType && (
                          <div className="text-xs text-gray-500">{entry.equipmentType}</div>
                        )}
                        <div className="text-xs text-blue-600">{entry.fuelCategory}</div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-900">{entry.fuelType}</td>
                    <td className="p-4 text-gray-600">{entry.amount} {entry.unit_type}</td>
                    <td className="p-4 text-gray-600">{entry.convertedFactor.toFixed(6)} kg CO2e/{entry.unit_type}</td>
                    <td className="p-4 font-medium text-gray-900">{entry.emissions.toFixed(2)} kg CO2e</td>
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </td>
                    {onDeleteEntry && (
                      <td className="p-4">
                        <button
                          onClick={() => onDeleteEntry(entry.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete this entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Emissions by Scope Breakdown */}
      {entries.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Emissions Breakdown by Scope</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scope 1 */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Scope 1 (Direct Emissions)</h4>
              <p className="text-2xl font-bold text-gray-900 mb-1">{scope1Emissions.toFixed(2)} kg CO2e</p>
              <p className="text-sm text-gray-600 mb-2">
                {entries.filter(e => e.scope === 'Scope 1').length} activities
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${totalEmissions > 0 ? (scope1Emissions / totalEmissions) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {totalEmissions > 0 ? ((scope1Emissions / totalEmissions) * 100).toFixed(1) : 0}% of total
              </p>
            </div>

            {/* Scope 2 */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Scope 2 (Indirect Emissions)</h4>
              <p className="text-2xl font-bold text-gray-900 mb-1">{scope2Emissions.toFixed(2)} kg CO2e</p>
              <p className="text-sm text-gray-600 mb-2">
                {entries.filter(e => e.scope === 'Scope 2').length} activities
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${totalEmissions > 0 ? (scope2Emissions / totalEmissions) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {totalEmissions > 0 ? ((scope2Emissions / totalEmissions) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GHGResults;