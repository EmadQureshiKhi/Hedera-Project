'use client';

import React from 'react';
import { Lightbulb, Leaf, Trash2, X } from 'lucide-react';
import { EmissionEntry } from '../../types/ghg';
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

interface GHGResultsSidebarProps {
  entries: EmissionEntry[];
  totalEmissions: number;
  onDeleteEntry?: (entryId: string) => void;
  onDeleteAll?: () => void;
  highlightResults?: boolean;
  lastEntryId?: string;
}

const GHGResultsSidebar: React.FC<GHGResultsSidebarProps> = ({
  entries,
  totalEmissions,
  onDeleteEntry,
  onDeleteAll,
  highlightResults = false,
  lastEntryId
}) => {
  return (
    <div className="space-y-6">
      {/* Current Session Results */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Current Session
          </h3>
        
          {/* Delete All Button */}
          {entries.length > 0 && onDeleteAll && (
            <button
              onClick={onDeleteAll}
              className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              title="Delete all entries"
            >
              <X className="w-4 h-4" />
              <span>Delete All</span>
            </button>
          )}
        </div>
      
        {entries.length === 0 ? (
          <p className="text-gray-600 text-sm">No calculations yet</p>
        ) : (
          <div className="space-y-3">
            {entries.slice(-5).map(entry => (
              <motion.div 
                key={entry.id} 
                initial={entry.id === lastEntryId ? { scale: 0.8, opacity: 0 } : false}
                animate={entry.id === lastEntryId ? { scale: 1, opacity: 1 } : {}}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`p-3 rounded-lg group hover:bg-gray-100 transition-all duration-300 ${
                  entry.id === lastEntryId 
                    ? 'bg-green-50 border-2 border-green-200 shadow-md' 
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{entry.fuelType}</p>
                    <p className="text-sm text-gray-600">
                      {entry.scope} • {entry.category}
                      {entry.equipmentType && ` • ${entry.equipmentType}`}
                    </p>
                    <p className="text-sm text-gray-900">
                      {entry.amount} {entry.unit_type} = <span className="font-medium">
                        {entry.id === lastEntryId ? (
                          <AnimatedCounter 
                            value={entry.emissions} 
                            decimals={2} 
                            suffix=" kg CO2e"
                            className="text-green-700"
                          />
                        ) : (
                          `${entry.emissions.toFixed(2)} kg CO2e`
                        )}
                      </span>
                    </p>
                  </div>
                
                  {/* Delete Button */}
                  {onDeleteEntry && (
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="ml-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete this entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            {entries.length > 5 && (
              <p className="text-xs text-gray-500 text-center">
                Showing last 5 calculations
              </p>
            )}
          </div>
        )}
      </div>

      {/* Total Summary - New Design */}
      <motion.div 
        className={`relative bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 rounded-xl p-6 text-white overflow-hidden transition-all duration-500 ${
          highlightResults 
            ? 'ring-4 ring-green-300 ring-opacity-75 shadow-2xl scale-105' 
            : 'shadow-lg'
        }`}
        animate={highlightResults ? { 
          boxShadow: [
            "0 10px 25px rgba(0,0,0,0.1)",
            "0 20px 40px rgba(34, 197, 94, 0.3)",
            "0 10px 25px rgba(0,0,0,0.1)"
          ]
        } : {}}
        transition={{ duration: 2, ease: "easeInOut" }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white rounded-full"></div>
          <div className="absolute top-8 right-8 w-8 h-8 border border-white rounded-full"></div>
          <div className="absolute bottom-6 right-12 w-4 h-4 bg-white rounded-full"></div>
        </div>
      
        {/* Leaf Icon */}
        <div className="absolute top-1/2 right-6 transform -translate-y-1/2">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Leaf className="w-8 h-8 text-white" />
          </div>
        </div>
      
        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-2 text-white">Total CO₂ Equivalent</h3>
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-3xl font-bold">
              <AnimatedCounter 
                value={totalEmissions / 1000} 
                decimals={2}
              />
            </span>
            <span className="text-lg font-medium">tonnes</span>
          </div>
          <p className="text-green-100 text-sm">{entries.length} activities calculated</p>
        </div>
      </motion.div>

      {/* Quick Tips */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-blue-900">Quick Tips</h3>
        </div>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Use consistent units for accurate calculations</li>
          <li>• Add custom fuel types for specific materials</li>
          <li>• Calculate all emission sources for comprehensive assessment</li>
          <li>• Review results before generating final report</li>
          <li>• Hover over entries to reveal delete option</li>
        </ul>
      </div>
    </div>
  );
};

export default GHGResultsSidebar;