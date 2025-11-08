import React, { useState, useEffect, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { Whiteboard } from './components/Whiteboard';
import { ShareModal } from './components/ShareModal';
import { Footer } from './components/Footer';
import { Tool, Item } from './types';

const App: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [tool, setTool] = useState<Tool>(Tool.SELECT);
  const [color, setColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(5);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [boardId, setBoardId] = useState<string | null>(null);

  // Effect to initialize board from URL hash and localStorage
  useEffect(() => {
    const getBoardIdFromHash = () => window.location.hash.slice(1);

    let currentBoardId = getBoardIdFromHash();
    if (!currentBoardId) {
      currentBoardId = `board-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      window.location.hash = currentBoardId;
    }
    setBoardId(currentBoardId);

    try {
      const savedState = localStorage.getItem(currentBoardId);
      if (savedState) {
        setItems(JSON.parse(savedState));
      }
    } catch (error) {
      console.error("Failed to load state from localStorage:", error);
      localStorage.removeItem(currentBoardId);
    } finally {
      setIsLoading(false);
    }

    const handleHashChange = () => {
      // Simplest way to handle board switching via back/forward buttons
      window.location.reload();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Effect to listen for changes from other tabs
  useEffect(() => {
    if (!boardId) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === boardId && event.newValue) {
        try {
          const newItems = JSON.parse(event.newValue);
          setItems(newItems);
        } catch (error) {
          console.error("Failed to parse state from storage event:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [boardId]);
  
  // Effect to save state to localStorage when items change
  useEffect(() => {
    // We prevent saving during the initial load or if boardId is not set yet
    if (boardId && !isLoading) {
      try {
        localStorage.setItem(boardId, JSON.stringify(items));
      } catch (error) {
        console.error("Failed to save state to localStorage:", error);
      }
    }
  }, [items, boardId, isLoading]);

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