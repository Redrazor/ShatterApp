import { describe, it, expect } from 'vitest'
import {
  normaliseCharacter,
  normaliseMission,
  normaliseProduct,
  rewriteImagePath,
} from '../../../scraper/normalise.ts'

// ---------------------------------------------------------------------------
// rewriteImagePath
// ---------------------------------------------------------------------------
describe('rewriteImagePath', () => {
  it('extracts filename from a full URL', () => {
    expect(rewriteImagePath('https://pointbreaksw.com/Images/luke.png')).toBe('/images/luke.png')
  })

  it('returns empty string for undefined', () => {
    expect(rewriteImagePath(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(rewriteImagePath('')).toBe('')
  })

  it('handles relative path with just a filename', () => {
    expect(rewriteImagePath('vader.jpg')).toBe('/images/vader.jpg')
  })
})

// ---------------------------------------------------------------------------
// normaliseCharacter
// ---------------------------------------------------------------------------
describe('normaliseCharacter', () => {
  const primaryRaw = {
    id: 1,
    name: 'Luke Skywalker',
    character_type: 'Hero',
    unit_type: 'Primary',
    sp: 5,
    pc: null,
    durability: 4,
    stamina: 6,
    fp: 2,
    era: 'Galactic Civil War',
    tags: ['Rebel', 'Jedi'],
    swp: 'SWP01',
    thumbnail: 'https://pointbreaksw.com/Images/luke_thumb.png',
    card_front: 'https://pointbreaksw.com/Images/luke_front.png',
    card_back: 'https://pointbreaksw.com/Images/luke_back.png',
    STANCE1: 'https://pointbreaksw.com/Images/luke_stance1.png',
    STANCE2: 'https://pointbreaksw.com/Images/luke_stance2.png',
    release_date: '2023-01-01',
  }

  it('maps id, name, characterType', () => {
    const c = normaliseCharacter(primaryRaw)
    expect(c.id).toBe(1)
    expect(c.name).toBe('Luke Skywalker')
    expect(c.characterType).toBe('Hero')
  })

  it('sets unitType to Primary for primary raw', () => {
    const c = normaliseCharacter(primaryRaw)
    expect(c.unitType).toBe('Primary')
  })

  it('sets sp for Primary and pc to null', () => {
    const c = normaliseCharacter(primaryRaw)
    expect(c.sp).toBe(5)
    expect(c.pc).toBeNull()
  })

  it('maps gameplay stats', () => {
    const c = normaliseCharacter(primaryRaw)
    expect(c.durability).toBe(4)
    expect(c.stamina).toBe(6)
    expect(c.fp).toBe(2)
  })

  it('maps era, swp, releaseDate', () => {
    const c = normaliseCharacter(primaryRaw)
    expect(c.era).toBe('Galactic Civil War')
    expect(c.swp).toBe('SWP01')
    expect(c.releaseDate).toBe('2023-01-01')
  })

  it('rewrites image paths', () => {
    const c = normaliseCharacter(primaryRaw)
    expect(c.thumbnail).toBe('/images/luke_thumb.png')
    expect(c.cardFront).toBe('/images/luke_front.png')
    expect(c.cardBack).toBe('/images/luke_back.png')
  })

  it('parses tags array', () => {
    const c = normaliseCharacter(primaryRaw)
    expect(c.tags).toEqual(['Rebel', 'Jedi'])
  })

  it('parses tags from semicolon-separated string', () => {
    const c = normaliseCharacter({ ...primaryRaw, tags: 'Rebel;Jedi;Force' })
    expect(c.tags).toEqual(['Rebel', 'Jedi', 'Force'])
  })

  it('maps stance1 and stance2 as image paths', () => {
    const c = normaliseCharacter(primaryRaw)
    expect(c.stance1).toBe('/images/luke_stance1.png')
    expect(c.stance2).toBe('/images/luke_stance2.png')
    expect(c.stances).toEqual([])
  })

  it('handles Secondary unit type with pc', () => {
    const raw = { ...primaryRaw, unit_type: 'Secondary', pc: 3, sp: null }
    const c = normaliseCharacter(raw)
    expect(c.unitType).toBe('Secondary')
    expect(c.pc).toBe(3)
    expect(c.sp).toBeNull()
  })

  it('handles Support unit type with pc', () => {
    const raw = { ...primaryRaw, unit_type: 'Support', pc: 2, sp: null }
    const c = normaliseCharacter(raw)
    expect(c.unitType).toBe('Support')
    expect(c.pc).toBe(2)
    expect(c.sp).toBeNull()
  })

  it('defaults unknown unit_type to Primary', () => {
    const raw = { ...primaryRaw, unit_type: 'unknown' }
    const c = normaliseCharacter(raw)
    expect(c.unitType).toBe('Primary')
  })

  it('handles missing optional fields gracefully', () => {
    const c = normaliseCharacter({ id: 99, name: 'Test', unit_type: 'Support' })
    expect(c.id).toBe(99)
    expect(c.tags).toEqual([])
    expect(c.stances).toEqual([])
    expect(c.thumbnail).toBe('')
  })

  it('extracts swpCode from first 5 chars of swp', () => {
    const c = normaliseCharacter({ ...primaryRaw, swp: 'SWP44: Make the Impossible Possible Squad Pack' })
    expect(c.swpCode).toBe('SWP44')
    expect(c.swp).toBe('SWP44: Make the Impossible Possible Squad Pack')
  })

  it('maps new optional fields: spt, modelCount, orderCard', () => {
    const c = normaliseCharacter({
      ...primaryRaw,
      SPT: '00440103',
      MODEL_COUNT: 2,
      ORDER_CARD: 'https://pointbreaksw.com/Images/order.png',
    })
    expect(c.spt).toBe('00440103')
    expect(c.modelCount).toBe(2)
    expect(c.orderCard).toBe('/images/order.png')
  })
})

// ---------------------------------------------------------------------------
// normaliseMission
// ---------------------------------------------------------------------------
describe('normaliseMission', () => {
  const rawMission = {
    id: 10,
    name: 'Outer Rim Siege',
    card: 'https://pointbreaksw.com/Images/ors.png',
    swp: 'SWP05',
    struggle1: ['https://pointbreaksw.com/Images/A.png', 'https://pointbreaksw.com/Images/B.png', 'https://pointbreaksw.com/Images/C.png'],
    struggle2: 'https://pointbreaksw.com/Images/X.png;https://pointbreaksw.com/Images/Y.png;https://pointbreaksw.com/Images/Z.png',
    struggle3: [],
  }

  it('maps id, name, swp', () => {
    const m = normaliseMission(rawMission)
    expect(m.id).toBe(10)
    expect(m.name).toBe('Outer Rim Siege')
    expect(m.swp).toBe('SWP05')
  })

  it('rewrites card image path', () => {
    const m = normaliseMission(rawMission)
    expect(m.card).toBe('/images/ors.png')
  })

  it('parses array struggles', () => {
    const m = normaliseMission(rawMission)
    expect(m.struggles['struggle1']).toEqual(['/images/A.png', '/images/B.png', '/images/C.png'])
  })

  it('parses semicolon-delimited string struggles', () => {
    const m = normaliseMission(rawMission)
    expect(m.struggles['struggle2']).toEqual(['/images/X.png', '/images/Y.png', '/images/Z.png'])
  })

  it('returns empty array for empty struggle', () => {
    const m = normaliseMission(rawMission)
    expect(m.struggles['struggle3']).toEqual([])
  })

  it('handles missing fields', () => {
    const m = normaliseMission({ id: 1, name: 'Test' })
    expect(m.card).toBe('')
    expect(m.struggles['struggle1']).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// normaliseProduct
// ---------------------------------------------------------------------------
describe('normaliseProduct', () => {
  const rawProduct = {
    id: 5,
    name: 'Core Set',
    swp: 'SWP00',
    era: 'Galactic Civil War',
    thumbnail: 'https://pointbreaksw.com/Images/core_thumb.jpg',
    images: [
      'https://pointbreaksw.com/Images/core1.jpg',
      'https://pointbreaksw.com/Images/core2.jpg',
    ],
    models: ['Luke Skywalker', 'Darth Vader'],
    description: 'The core set',
    assembly_url: 'https://example.com/assembly',
    store_link: 'https://store.example.com',
  }

  it('maps basic fields', () => {
    const p = normaliseProduct(rawProduct)
    expect(p.id).toBe(5)
    expect(p.name).toBe('Core Set')
    expect(p.swp).toBe('SWP00')
    expect(p.era).toBe('Galactic Civil War')
    expect(p.description).toBe('The core set')
  })

  it('rewrites thumbnail path', () => {
    const p = normaliseProduct(rawProduct)
    expect(p.thumbnail).toBe('/images/core_thumb.jpg')
  })

  it('rewrites images array paths', () => {
    const p = normaliseProduct(rawProduct)
    expect(p.images).toEqual(['/images/core1.jpg', '/images/core2.jpg'])
  })

  it('maps models array', () => {
    const p = normaliseProduct(rawProduct)
    expect(p.models).toEqual(['Luke Skywalker', 'Darth Vader'])
  })

  it('maps assemblyUrl and storeLink', () => {
    const p = normaliseProduct(rawProduct)
    expect(p.assemblyUrl).toBe('https://example.com/assembly')
    expect(p.storeLink).toBe('https://store.example.com')
  })

  it('handles missing fields', () => {
    const p = normaliseProduct({ id: 1, name: 'Empty' })
    expect(p.images).toEqual([])
    expect(p.models).toEqual([])
    expect(p.thumbnail).toBe('')
  })

  it('parses models from semicolon-separated string', () => {
    const p = normaliseProduct({ ...rawProduct, models: 'Luke;Vader;Leia' })
    expect(p.models).toEqual(['Luke', 'Vader', 'Leia'])
  })

  it('maps number and mainImage fields', () => {
    const p = normaliseProduct({
      ...rawProduct,
      NUMBER: '44',
      MAIN_IMAGE: 'https://pointbreaksw.com/Images/main.jpg',
    })
    expect(p.number).toBe('44')
    expect(p.mainImage).toBe('/images/main.jpg')
  })
})
