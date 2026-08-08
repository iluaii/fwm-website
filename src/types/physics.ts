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
  origW?: number;
  origH?: number;
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
}