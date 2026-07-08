import type { RivenStatFixFactorMap } from '../../types/wf/riven'

export const rivenStatFixFactor: RivenStatFixFactorMap = {
  2: { buffFactor: 0.99, buffCount: 2, curseFactor: 0, curseCount: 0 },
  21: {
    buffFactor: 1.2375,
    buffCount: 2,
    curseFactor: -0.495,
    curseCount: 1,
  },
  3: {
    buffFactor: 0.75,
    buffCount: 3,
    curseFactor: 0,
    curseCount: 0,
  },
  31: {
    buffFactor: 0.9375,
    buffCount: 3,
    curseFactor: -0.75,
    curseCount: 1,
  },
}
