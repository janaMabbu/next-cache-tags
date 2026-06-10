/**
 * Revalidate multiple cache tag keys in a single call.
 *
 * @param keys - An array of pre-computed tag strings to revalidate.
 *
 * @example
 * import { userTag, productTag } from './tags'
 *
 * await revalidateMany([
 *   userTag.key(userId),
 *   productTag.key(productId, locale),
 * ])
 */
export async function revalidateMany(keys: string[]): Promise<void> {
  // Cast via `unknown` to the single-arg signature we intend to call.
  // `revalidateTag` gained a required `profile` arg in Next 16 types;
  // the single-arg form still works at runtime (with a deprecation notice).
  const mod = (await import('next/cache')) as unknown as {
    revalidateTag: (tag: string) => void
  }
  for (const key of keys) {
    mod.revalidateTag(key)
  }
}
