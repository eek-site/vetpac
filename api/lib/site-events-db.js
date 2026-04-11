// Backwards-compat re-export — API files that imported getServiceSupabase()
// are being migrated to use `prisma` directly. This file keeps them working
// during the transition, but new code should import from ./prisma.js directly.
export { prisma as db } from './prisma.js'
