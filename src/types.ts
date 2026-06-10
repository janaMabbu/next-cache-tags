export type Tag<Args extends unknown[]> = {
  /**
   * Compute the full cache tag string from the given arguments.
   */
  key: (...args: Args) => string

  /**
   * Call `unstable_cacheTag()` from `next/cache` with the computed key.
   * Returns a Promise because `next/cache` is lazily imported at call time.
   */
  apply: (...args: Args) => Promise<void>

  /**
   * Call `revalidateTag()` from `next/cache` with the computed key.
   * Returns a Promise because `next/cache` is lazily imported at call time.
   */
  revalidate: (...args: Args) => Promise<void>
}
