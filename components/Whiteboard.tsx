import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Text, Image as KonvaImage, Rect, Circle, Transformer } from 'react-konva';
import Konva from 'konva';
import { Item, Tool, TextItem, ImageItem, RectangleItem, CircleItem, SimpleLineItem } from '../types';

interface WhiteboardProps {
  items: Item[];
  onStateChange: (updater: React.SetStateAction<Item[]>, isComplete: boolean) => void;
  tool: Tool;
  color: string;
  brushSize: number;
}

const useImage = (src: string): [HTMLImageElement | undefined] => {
  const [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setImage(img);
    };
  }, [src]);
  return [image];
};

const ImageCanvasItem: React.FC<{
  item: ImageItem;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onPointerDown: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  draggable: boolean;
}> = ({ item, onDragEnd, onPointerDown, draggable }) => {
  const [image] = useImage(item.src);
  return (
    <KonvaImage
      id={item.id}
      x={item.x}
      y={item.y}
      image={image}
      width={item.width}
      height={item.height}
      draggable={draggable}
      onDragEnd={onDragEnd}
      onPointerDown={onPointerDown}
    />
  );
};

interface CanvasItemProps {
  item: Item;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDoubleClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onPointerDown: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  tool: Tool;
}

const CanvasItem: React.FC<CanvasItemProps> = ({
  item,
  onDragEnd,
  onDoubleClick,
  onPointerDown,
  tool
}) => {
  const isDraggable = tool === Tool.SELECT;

  if (item.type === 'line') {
    return (
      <Line
        id={item.id}
        points={item.points}
        stroke={item.isEraser ? '#4A5568' : item.color} // Eraser color matches background
        strokeWidth={item.brushSize}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation={item.isEraser ? 'destination-out' : 'source-over'}
        draggable={isDraggable}
        onDragEnd={onDragEnd}
        onPointerDown={onPointerDown}
        x={item.x}
        y={item.y}
      />
    );
  }
  if (item.type === 'text') {
    return (
      <Text
        id={item.id}
        x={item.x}
        y={item.y}
        text={item.text}
        fontSize={item.fontSize}
        fill={item.color}
        draggable={isDraggable}
        onDragEnd={onDragEnd}
        onDblClick={onDoubleClick}
        onDblTap={onDoubleClick}
        onPointerDown={onPointerDown}
        width={item.width}
      />
    );
  }
  if (item.type === 'image') {
    return <ImageCanvasItem item={item} onDragEnd={onDragEnd} onPointerDown={onPointerDown} draggable={isDraggable} />;
  }
  if (item.type === 'rectangle') {
    return (
        <Rect 
            id={item.id}
            x={item.x}
            y={item.y}
            width={item.width}
            height={item.height}
            stroke={item.color}
            strokeWidth={item.strokeWidth}
            draggable={isDraggable}
            onDragEnd={onDragEnd}
            onPointerDown={onPointerDown}
        />
    )
  }
  if (item.type === 'circle') {
    return (
        <Circle
            id={item.id}
            x={item.x}
            y={item.y}
            radius={item.radius}
            stroke={item.color}
            strokeWidth={item.strokeWidth}
            draggable={isDraggable}
            onDragEnd={onDragEnd}
            onPointerDown={onPointerDown}
        />
    )
  }
    if (item.type === 'simple-line') {
    return (
        <Line
            id={item.id}
            points={item.points}
            stroke={item.color}
            strokeWidth={item.strokeWidth}
            draggable={isDraggable}
            onDragEnd={onDragEnd}
            onPointerDown={onPointerDown}
            x={item.x}
            y={item.y}
        />
    )
  }
  return null;
};

const PADDING = 200; // Extra space around the content

export const Whiteboard: React.FC<WhiteboardProps> = ({ items, onStateChange, tool, color, brushSize }) => {
  const isDrawing = useRef(false);
  const startPoint = useRef({ x: 0, y: 0 });
  const [drawingShape, setDrawingShape] = useState<Item | null>(null);

  const [editingText, setEditingText] = useState<TextItem | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  // Effect to set initial size and ensure canvas is always at least as big as the viewport
  useEffect(() => {
    const checkSize = () => {
      if (containerRef.current) {
        setStageSize(currentSize => ({
          width: Math.max(currentSize.width, containerRef.current.offsetWidth),
          height: Math.max(currentSize.height, containerRef.current.offsetHeight),
        }));
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  // Effect for content-based expansion of the canvas
  useEffect(() => {
    if (!items.length || !containerRef.current) return;

    let maxX = 0;
    let maxY = 0;

    items.forEach(item => {
        switch (item.type) {
            case 'line':
                item.points.forEach((p, i) => {
                    if (i % 2 === 0) maxX = Math.max(maxX, item.x + p);
                    else maxY = Math.max(maxY, item.y + p);
                });
                break;
            case 'simple-line':
                maxX = Math.max(maxX, item.x + item.points[0], item.x + item.points[2]);
                maxY = Math.max(maxY, item.y + item.points[1], item.y + item.points[3]);
                break;
            case 'rectangle':
            case 'image':
            case 'text':
                maxX = Math.max(maxX, item.x + item.width);
                maxY = Math.max(maxY, item.y + (item.type === 'text' ? (item.fontSize * 1.5) : item.height));
                break;
            case 'circle':
                maxX = Math.max(maxX, item.x + item.radius);
                maxY = Math.max(maxY, item.y + item.radius);
                break;
        }
    });

    setStageSize(currentSize => {
        const requiredWidth = maxX + PADDING;
        const requiredHeight = maxY + PADDING;
        
        const newWidth = Math.max(currentSize.width, containerRef.current?.offsetWidth || 0, requiredWidth);
        const newHeight = Math.max(currentSize.height, containerRef.current?.offsetHeight || 0, requiredHeight);

        if (newWidth > currentSize.width || newHeight > currentSize.height) {
            return { width: newWidth, height: newHeight };
        }
        return currentSize;
    });

  }, [items]);


  useEffect(() => {
    if (!trRef.current || !stageRef.current) return;
    
    const stage = stageRef.current;
    const selectedNode = selectedId ? stage.findOne('#' + selectedId) : null;
    const selectedItem = items.find(item => item.id === selectedId);

    if (selectedNode && selectedItem) {
      trRef.current.nodes([selectedNode]);
      if (selectedItem.type === 'image' || selectedItem.type === 'circle') {
        trRef.current.keepRatio(true);
        trRef.current.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right']);
      } else {
        trRef.current.keepRatio(false);
        trRef.current.enabledAnchors(undefined);
      }
    } else {
      trRef.current.nodes([]);
    }
    trRef.current.getLayer()?.batchDraw();
  }, [selectedId, items]);


  const handlePointerDown = (e: Konva.KonvaEventObject<PointerEvent>) => {
    // Deselect if clicked on empty area
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
    }
    
    if (tool === Tool.SELECT || editingText) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    isDrawing.current = true;
    startPoint.current = pos;
    
    if (tool === Tool.PENCIL || tool === Tool.ERASER) {
        const newItem: Item = {
            id: Date.now().toString(),
            type: 'line',
            points: [pos.x, pos.y],
            color,
            brushSize,
            isEraser: tool === Tool.ERASER,
            x: 0,
            y: 0,
        };
        onStateChange((prevItems) => [...prevItems, newItem], false);
    } else {
        const shapeId = `drawing-${Date.now()}`;
        let shape: Item | null = null;
        if (tool === Tool.RECTANGLE) {
            shape = { id: shapeId, type: 'rectangle', x: pos.x, y: pos.y, width: 0, height: 0, color, strokeWidth: brushSize } as RectangleItem;
        } else if (tool === Tool.CIRCLE) {
            shape = { id: shapeId, type: 'circle', x: pos.x, y: pos.y, radius: 0, color, strokeWidth: brushSize } as CircleItem;
        } else if (tool === Tool.LINE) {
            shape = { id: shapeId, type: 'simple-line', points: [pos.x, pos.y, pos.x, pos.y], color, strokeWidth: brushSize, x:0, y:0 } as SimpleLineItem;
        }
        setDrawingShape(shape);
    }
  };

  const handlePointerMove = (e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isDrawing.current) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    const point = stage.getPointerPosition();
    if (!point) return;

    if (tool === Tool.PENCIL || tool === Tool.ERASER) {
        onStateChange((prevItems) => {
          const lastItem = prevItems[prevItems.length - 1];
          if (lastItem && lastItem.type === 'line') {
            return [
              ...prevItems.slice(0, -1),
              { ...lastItem, points: lastItem.points.concat([point.x, point.y]) },
            ];
          }
          return prevItems;
        }, false);
    } else if (drawingShape) {
        let updatedShape = { ...drawingShape };
        if (updatedShape.type === 'rectangle') {
            updatedShape.width = point.x - startPoint.current.x;
            updatedShape.height = point.y - startPoint.current.y;
        } else if (updatedShape.type === 'circle') {
            const dx = point.x - startPoint.current.x;
            const dy = point.y - startPoint.current.y;
            updatedShape.radius = Math.sqrt(dx * dx + dy * dy);
            updatedShape.x = startPoint.current.x; // Keep center fixed
            updatedShape.y = startPoint.current.y;
        } else if (updatedShape.type === 'simple-line') {
            updatedShape.points = [startPoint.current.x, startPoint.current.y, point.x, point.y];
        }
        setDrawingShape(updatedShape);
    }
  };

  const handlePointerUp = () => {
    if (tool === Tool.PENCIL || tool === Tool.ERASER) {
        if(isDrawing.current) {
            onStateChange(items => items, true); // Signal completion
        }
    }
    isDrawing.current = false;
    if (drawingShape) {
      if (
        (drawingShape.type === 'rectangle' && (drawingShape.width !== 0 || drawingShape.height !== 0)) ||
        (drawingShape.type === 'circle' && drawingShape.radius > 2) ||
        (drawingShape.type === 'simple-line' && (drawingShape.points[0] !== drawingShape.points[2] || drawingShape.points[1] !== drawingShape.points[3]))
      ) {
         // Normalize rectangle width/height
         if (drawingShape.type === 'rectangle') {
            if (drawingShape.width < 0) {
              drawingShape.x = drawingShape.x + drawingShape.width;
              drawingShape.width = -drawingShape.width;
            }
            if (drawingShape.height < 0) {
              drawingShape.y = drawingShape.y + drawingShape.height;
              drawingShape.height = -drawingShape.height;
            }
          }
         onStateChange(prev => [...prev, { ...drawingShape, id: Date.now().toString() }], true);
      }
      setDrawingShape(null);
    }
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool !== Tool.TEXT || editingText) return;
    if (e.target !== e.target.getStage()) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const newItem: TextItem = {
      id: Date.now().toString(),
      type: 'text',
      x: pos.x,
      y: pos.y,
      text: 'Double click to edit',
      color,
      fontSize: 24,
      width: 200,
    };
    onStateChange((prevItems) => [...prevItems, newItem], true);
  };
  
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const id = e.target.id();
    const target = e.target;
    onStateChange(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, x: target.x(), y: target.y() };
        }
        return item;
      }), true
    );
  };

  const handleTextDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool !== Tool.SELECT) return;
    const id = e.target.id();
    const textNode = e.target as Konva.Text;
    const item = items.find(i => i.id === id && i.type === 'text') as TextItem;
    if (item) {
      setSelectedId(null); // Hide transformer during text edit
      setEditingText({ ...item, x: textNode.absolutePosition().x, y: textNode.absolutePosition().y });
    }
  };

  const handleTextEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (editingText) {
      setEditingText({ ...editingText, text: e.target.value });
    }
  };

  const handleTextareaBlur = () => {
    if (editingText) {
      const newItems = items.map(item => {
        if (item.id === editingText.id) {
          return { ...editingText, x: item.x, y: item.y }; // Revert to relative position
        }
        return item;
      });
      onStateChange(newItems, true);
      setEditingText(null);
    }
  };
  
  const handleItemPointerDown = (e: Konva.KonvaEventObject<PointerEvent>) => {
      if (tool === Tool.SELECT) {
          setSelectedId(e.target.id());
      }
  }

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const id = node.id();

    onStateChange(prevItems => prevItems.map(item => {
        if (item.id === id) {
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            
            const baseUpdate = {
                ...item,
                x: node.x(),
                y: node.y(),
            };

            switch(item.type) {
                case 'image':
                case 'rectangle':
                    return {
                        ...baseUpdate,
                        width: Math.max(20, item.width * scaleX),
                        height: Math.max(20, item.height * scaleY),
                    };
                case 'circle':
                    const avgScale = (scaleX + scaleY) / 2;
                    return {
                        ...baseUpdate,
                        radius: Math.max(10, item.radius * avgScale),
                    };
                case 'text':
                    return {
                        ...baseUpdate,
                        width: Math.max(20, item.width * scaleX),
                        fontSize: Math.max(8, item.fontSize * scaleY),
                    };
                default:
                    return baseUpdate;
            }
        }
        return item;
    }), true);
  };


  return (
    <div ref={containerRef} className="w-full h-full bg-gray-500 relative" style={{ cursor: tool === Tool.SELECT ? 'default' : 'crosshair' }}>
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleStageClick}
        ref={stageRef}
        className="bg-white"
      >
        <Layer>
          {items.map((item) => {
            if (editingText && item.id === editingText.id) return null;
            return <CanvasItem 
              key={item.id} 
              item={item} 
              onDragEnd={handleDragEnd} 
              onDoubleClick={handleTextDblClick}
              onPointerDown={handleItemPointerDown}
              tool={tool}
            />;
          })}
          {drawingShape && <CanvasItem item={drawingShape} onDragEnd={()=>{}} onDoubleClick={()=>{}} onPointerDown={()=>{}} tool={tool}/>}
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) {
                return oldBox;
              }
              return newBox;
            }}
            onTransformEnd={handleTransformEnd}
            rotateEnabled={false}
          />
        </Layer>
      </Stage>
      {editingText && (
        <textarea
          value={editingText.text}
          onChange={handleTextEdit}
          onBlur={handleTextareaBlur}
          autoFocus
          style={{
            position: 'absolute',
            top: editingText.y,
            left: editingText.x,
            width: editingText.width,
            height: 'auto',
            background: '#ffffff',
            color: 'black',
            border: '1px solid #4f46e5',
            fontSize: `${editingText.fontSize}px`,
            fontFamily: 'sans-serif',
            padding: '4px',
            margin: 0,
            resize: 'none',
            overflow: 'hidden',
            lineHeight: '1.2',
            zIndex: 100,
          }}
        />
      )}
    </div>
  );
};
