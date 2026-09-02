/**
 * Advisor context feature flags.
 *
 * Flags are environment variables rather than WATCHDOG.yml policy on purpose:
 * they change how Advisor interprets Executor context, not what the user
 * asked Advisor to review, and they exist so an experience can be measured
 * and rolled back without a configuration migration. The two context
 * features below default to ON; set the flag to `0` to explicitly opt out.
 */

/**
 * No-reasoning context feature: on by default; `PI_ADVISOR_NO_REASONING=0` opts out.
 *
 * Executor reasoning ("thinking") blocks are excluded from the bounded
 * Advisor context windows — per-update deltas and lifecycle/config re-prime
 * snapshots alike. The freed byte budget admits ~58% more Executor history
 * under the same token ceiling (context-composition experiment,
 * docs/internal/context-evaluation.md, 2026-09-02, appendices 1-6);
 * truncating turns cost +10.6% tokens from denser refill, while
 * non-truncating turns spend ~28% fewer input tokens. Set to `0` to restore
 * reasoning blocks in rendered context.
 */
export const NO_REASONING_FLAG = "PI_ADVISOR_NO_REASONING";

export function isNoReasoningRenderEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
	return environment[NO_REASONING_FLAG] !== "0";
}

/**
 * Old-turn history compression: on by default; `PI_ADVISOR_HISTORY_COMPRESSION=0` opts out.
 *
 * Deterministic pi-vcc-style compression of the advisor nested session
 * (`src/history-compaction.ts`): review cycles older than the most recent one
 * are replaced by a bounded summary block (advise outcomes with findingKey,
 * unresolved error-register lines, breadcrumbs preserved). Fires in
 * `maintainContextPolicy` before the LLM compactor — it replaces the LLM
 * compaction reset (same one-time cache miss, minus the LLM call and its
 * nondeterminism) and roughly halves nested-session growth. Between
 * compressions the session stays append-only, so the prefix cache
 * re-accumulates; a cooldown (`context.historyCompressionCooldownTurns`, default 3)
 * defers the rewrite for later over-limit turns within the margin so the cache is
 * not re-broken every turn. Measured: turn-4 prompt 41–52% of full history with no
 * accuracy cost (docs/internal/context-evaluation.md, appendix 11).
 */
export const HISTORY_COMPRESSION_FLAG = "PI_ADVISOR_HISTORY_COMPRESSION";

export function isHistoryCompressionEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
	return environment[HISTORY_COMPRESSION_FLAG] !== "0";
}
