import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Toolbar } from './components/Toolbar';
import { Whiteboard } from './components/Whiteboard';
import { ShareModal } from './components/ShareModal';
import { Footer } from './components/Footer';
import { Tool, Item } from './types';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

// --- Hardcoded Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCo-dliYA6nyWNRD6w8k1fV8qAiAbebdJ4",
  authDomain: "testlala-8e34d.firebaseapp.com",
  databaseURL: "https://testlala-8e34d-default-rtdb.firebaseio.com",
  projectId: "testlala-8e34d",
  storageBucket: "testlala-8e34d.appspot.com",
  messagingSenderId: "1003271711310",
  appId: "1:1003271711310:web:4c5e188cd9ef166a2c711f",
  measurementId: "G-R6Z9Q70TQP"
};

const App: React.FC = () => {
  const firebaseInstances = useMemo(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const database = getDatabase(app);
      return { app, database };
    } catch (error: any) {
        console.error("Firebase initialization failed:", error);
        alert(`Firebase initialization failed: ${error.message}. Please check the hardcoded configuration in App.tsx.`);
        return null;
    }
  }, []); // Run once on mount

  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<Item[][]>([]);
  const [redoStack, setRedoStack] = useState<Item[][]>([]);
  
  const [tool, setTool] = useState<Tool>(Tool.SELECT);
  const [color, setColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(5);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [boardId, setBoardId] = useState<string | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);
  
  // Ref to prevent history pushes during undo/redo actions
  const isUndoingRedoing = useRef(false);


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
      const newItems = data?.items || [];
      // Only update state if it's different, to avoid loops with undo/redo
      if (JSON.stringify(newItems) !== JSON.stringify(items)) {
         setItems(newItems);
      }
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
  }, [firebaseInstances]); // Depends only on firebaseInstances

  
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
  
  const handleStateChange = useCallback((updater: React.SetStateAction<Item[]>, isComplete: boolean) => {
    if (isUndoingRedoing.current) return;

    const currentItems = items;
    const newItems = typeof updater === 'function' ? updater(currentItems) : updater;

    if (isComplete) {
      if (JSON.stringify(currentItems) !== JSON.stringify(newItems)) {
        setHistory(prev => [...prev.slice(-30), currentItems]); // Limit history size
        setRedoStack([]);
      }
    }
    setItems(newItems);
  }, [items]);
  
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    
    isUndoingRedoing.current = true;
    const previousState = history[history.length - 1];
    setHistory(history.slice(0, history.length - 1));
    setRedoStack(prev => [items, ...prev]);
    setItems(previousState);
    
    // Allow history to be pushed again after a short delay
    setTimeout(() => { isUndoingRedoing.current = false; }, 100);
  }, [history, items]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

    isUndoingRedoing.current = true;
    const nextState = redoStack[0];
    setRedoStack(redoStack.slice(1));
    setHistory(prev => [...prev, items]);
    setItems(nextState);
    
    // Allow history to be pushed again after a short delay
    setTimeout(() => { isUndoingRedoing.current = false; }, 100);
  }, [redoStack, items]);


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
          handleStateChange(prevItems => [...prevItems, newItem], true);
        };
      }
    };
    reader.readAsDataURL(file);
  };

  if (!firebaseInstances) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
            <div className="text-xl text-center p-4">
                <p className="font-semibold mb-4 text-red-400">Firebase Initialization Failed</p>
                <p>Please check the hardcoded configuration in App.tsx.</p>
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
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
      />
      <main className="flex-1 overflow-hidden">
        <Whiteboard
          items={items}
          onStateChange={handleStateChange}
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