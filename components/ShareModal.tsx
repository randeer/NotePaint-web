
import React, { useState } from 'react';

interface ShareModalProps {
  url: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ url, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Share Your Whiteboard</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        <p className="text-gray-300 mb-4">
          Anyone with this link can view and edit this whiteboard.
        </p>
        <div className="flex items-center space-x-2 bg-gray-900 p-2 rounded-md">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 bg-transparent text-gray-300 border-none focus:ring-0"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};
