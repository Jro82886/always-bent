import { flags } from "@/lib/featureFlags";
export function useFlag<K extends keyof typeof flags>(k: K) { return flags[k]; }


