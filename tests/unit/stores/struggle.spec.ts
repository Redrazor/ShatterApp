import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStruggleStore } from '../../../src/stores/struggle.ts'
import type { Mission } from '../../../src/types/index.ts'

const mockMission: Mission = {
  id: 1,
  name: 'First Contact',
  card: '/images/SWP49_MissionCard.png',
  swp: 'SWP49',
  struggles: {
    struggle1: ['/images/s1.png'],
    struggle2: ['/images/s2.png'],
    struggle3: ['/images/s3.png'],
  },
}

describe('useStruggleStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('starts with struggle at 0, 1 momentum each, 0 wins each', () => {
      const store = useStruggleStore()
      expect(store.strugglePosition).toBe(0)
      expect(store.p1Momentum).toBe(1)
      expect(store.p2Momentum).toBe(1)
      expect(store.p1Wins).toBe(0)
      expect(store.p2Wins).toBe(0)
    })
  })

  describe('p1InnermostSlot', () => {
    it('is -8 when p1Momentum is 1', () => {
      const store = useStruggleStore()
      store.p1Momentum = 1
      expect(store.p1InnermostSlot).toBe(-8)
    })

    it('is -7 when p1Momentum is 2', () => {
      const store = useStruggleStore()
      store.p1Momentum = 2
      expect(store.p1InnermostSlot).toBe(-7)
    })

    it('is -1 when p1Momentum is 8', () => {
      const store = useStruggleStore()
      store.p1Momentum = 8
      expect(store.p1InnermostSlot).toBe(-1)
    })

    it('is null when p1Momentum is 0', () => {
      const store = useStruggleStore()
      store.p1Momentum = 0
      expect(store.p1InnermostSlot).toBeNull()
    })
  })

  describe('p2InnermostSlot', () => {
    it('is +8 when p2Momentum is 1', () => {
      const store = useStruggleStore()
      store.p2Momentum = 1
      expect(store.p2InnermostSlot).toBe(8)
    })

    it('is +7 when p2Momentum is 2', () => {
      const store = useStruggleStore()
      store.p2Momentum = 2
      expect(store.p2InnermostSlot).toBe(7)
    })

    it('is +1 when p2Momentum is 8', () => {
      const store = useStruggleStore()
      store.p2Momentum = 8
      expect(store.p2InnermostSlot).toBe(1)
    })

    it('is null when p2Momentum is 0', () => {
      const store = useStruggleStore()
      store.p2Momentum = 0
      expect(store.p2InnermostSlot).toBeNull()
    })
  })

  describe('p1WinsStruggle', () => {
    it('is true when struggle token is at p1InnermostSlot', () => {
      const store = useStruggleStore()
      store.p1Momentum = 1
      store.strugglePosition = -8
      expect(store.p1WinsStruggle).toBe(true)
    })

    it('is false when struggle token is not at p1InnermostSlot', () => {
      const store = useStruggleStore()
      store.p1Momentum = 1
      store.strugglePosition = -7
      expect(store.p1WinsStruggle).toBe(false)
    })

    it('is false when p1Momentum is 0 (no tokens)', () => {
      const store = useStruggleStore()
      store.p1Momentum = 0
      store.strugglePosition = -8
      expect(store.p1WinsStruggle).toBe(false)
    })

    it('detects win with 3 momentum tokens (innermost = -6)', () => {
      const store = useStruggleStore()
      store.p1Momentum = 3
      store.strugglePosition = -6
      expect(store.p1WinsStruggle).toBe(true)
    })
  })

  describe('p2WinsStruggle', () => {
    it('is true when struggle token is at p2InnermostSlot', () => {
      const store = useStruggleStore()
      store.p2Momentum = 1
      store.strugglePosition = 8
      expect(store.p2WinsStruggle).toBe(true)
    })

    it('is false when struggle token is not at p2InnermostSlot', () => {
      const store = useStruggleStore()
      store.p2Momentum = 1
      store.strugglePosition = 7
      expect(store.p2WinsStruggle).toBe(false)
    })

    it('is false when p2Momentum is 0', () => {
      const store = useStruggleStore()
      store.p2Momentum = 0
      store.strugglePosition = 8
      expect(store.p2WinsStruggle).toBe(false)
    })
  })

  describe('gameOver', () => {
    it('is false initially', () => {
      const store = useStruggleStore()
      expect(store.gameOver).toBe(false)
    })

    it('is true when p1Wins reaches 2', () => {
      const store = useStruggleStore()
      store.p1Wins = 2
      expect(store.gameOver).toBe(true)
    })

    it('is true when p2Wins reaches 2', () => {
      const store = useStruggleStore()
      store.p2Wins = 2
      expect(store.gameOver).toBe(true)
    })

    it('is false when each player has 1 win', () => {
      const store = useStruggleStore()
      store.p1Wins = 1
      store.p2Wins = 1
      expect(store.gameOver).toBe(false)
    })
  })

  describe('addMomentum', () => {
    it('increments p1Momentum', () => {
      const store = useStruggleStore()
      store.addMomentum(1)
      expect(store.p1Momentum).toBe(2)
    })

    it('increments p2Momentum', () => {
      const store = useStruggleStore()
      store.addMomentum(2)
      expect(store.p2Momentum).toBe(2)
    })

    it('does not exceed 8 for p1', () => {
      const store = useStruggleStore()
      store.p1Momentum = 8
      store.addMomentum(1)
      expect(store.p1Momentum).toBe(8)
    })

    it('does not exceed 8 for p2', () => {
      const store = useStruggleStore()
      store.p2Momentum = 8
      store.addMomentum(2)
      expect(store.p2Momentum).toBe(8)
    })
  })

  describe('removeMomentum', () => {
    it('decrements p1Momentum', () => {
      const store = useStruggleStore()
      store.removeMomentum(1)
      expect(store.p1Momentum).toBe(0)
    })

    it('decrements p2Momentum', () => {
      const store = useStruggleStore()
      store.removeMomentum(2)
      expect(store.p2Momentum).toBe(0)
    })

    it('does not go below 0 for p1', () => {
      const store = useStruggleStore()
      store.p1Momentum = 0
      store.removeMomentum(1)
      expect(store.p1Momentum).toBe(0)
    })

    it('does not go below 0 for p2', () => {
      const store = useStruggleStore()
      store.p2Momentum = 0
      store.removeMomentum(2)
      expect(store.p2Momentum).toBe(0)
    })
  })

  describe('moveStruggle', () => {
    it('moves right by 1', () => {
      const store = useStruggleStore()
      store.moveStruggle(1)
      expect(store.strugglePosition).toBe(1)
    })

    it('moves left by 1', () => {
      const store = useStruggleStore()
      store.moveStruggle(-1)
      expect(store.strugglePosition).toBe(-1)
    })

    it('moves by 3', () => {
      const store = useStruggleStore()
      store.moveStruggle(3)
      expect(store.strugglePosition).toBe(3)
    })

    it('clamps at +8', () => {
      const store = useStruggleStore()
      store.strugglePosition = 6
      store.moveStruggle(5)
      expect(store.strugglePosition).toBe(8)
    })

    it('clamps at -8', () => {
      const store = useStruggleStore()
      store.strugglePosition = -6
      store.moveStruggle(-5)
      expect(store.strugglePosition).toBe(-8)
    })

    it('does not go beyond +8 from 0', () => {
      const store = useStruggleStore()
      for (let i = 0; i < 20; i++) store.moveStruggle(1)
      expect(store.strugglePosition).toBe(8)
    })
  })

  describe('claimStruggle', () => {
    it('increments p1Wins when player 1 claims', () => {
      const store = useStruggleStore()
      store.claimStruggle(1)
      expect(store.p1Wins).toBe(1)
    })

    it('increments p2Wins when player 2 claims', () => {
      const store = useStruggleStore()
      store.claimStruggle(2)
      expect(store.p2Wins).toBe(1)
    })

    it('resets struggle position to 0', () => {
      const store = useStruggleStore()
      store.strugglePosition = -6
      store.claimStruggle(1)
      expect(store.strugglePosition).toBe(0)
    })

    it('resets momentum to 1 for each player', () => {
      const store = useStruggleStore()
      store.p1Momentum = 5
      store.p2Momentum = 4
      store.claimStruggle(1)
      expect(store.p1Momentum).toBe(1)
      expect(store.p2Momentum).toBe(1)
    })

    it('does not reset wins', () => {
      const store = useStruggleStore()
      store.claimStruggle(1)
      store.claimStruggle(2)
      expect(store.p1Wins).toBe(1)
      expect(store.p2Wins).toBe(1)
    })
  })

  describe('setMomentumToSlot', () => {
    it('sets p1Momentum to 1 when clicking slot -8 (level 1)', () => {
      const store = useStruggleStore()
      store.p1Momentum = 0
      store.setMomentumToSlot(1, -8)
      expect(store.p1Momentum).toBe(1)
    })

    it('sets p1Momentum to 3 when clicking slot -6 (level 3)', () => {
      const store = useStruggleStore()
      store.p1Momentum = 1
      store.setMomentumToSlot(1, -6)
      expect(store.p1Momentum).toBe(3)
    })

    it('removes p1 innermost token when clicking its slot again', () => {
      const store = useStruggleStore()
      store.p1Momentum = 3  // innermost = -6
      store.setMomentumToSlot(1, -6)  // level 3 === current → remove
      expect(store.p1Momentum).toBe(2)
    })

    it('cuts p1 tokens when clicking a filled non-innermost slot', () => {
      const store = useStruggleStore()
      store.p1Momentum = 4  // filled: -8,-7,-6,-5; innermost=-5
      store.setMomentumToSlot(1, -7)  // level 2 < 4 → set to 2
      expect(store.p1Momentum).toBe(2)
    })

    it('sets p2Momentum to 1 when clicking slot +8 (level 1)', () => {
      const store = useStruggleStore()
      store.p2Momentum = 0
      store.setMomentumToSlot(2, 8)
      expect(store.p2Momentum).toBe(1)
    })

    it('sets p2Momentum to 3 when clicking slot +6 (level 3)', () => {
      const store = useStruggleStore()
      store.p2Momentum = 1
      store.setMomentumToSlot(2, 6)
      expect(store.p2Momentum).toBe(3)
    })

    it('removes p2 innermost token when clicking its slot again', () => {
      const store = useStruggleStore()
      store.p2Momentum = 2  // innermost = +7
      store.setMomentumToSlot(2, 7)  // level 2 === current → remove
      expect(store.p2Momentum).toBe(1)
    })

    it('ignores out-of-range pos', () => {
      const store = useStruggleStore()
      store.p1Momentum = 3
      store.setMomentumToSlot(1, 0)  // level = 9+0 = 9 → out of range
      expect(store.p1Momentum).toBe(3)
    })
  })

  describe('resetGame', () => {
    it('resets all state to initial values', () => {
      const store = useStruggleStore()
      store.strugglePosition = 5
      store.p1Momentum = 4
      store.p2Momentum = 3
      store.p1Wins = 1
      store.p2Wins = 2
      store.resetGame()
      expect(store.strugglePosition).toBe(0)
      expect(store.p1Momentum).toBe(1)
      expect(store.p2Momentum).toBe(1)
      expect(store.p1Wins).toBe(0)
      expect(store.p2Wins).toBe(0)
    })

    it('clears selectedMission to null', () => {
      const store = useStruggleStore()
      store.confirmMission(mockMission)
      store.resetGame()
      expect(store.selectedMission).toBeNull()
    })

    it('clears struggleCards to null', () => {
      const store = useStruggleStore()
      store.confirmMission(mockMission)
      store.resetGame()
      expect(store.struggleCards).toBeNull()
    })
  })

  describe('confirmMission', () => {
    it('sets selectedMission', () => {
      const store = useStruggleStore()
      store.confirmMission(mockMission)
      expect(store.selectedMission).toEqual(mockMission)
    })

    it('sets struggleCards to a 3-tuple of image paths', () => {
      const store = useStruggleStore()
      store.confirmMission(mockMission)
      expect(store.struggleCards).toHaveLength(3)
      expect(store.struggleCards![0]).toBe('/images/s1.png')
      expect(store.struggleCards![1]).toBe('/images/s2.png')
      expect(store.struggleCards![2]).toBe('/images/s3.png')
    })

    it('picks from each struggle array (multi-element)', () => {
      const store = useStruggleStore()
      const multiMission: Mission = {
        ...mockMission,
        struggles: {
          struggle1: ['/images/s1a.png', '/images/s1b.png'],
          struggle2: ['/images/s2a.png'],
          struggle3: ['/images/s3a.png'],
        },
      }
      store.confirmMission(multiMission)
      expect(['/images/s1a.png', '/images/s1b.png']).toContain(store.struggleCards![0])
      expect(store.struggleCards![1]).toBe('/images/s2a.png')
    })

    it('sets empty string for struggle array that is empty', () => {
      const store = useStruggleStore()
      const emptyMission: Mission = {
        ...mockMission,
        struggles: { struggle1: [], struggle2: [], struggle3: [] },
      }
      store.confirmMission(emptyMission)
      expect(store.struggleCards).toEqual(['', '', ''])
    })

    it('sets empty string when struggle key is missing', () => {
      const store = useStruggleStore()
      const noKeyMission: Mission = { ...mockMission, struggles: {} }
      store.confirmMission(noKeyMission)
      expect(store.struggleCards).toEqual(['', '', ''])
    })
  })

  describe('revealedCount', () => {
    it('is 0 when no mission is selected', () => {
      const store = useStruggleStore()
      expect(store.revealedCount).toBe(0)
    })

    it('is 1 at game start with mission selected (0 wins)', () => {
      const store = useStruggleStore()
      store.confirmMission(mockMission)
      expect(store.revealedCount).toBe(1)
    })

    it('is 2 after one struggle is claimed', () => {
      const store = useStruggleStore()
      store.confirmMission(mockMission)
      store.claimStruggle(1)
      expect(store.revealedCount).toBe(2)
    })

    it('is 3 after two struggles are claimed', () => {
      const store = useStruggleStore()
      store.confirmMission(mockMission)
      store.claimStruggle(1)
      store.claimStruggle(2)
      expect(store.revealedCount).toBe(3)
    })

    it('never exceeds 3', () => {
      const store = useStruggleStore()
      store.confirmMission(mockMission)
      store.p1Wins = 5
      store.p2Wins = 5
      expect(store.revealedCount).toBe(3)
    })

    it('resets to 0 after resetGame', () => {
      const store = useStruggleStore()
      store.confirmMission(mockMission)
      store.claimStruggle(1)
      store.resetGame()
      expect(store.revealedCount).toBe(0)
    })
  })
})
