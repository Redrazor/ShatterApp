import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFavoritesStore } from '../../../src/stores/favorites.ts'

describe('useFavoritesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with empty favoritedIds', () => {
    const store = useFavoritesStore()
    expect(store.favoritedIds).toEqual([])
  })

  it('isFavorited returns false for unknown id', () => {
    const store = useFavoritesStore()
    expect(store.isFavorited(42)).toBe(false)
  })

  it('toggleFavorite adds an id', () => {
    const store = useFavoritesStore()
    store.toggleFavorite(1)
    expect(store.favoritedIds).toContain(1)
  })

  it('toggleFavorite removes an id when already present', () => {
    const store = useFavoritesStore()
    store.toggleFavorite(1)
    store.toggleFavorite(1)
    expect(store.favoritedIds).not.toContain(1)
  })

  it('favoritedSet computed reflects current state', () => {
    const store = useFavoritesStore()
    store.toggleFavorite(10)
    store.toggleFavorite(20)
    expect(store.favoritedSet.has(10)).toBe(true)
    expect(store.favoritedSet.has(20)).toBe(true)
    expect(store.favoritedSet.has(99)).toBe(false)
  })

  it('isFavorited returns true after toggle', () => {
    const store = useFavoritesStore()
    store.toggleFavorite(5)
    expect(store.isFavorited(5)).toBe(true)
  })

  it('can favorite multiple ids', () => {
    const store = useFavoritesStore()
    ;[1, 2, 3].forEach(id => store.toggleFavorite(id))
    expect(store.favoritedIds).toHaveLength(3)
  })

  it('favoritedSet updates after toggle off', () => {
    const store = useFavoritesStore()
    store.toggleFavorite(7)
    expect(store.favoritedSet.has(7)).toBe(true)
    store.toggleFavorite(7)
    expect(store.favoritedSet.has(7)).toBe(false)
  })
})
