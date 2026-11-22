import { auth } from '@/lib/auth';
import { BILLING_ENABLED } from '@/config/constants';
import { polarClient } from '@/lib/polar';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import next from 'next';
import { headers } from 'next/headers';
import { unauthorized } from 'next/navigation';
import { cache } from 'react';

export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId: 'user_123' };
});

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async({ctx, next}) =>{
  const session = await auth.api.getSession({
    headers : await headers() ,
  });

  if(!session){
    throw new TRPCError({
      code:"UNAUTHORIZED",
      message: "unauthorized"
 
    })
  }
    return next({ctx :{ ...ctx , auth : session}});
}) ;

// Requires an active Polar subscription ("Pro").
export const premiumProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    // Free mode: every logged-in user counts as Pro.
    if (!BILLING_ENABLED) {
      return next({ ctx: { ...ctx, customer: null } });
    }

    const forbidden = new TRPCError({
      code: "FORBIDDEN",
      message: "Active subscription required",
    });

    let customer;
    try {
      customer = await polarClient.customers.getStateExternal({
        externalId: ctx.auth.user.id,
      });
    } catch (error) {
      // Users who signed up before Polar was added have no Polar customer yet.
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404) {
        throw forbidden;
      }
      throw error;
    }

    if (
      !customer.activeSubscriptions ||
      customer.activeSubscriptions.length === 0
    ) {
      throw forbidden;
    }

    return next({ ctx: { ...ctx, customer } });
  },
);