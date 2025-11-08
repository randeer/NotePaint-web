import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Toolbar } from './components/Toolbar';
import { Whiteboard } from './components/Whiteboard';
import { ShareModal } from './components/ShareModal';
import { Footer } from './components/Footer';
import { Tool, Item } from './types';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

// --- Firebase Configuration Modal Component ---
const configFields = [
  'apiKey', 'authDomain', 'databaseURL', 'projectId', 
  'storageBucket', 'messagingSenderId', 'appId'
];

const FirebaseConfigModal: React.FC = () => {
  const [config, setConfig] = useState(
    Object.fromEntries(configFields.map(field => [field, '']))
  );
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({
      ...config,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    // Basic validation
    if (!config.apiKey || !config.databaseURL || !config.projectId) {
      setError('Please fill in at least apiKey, databaseURL, and projectId.');
      return;
    }
    try {
      // Validate databaseURL format
      const url = new URL(config.databaseURL);
      if (url.protocol !== 'https:') {
          setError('databaseURL must start with https://');
          return;
      }
    } catch(e) {
      setError('The provided databaseURL is not a valid URL.');
      return;
    }

    setError('');
    localStorage.setItem('firebaseConfig', JSON.stringify(config));
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl mx-4 text-white">
        <h2 className="text-3xl font-bold mb-4">Firebase Configuration Required</h2>
        <p className="text-gray-300 mb-6">
          To enable real-time collaboration, this application needs to connect to a Firebase Realtime Database.
          Please create a <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">free Firebase project</a>,
          set up a Realtime Database (in test mode for easy setup), and paste your project's web configuration below.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {configFields.map(field => (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium text-gray-400 mb-1">{field}</label>
              <input
                type="text"
                id={field}
                name={field}
                value={config[field] || ''}
                onChange={handleChange}
                placeholder={`Your project's ${field}`}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-md font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save and Reload
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Helper function to get config from storage ---
const getFirebaseConfigFromStorage = () => {
    const configStr = localStorage.getItem('firebaseConfig');
    if (!configStr) return null;
    try {
        const config = JSON.parse(configStr);
        // Basic validation
        if (config.apiKey && config.databaseURL && config.projectId) {
            return config;
        }
        localStorage.removeItem('firebaseConfig'); // Clear invalid stored config
        return null;
    } catch (e) {
        console.error("Failed to parse firebase config from localStorage", e);
        localStorage.removeItem('firebaseConfig');
        return null;
    }
}

const App: React.FC = () => {
  const firebaseConfig = getFirebaseConfigFromStorage();
  
  const firebaseInstances = useMemo(() => {
    if (!firebaseConfig) return null;
    try {
      const app = initializeApp(firebaseConfig);
      const database = getDatabase(app);
      return { app, database };
    } catch (error: any) {
        console.error("Firebase initialization failed:", error);
        localStorage.removeItem('firebaseConfig');
        alert(`Firebase initialization failed: ${error.message}. The invalid configuration has been cleared. Please refresh and enter a valid one.`);
        return null;
    }
  }, []); // Run once on mount

  const [items, setItems] = useState<Item[]>([]);
  const [tool, setTool] = useState<Tool>(Tool.SELECT);
  const [color, setColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(5);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [boardId, setBoardId] = useState<string | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);

  // Effect to initialize board from URL hash and connect to Firebase
  useEffect(() => {
    if (!firebaseInstances) return; // Don't run if Firebase isn't initialized

    const getBoardIdFromHash = () => window.location.hash.slice(1);

    let currentBoardId = getBoardIdFromHash();
    if (!currentBoardId) {
      currentBoardId = `board-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      window.location.hash = currentBoardId;
    }
    setBoardId(currentBoardId);

    const boardRef = ref(firebaseInstances.database, 'boards/' + currentBoardId);

    const unsubscribe = onValue(boardRef, (snapshot) => {
      const data = snapshot.val();
      setItems(data?.items || []);
      setIsLoading(false);
    }, (error) => {
        console.error("Firebase read failed:", error);
        alert("Could not connect to the whiteboard. Please ensure your Firebase configuration is correct and the database rules are set for public read/write.");
        setIsLoading(false);
    });
    
    const handleHashChange = () => {
      window.location.reload();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
        unsubscribe();
        window.removeEventListener('hashchange', handleHashChange);
    }
  }, [firebaseInstances]);

  
  // Effect to save state to Firebase with debounce
  useEffect(() => {
    if (isLoading || !boardId || !firebaseInstances) {
      return;
    }

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = window.setTimeout(() => {
      const boardRef = ref(firebaseInstances.database, 'boards/' + boardId);
      set(boardRef, { items }).catch(error => {
        console.error("Failed to save state to Firebase:", error);
      });
    }, 300); // 300ms debounce delay

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [items, boardId, isLoading, firebaseInstances]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    setShareUrl(url);
    setIsShareModalOpen(true);
  }, []);
  
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (src) {
        const image = new Image();
        image.src = src;
        image.onload = () => {
          const newItem: Item = {
            id: Date.now().toString(),
            type: 'image',
            x: 100,
            y: 100,
            width: image.width,
            height: image.height,
            src: src,
          };
          setItems(prevItems => [...prevItems, newItem]);
        };
      }
    };
    reader.readAsDataURL(file);
  };

  if (!firebaseConfig) {
    return <FirebaseConfigModal />;
  }

  if (!firebaseInstances) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
            <div className="text-xl text-center p-4">
                <p className="font-semibold mb-4 text-red-400">Firebase Initialization Failed</p>
                <p>Please refresh the page to enter a new configuration.</p>
            </div>
        </div>
    );
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-2xl font-semibold">Loading Whiteboard...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-700">
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        onShare={handleShare}
        onImageUpload={handleImageUpload}
      />
      <main className="flex-1 overflow-hidden">
        <Whiteboard
          items={items}
          setItems={setItems}
          tool={tool}
          color={color}
          brushSize={brushSize}
        />
      </main>
      {isShareModalOpen && (
        <ShareModal url={shareUrl} onClose={() => setIsShareModalOpen(false)} />
      )}
      <Footer />
    </div>
  );
};

export default App;