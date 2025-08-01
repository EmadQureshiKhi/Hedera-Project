'use client';

import React from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { QuestionnaireData } from '../../types/ghg';

interface GHGQuestionnaireProps {
  questionnaire: QuestionnaireData;
  setQuestionnaire: React.Dispatch<React.SetStateAction<QuestionnaireData>>;
  errors: string[];
  onSubmit: () => void;
}

const GHGQuestionnaire: React.FC<GHGQuestionnaireProps> = ({
  questionnaire,
  setQuestionnaire,
  errors,
  onSubmit
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 border-b-2 border-blue-500 pb-2">
            GHG Assessment Questionnaire
          </h2>
          <p className="text-gray-600">Please provide your organization details and assessment scope</p>
        </div>

        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-medium text-red-800">Please fix the following errors:</h3>
            </div>
            <ul className="list-disc list-inside text-red-700 text-sm">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-6">
          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name *</label>
            <input
              type="text"
              value={questionnaire.orgName}
              onChange={(e) => setQuestionnaire(prev => ({ ...prev, orgName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your organization name"
            />
          </div>

          {/* Organizational Boundary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Define Organizational Boundary *</label>
            <select
              value={questionnaire.boundaryApproach}
              onChange={(e) => setQuestionnaire(prev => ({ ...prev, boundaryApproach: e.target.value, controlSubtype: '' }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select boundary approach</option>
              <option value="Control Approach">Control Approach</option>
              <option value="Equity Share Approach">Equity Share Approach</option>
            </select>
          </div>

          {/* Control Approach Sub-options */}
          {questionnaire.boundaryApproach === 'Control Approach' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Control Approach Type *</label>
              <select
                value={questionnaire.controlSubtype}
                onChange={(e) => setQuestionnaire(prev => ({ ...prev, controlSubtype: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select control type</option>
                <option value="Operational">Operational</option>
                <option value="Financial">Financial</option>
              </select>
            </div>
          )}

          {/* Operational Boundary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Define Operational Boundary *</label>
            <select
              value={questionnaire.operationalBoundary}
              onChange={(e) => setQuestionnaire(prev => ({ ...prev, operationalBoundary: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select operational boundary</option>
              <option value="Facility-level">Facility-level</option>
              <option value="Corporate-level">Corporate-level</option>
              <option value="Product-level">Product-level</option>
            </select>
          </div>

          {/* Emission Sources - Removed "Both Scope 1 & 2" option */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">What are your emission sources? *</label>
            <select
              value={questionnaire.emissionSources}
              onChange={(e) => setQuestionnaire(prev => ({ ...prev, emissionSources: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select emission sources</option>
              <option value="Scope 1 (direct emissions)">Scope 1 (direct emissions)</option>
              <option value="Scope 2 (indirect emissions)">Scope 2 (indirect emissions)</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={onSubmit}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
          >
            <span>Continue to Calculator</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GHGQuestionnaire;