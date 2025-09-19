'use client';
import { useState } from 'react';
import { Camera, Fish, MapPin, Plus } from 'lucide-react';

export default function ReportComposer() {
  const [showModal, setShowModal] = useState(false);
  const [reportType, setReportType] = useState<'quick' | 'full' | 'manual' | null>(null);

  return (
    <>
      {/* Desktop CTA */}
      <div className="hidden md:block px-6 py-4 bg-black/40 backdrop-blur-md border-b border-cyan-500/20">
        <button
          onClick={() => setShowModal(true)}
          className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-3"
        >
          <Fish className="w-5 h-5" />
          <span>Share Your Catch</span>
        </button>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-full shadow-lg shadow-cyan-500/40 flex items-center justify-center z-50 transform transition-all hover:scale-110"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-cyan-500/30 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Share Your Catch</h2>
            
            {!reportType ? (
              <div className="space-y-3">
                <button
                  onClick={() => setReportType('quick')}
                  className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <Camera className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Quick Bite</h3>
                      <p className="text-sm text-gray-400">Snap and share instantly</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setReportType('full')}
                  className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Full Analysis</h3>
                      <p className="text-sm text-gray-400">Share with ocean data</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setReportType('manual')}
                  className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Fish className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Manual Report</h3>
                      <p className="text-sm text-gray-400">Add all details yourself</p>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <div>
                {/* Report form would go here based on type */}
                <p className="text-gray-400 text-center py-8">
                  {reportType === 'quick' && 'Quick bite capture coming soon...'}
                  {reportType === 'full' && 'Full analysis report coming soon...'}
                  {reportType === 'manual' && 'Manual report form coming soon...'}
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              {reportType && (
                <button
                  onClick={() => setReportType(null)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  setShowModal(false);
                  setReportType(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
