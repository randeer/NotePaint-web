import { KonvaEventObject } from 'konva/lib/Node';

export enum Tool {
  SELECT = 'SELECT',
  PENCIL = 'PENCIL',
  ERASER = 'ERASER',
  TEXT = 'TEXT',
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  LINE = 'LINE',
}

interface BaseItem {
  id: string;
  x: number;
  y: number;
}

export interface LineItem extends BaseItem {
  type: 'line';
  points: number[];
  color: string;
  brushSize: number;
  isEraser?: boolean;
}

export interface TextItem extends BaseItem {
  type: 'text';
  text: string;
  color: string;
  fontSize: number;
  width: number;
}

export interface ImageItem extends BaseItem {
  type: 'image';
  src: string;
  width: number;
  height: number;
}

export interface RectangleItem extends BaseItem {
  type: 'rectangle';
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
}

export interface CircleItem extends BaseItem {
  type: 'circle';
  radius: number;
  color: string;
  strokeWidth: number;
}

export interface SimpleLineItem extends BaseItem {
  type: 'simple-line';
  points: number[]; // [x1, y1, x2, y2]
  color: string;
  strokeWidth: number;
}


export type Item = LineItem | TextItem | ImageItem | RectangleItem | CircleItem | SimpleLineItem;