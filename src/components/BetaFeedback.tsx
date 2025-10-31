'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, CheckCircle } from 'lucide-react';

export default function BetaFeedback() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Drag-and-drop state
  const [position, setPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('abfi_beta_feedback_position');
      return saved ? JSON.parse(saved) : { bottom: 24, right: 24 };
    }
    return { bottom: 24, right: 24 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For now, just log it. You can later send to Supabase or email
    console.log('Beta Feedback:', feedback);

    // Send email (you can implement this endpoint later)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback, type: 'beta' })
      });
    } catch (error) {
      // Fail silently for now
    }

    setSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
      setSubmitted(false);
      setFeedback('');
    }, 2000);
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    setIsDragging(true);
    const rect = buttonRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newBottom = window.innerHeight - (e.clientY - dragOffset.y + (buttonRef.current?.offsetHeight || 60));
      const newRight = window.innerWidth - (e.clientX - dragOffset.x + (buttonRef.current?.offsetWidth || 150));

      // Keep within viewport bounds
      const boundedBottom = Math.max(16, Math.min(window.innerHeight - 60, newBottom));
      const boundedRight = Math.max(16, Math.min(window.innerWidth - 150, newRight));

      setPosition({ bottom: boundedBottom, right: boundedRight });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Save position to localStorage
      localStorage.setItem('abfi_beta_feedback_position', JSON.stringify(position));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, position]);

  return (
    <>
      {/* Floating Beta Button - Draggable */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(true)}
        onMouseDown={handleMouseDown}
        className={`fixed bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 z-50 group ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          bottom: `${position.bottom}px`,
          right: `${position.right}px`
        }}
        aria-label="Beta Feedback (drag to reposition)"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Beta Feedback</span>
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse"></span>
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Beta Testing Feedback</h3>
                <p className="text-sm text-gray-400 mt-1">Help us improve ABFI!</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Found a bug? Have a suggestion? Let us know! 

Examples:
• 'The map takes too long to load'
• 'Can't see vessel names clearly'
• 'Would love a filter for water temp'
• 'Analysis mode is amazing!'"
                  className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                  required
                />
                
                <div className="flex items-center gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={!feedback.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium py-2 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send Feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-3 text-center">
                  Your feedback helps us build a better platform for all captains
                </p>
              </form>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <p className="text-white font-medium">Thank you for your feedback!</p>
                <p className="text-sm text-gray-400 mt-1">We'll review it ASAP</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
