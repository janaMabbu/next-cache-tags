import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineTag } from '../src/defineTag.js'
import { revalidateMany } from '../src/revalidateMany.js'

vi.mock('next/cache', () => ({
  unstable_cacheTag: vi.fn(),
  revalidateTag: vi.fn(),
}))

describe('revalidateMany', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls revalidateTag once per key', async () => {
    const { revalidateTag } = await import('next/cache')

    await revalidateMany(['user:1', 'user:2', 'product:5:en'])

    expect(revalidateTag).toHaveBeenCalledTimes(3)
    expect(revalidateTag).toHaveBeenNthCalledWith(1, 'user:1')
    expect(revalidateTag).toHaveBeenNthCalledWith(2, 'user:2')
    expect(revalidateTag).toHaveBeenNthCalledWith(3, 'product:5:en')
  })

  it('does nothing with an empty array', async () => {
    const { revalidateTag } = await import('next/cache')

    await revalidateMany([])

    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('works with keys computed from defineTag', async () => {
    const { revalidateTag } = await import('next/cache')
    const userTag = defineTag('user', (id: string) => `user:${id}`)
    const productTag = defineTag(
      'product',
      (id: string, locale: string) => `product:${id}:${locale}`,
    )

    await revalidateMany([userTag.key('42'), productTag.key('10', 'en')])

    expect(revalidateTag).toHaveBeenCalledTimes(2)
    expect(revalidateTag).toHaveBeenCalledWith('user:42')
    expect(revalidateTag).toHaveBeenCalledWith('product:10:en')
  })
})
