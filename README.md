# next-cachetags

Type-safe cache tag definitions for Next.js 15+.

## The drift problem

Next.js 15's `'use cache'` directive lets you tag cached functions with `cacheTag()` and later
invalidate those tags with `revalidateTag()`. The tag strings are free-form — which means teams
immediately start drifting:

```ts
// In a cached function:
cacheTag(`user-${id}`)   // ← hyphen

// In a server action (written by a different person, weeks later):
revalidateTag(`user:${id}`)  // ← colon. Cache never invalidates.
```

The bug is silent and hard to catch in code review. `next-cachetags` solves this by coupling
both sides to a single typed function.

## Install

```bash
npm install next-cachetags
```

**Peer dependency:** `next >= 15`

## Quickstart

```ts
// tags.ts
import { defineTag } from 'next-cachetags'

export const userTag = defineTag('user', (id: string) => `user:${id}`)
export const productTag = defineTag(
  'product',
  (id: string, locale: string) => `product:${id}:${locale}`,
)
```

```ts
// In a cached server component or function:
import { userTag } from './tags'

async function getUser(id: string) {
  'use cache'
  await userTag.apply(id)   // calls unstable_cacheTag('user:<id>')
  return db.users.findFirst({ where: { id } })
}
```

```ts
// In a server action:
'use server'
import { userTag } from './tags'

export async function updateUser(id: string, data: UpdateUser) {
  await db.users.update({ where: { id }, data })
  await userTag.revalidate(id)  // calls revalidateTag('user:<id>')
}
```

Both sides call the same typed function. No string drift possible.

## API

### `defineTag(name, keyFn)`

Returns a `Tag<Args>` object where `Args` is inferred from `keyFn`.

```ts
type Tag<Args extends unknown[]> = {
  key: (...args: Args) => string           // compute the tag string
  apply: (...args: Args) => Promise<void>  // call unstable_cacheTag()
  revalidate: (...args: Args) => Promise<void>  // call revalidateTag()
}
```

- **`key(...args)`** — pure function, returns the tag string. Useful for computing keys to pass to
  `revalidateMany`.
- **`apply(...args)`** — calls `unstable_cacheTag()` from `next/cache`. Use inside a `'use cache'`
  function.
- **`revalidate(...args)`** — calls `revalidateTag()` from `next/cache`. Use in server actions or
  route handlers.

### `revalidateMany(keys)`

Batch-invalidate multiple tags in one call.

```ts
import { revalidateMany } from 'next-cachetags'
import { userTag, productTag } from './tags'

await revalidateMany([
  userTag.key(userId),
  productTag.key(productId, locale),
])
```

## Recipes

### Composable tags

```ts
// Namespace all order-related tags under a single prefix:
const orderBase = defineTag('order', (id: string) => `order:${id}`)
const orderItemTag = defineTag('order-item', (orderId: string, itemId: string) =>
  `${orderBase.key(orderId)}:item:${itemId}`,
)
```

### Multi-arg tags

```ts
const translationTag = defineTag(
  'translation',
  (namespace: string, locale: string) => `t:${namespace}:${locale}`,
)

// In a cached function:
await translationTag.apply('checkout', 'fr')

// In an action:
await translationTag.revalidate('checkout', 'fr')
```

### Batch revalidation after a bulk update

```ts
import { revalidateMany } from 'next-cachetags'
import { userTag } from './tags'

export async function deleteUsers(ids: string[]) {
  await db.users.deleteMany({ where: { id: { in: ids } } })
  await revalidateMany(ids.map(userTag.key))
}
```

## Why this exists

Next.js gives you the `'use cache'` + `cacheTag()` + `revalidateTag()` primitives, but it doesn't
prevent you from getting the tag string wrong. In a large codebase with many contributors, the
tag convention (separator character, argument order, prefix) lives only in people's heads — until
it doesn't. This package is the missing codification layer: one declaration, both sides typed.

## A note on `unstable_cacheTag`

In Next.js 15.x, the public export from `next/cache` is named `unstable_cacheTag` (not `cacheTag`).
This library calls `unstable_cacheTag` internally. When Next.js stabilizes the API, only the
import name will change — your call sites using `next-cachetags` won't need to change at all.

## License

MIT
