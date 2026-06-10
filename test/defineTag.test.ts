import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineTag } from '../src/defineTag.js'

vi.mock('next/cache', () => ({
  unstable_cacheTag: vi.fn(),
  revalidateTag: vi.fn(),
}))

describe('defineTag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('key()', () => {
    it('returns the correct string for a single-arg tag', () => {
      const userTag = defineTag('user', (id: string) => `user:${id}`)
      expect(userTag.key('42')).toBe('user:42')
    })

    it('returns the correct string for a multi-arg tag', () => {
      const productTag = defineTag(
        'product',
        (id: string, locale: string) => `product:${id}:${locale}`,
      )
      expect(productTag.key('99', 'en')).toBe('product:99:en')
    })

    it('returns the correct string for a zero-arg tag', () => {
      const globalTag = defineTag('global', () => 'global')
      expect(globalTag.key()).toBe('global')
    })
  })

  describe('apply()', () => {
    it('calls unstable_cacheTag with the computed key', async () => {
      const { unstable_cacheTag } = await import('next/cache')
      const userTag = defineTag('user', (id: string) => `user:${id}`)

      await userTag.apply('123')

      expect(unstable_cacheTag).toHaveBeenCalledOnce()
      expect(unstable_cacheTag).toHaveBeenCalledWith('user:123')
    })

    it('calls unstable_cacheTag with the correct multi-arg key', async () => {
      const { unstable_cacheTag } = await import('next/cache')
      const productTag = defineTag(
        'product',
        (id: string, locale: string) => `product:${id}:${locale}`,
      )

      await productTag.apply('99', 'fr')

      expect(unstable_cacheTag).toHaveBeenCalledOnce()
      expect(unstable_cacheTag).toHaveBeenCalledWith('product:99:fr')
    })
  })

  describe('revalidate()', () => {
    it('calls revalidateTag with the computed key', async () => {
      const { revalidateTag } = await import('next/cache')
      const userTag = defineTag('user', (id: string) => `user:${id}`)

      await userTag.revalidate('456')

      expect(revalidateTag).toHaveBeenCalledOnce()
      expect(revalidateTag).toHaveBeenCalledWith('user:456')
    })

    it('calls revalidateTag with the correct multi-arg key', async () => {
      const { revalidateTag } = await import('next/cache')
      const productTag = defineTag(
        'product',
        (id: string, locale: string) => `product:${id}:${locale}`,
      )

      await productTag.revalidate('7', 'de')

      expect(revalidateTag).toHaveBeenCalledOnce()
      expect(revalidateTag).toHaveBeenCalledWith('product:7:de')
    })
  })

  describe('TypeScript type inference', () => {
    it('enforces arg types from keyFn at compile time', () => {
      const productTag = defineTag(
        'product',
        (id: string, locale: string) => `product:${id}:${locale}`,
      )
      // Runtime sanity check; the real enforcement is at compile time:
      //   productTag.key('1', 'en')   ← valid
      //   productTag.key('1')         ← TS error: Expected 2 arguments, got 1
      //   productTag.apply(1, 'en')   ← TS error: number not assignable to string
      expect(productTag.key('1', 'en')).toBe('product:1:en')
    })
  })
})
