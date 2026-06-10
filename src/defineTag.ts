import type { Tag } from './types.js'

/**
 * Define a typed cache tag with a key-builder function.
 *
 * @param _name - A human-readable label for the tag (reserved for future tooling).
 * @param keyFn - A function that computes the tag string from typed arguments.
 * @returns A `Tag` object with `key`, `apply`, and `revalidate` methods.
 *
 * @example
 * const userTag = defineTag('user', (id: string) => `user:${id}`)
 *
 * // In a cached function:
 * async function getUser(id: string) {
 *   'use cache'
 *   await userTag.apply(id)
 *   return db.users.findFirst({ where: { id } })
 * }
 *
 * // In a server action:
 * await userTag.revalidate(id)
 */
export function defineTag<Args extends unknown[]>(
  _name: string,
  keyFn: (...args: Args) => string,
): Tag<Args> {
  return {
    key: keyFn,

    async apply(...args) {
      // Cast via `unknown` to the subset of next/cache we rely on.
      // Covers both the stable `cacheTag` (Next ≥ 16) and the legacy
      // `unstable_cacheTag` alias (Next 15).
      const mod = (await import('next/cache')) as unknown as {
        unstable_cacheTag: (...tags: string[]) => void
      }
      mod.unstable_cacheTag(keyFn(...args))
    },

    async revalidate(...args) {
      // `revalidateTag` gained a required `profile` arg in Next 16 types;
      // the single-arg form still works at runtime (with a deprecation notice).
      // Cast via `unknown` to the single-arg signature we intend to call.
      const mod = (await import('next/cache')) as unknown as {
        revalidateTag: (tag: string) => void
      }
      mod.revalidateTag(keyFn(...args))
    },
  }
}
