/* eslint-disable */

import type * as achievements from "../achievements.js";
import type * as auth from "../auth.js";
import type * as beverages from "../beverages.js";
import type * as bottles from "../bottles.js";
import type * as drinks from "../drinks.js";
import type * as social from "../social.js";
import type * as stats from "../stats.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  auth: typeof auth;
  beverages: typeof beverages;
  bottles: typeof bottles;
  drinks: typeof drinks;
  social: typeof social;
  stats: typeof stats;
}>;

export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
