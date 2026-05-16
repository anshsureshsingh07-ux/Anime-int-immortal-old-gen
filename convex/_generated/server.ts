import {
  queryGeneric as rawQuery,
  mutationGeneric as rawMutation,
  actionGeneric as rawAction,
  internalQueryGeneric as rawInternalQuery,
  internalMutationGeneric as rawInternalMutation,
  internalActionGeneric as rawInternalAction,
} from "convex/server";

export const query: any = rawQuery;
export const mutation: any = rawMutation;
export const action: any = rawAction;
export const internalQuery: any = rawInternalQuery;
export const internalMutation: any = rawInternalMutation;
export const internalAction: any = rawInternalAction;
