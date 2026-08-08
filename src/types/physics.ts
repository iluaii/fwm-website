import { FwmWobble } from '../lib/physics/FwmWobble';

export interface WindowBody {
  id: number;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  angle: number;
  angvel: number;
  mass: number;
  isDragging: boolean;
  grabLxCenter: number;
  grabLyCenter: number;
  grabLx: number;
  grabLy: number;
  squashT: number;
  squashAmount: number;
  squashNx: number;
  squashNy: number;
  wobble: FwmWobble;
  activeDesktop: number;
  zIndex: number;
  lastX: number;
  lastY: number;
  
  // BSP Tiling properties
  origW?: number;
  origH?: number;
  
  // Breakable windows properties
  broken?: boolean;
  hardness?: number;
  toughness?: number;
}