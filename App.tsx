import React, { useState, useEffect, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { Whiteboard } from './components/Whiteboard';
import { ShareModal } from './components/ShareModal';
import { Footer } from './components/Footer';
import { Tool, Item } from './types';
import { encodeState, decodeState } from './utils/stateSerializer';

const App: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [tool, setTool] = useState<Tool>(Tool.SELECT);
  const [color, setColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(5);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const decodedState = decodeState(hash);
        if (Array.isArray(decodedState)) {
          setItems(decodedState);
        }
      }
    } catch (error) {
      console.error("Failed to decode state from URL hash:", error);
      // Optionally clear the hash or notify the user
      window.location.hash = '';
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleShare = useCallback(() => {
    try {
      const encodedState = encodeState(items);
      const url = `${window.location.origin}${window.location.pathname}#${encodedState}`;
      setShareUrl(url);
      setIsShareModalOpen(true);
      window.location.hash = encodedState;
    } catch (error) {
      console.error("Failed to encode state for sharing:", error);
      alert("Could not generate shareable link.");
    }
  }, [items]);
  
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