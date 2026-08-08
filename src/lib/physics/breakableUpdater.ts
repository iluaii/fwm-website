import type { WindowBody } from '../../types/physics';

// The threshold speed that causes 100% damage to a window of equal mass
// Set to 750 px/s so you can actually break things manually with the mouse in the sandbox
const HP_BREAK_SPEED = 750.0; 

export function checkWindowCollisionDamage(
  w1: WindowBody,
  w2: WindowBody,
  approachSpeed: number,
  breakableOn: boolean
) {
  if (!breakableOn) return;

  const hardness1 = w1.hardness ?? 1.0;
  const toughness1 = w1.toughness ?? 1.0;
  const hardness2 = w2.hardness ?? 1.0;
  const toughness2 = w2.toughness ?? 1.0;

  // Damage formula from fwm docs:
  // damage(A -> B) = mass(A) * (speed / hp_break_speed)^2 * hardness(A)
  // hp(B) = mass(B) * toughness(B)
  const speedFactor = Math.pow(approachSpeed / HP_BREAK_SPEED, 2);

  const dmg1to2 = w1.mass * speedFactor * hardness1;
  const hp2 = w2.mass * toughness2;

  const dmg2to1 = w2.mass * speedFactor * hardness2;
  const hp1 = w1.mass * toughness1;

  // Break if damage exceeds HP
  if (dmg1to2 > hp2) {
    w2.broken = true;
  }
  if (dmg2to1 > hp1) {
    w1.broken = true;
  }
}

export function processBrokenWindows(
  winList: WindowBody[],
  textureMap: { [key: number]: HTMLCanvasElement }
) {
  for (let i = winList.length - 1; i >= 0; i--) {
    if (winList[i].broken) {
      delete textureMap[winList[i].id];
      winList.splice(i, 1);
    }
  }
}