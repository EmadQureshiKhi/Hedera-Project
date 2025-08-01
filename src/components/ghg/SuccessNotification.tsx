'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, X, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuccessNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  emissionAmount: number;
  fuelType: string;
  totalEmissions: number;
  scope: string;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  isVisible,
  onClose,
  emissionAmount,
  fuelType,
  totalEmissions,
  scope
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (isVisible) {
      setProgress(100);
      const duration = 3000; // 3 seconds
      const interval = 50; // Update every 50ms
      const decrement = (interval / duration) * 100;

      const timer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - decrement;
          if (newProgress <= 0) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return newProgress;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ 
            opacity: 0, 
            x: 100, 
            scale: 0.8,
            rotateY: 90 
          }}
          animate={{ 
            opacity: 1, 
            x: 0, 
            scale: 1,
            rotateY: 0 
          }}
          exit={{ 
            opacity: 0, 
            x: 100, 
            scale: 0.8,
            rotateY: -90 
          }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 25,
            duration: 0.6 
          }}
          className="fixed top-6 right-6 z-50 max-w-sm w-full md:max-w-md"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                initial={{ width: "100%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>

            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                    className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <CheckCircle className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="font-bold text-gray-900 text-sm"
                    >
                      Emission Added Successfully!
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-xs text-gray-600"
                    >
                      {scope} calculation completed
                    </motion.p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        +{emissionAmount.toFixed(2)} kg CO₂e
                      </p>
                      <p className="text-xs text-green-700 truncate">
                        {fuelType}
                      </p>
                    </div>
                    <Leaf className="w-5 h-5 text-green-600" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>New Total:</span>
                  <span className="font-medium text-gray-900">
                    {(totalEmissions / 1000).toFixed(2)} tonnes CO₂e
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessNotification;