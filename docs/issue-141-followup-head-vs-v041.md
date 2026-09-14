# Follow-up measurement: current HEAD vs tagged v0.4.1 (issue #141)

**Status: directional / insufficient for the merge gate defined in comment [5518416233](https://github.com/ribbons-digital/pi-advisor/issues/141#issuecomment-5518416233) (the maintainer's bar). Do not treat the numbers below as a pass.** Posted at [5660636070](https://github.com/ribbons-digital/pi-advisor/issues/141#issuecomment-5660636070).

Date: 2026-09-14. Protocol: `accuracy-experiment-v1`. **Full-corpus live run, 5 repeats per case per arm** (360 reviews).

Bar vs this run:

| Gate | Bar | This run |
| Independent finding cases | 30 | **9** `toolresult` item groups; finding and silence share the same 9 source sessions |
| Independent silence cases | 30 | **9** `clean` item groups |
| Reps per case per configuration | ≥5 | **5** (met) |
| History-only finding recall | +10pp vs a baseline that still scores the same cases as **finding** (miss if truncated away) | **not measured** — this corpus is arm-fair, so v0.4.1 tail rows are `expected=silence` and have no recall denominator |
| Visible-window recall / FP CIs | 95% paired, must sit inside the recorded margins | visible recall **+35.6pp** and tokens **+7.9%** pass; **FP CI upper bound +6.7pp exceeds ±5pp**; floors unmet anyway |

`+35.6pp` toolresult recall is a real paired gain on this corpus, but 9 sessions is still far below the 30+30 floor. Tail 8/45 and reasoning 6/45 are **retention/render diagnostics**, not a history-only recall delta.

## What was compared

Both sides used the **live** User WATCHDOG instructions and `run-accuracy.ts --prompt-variant prod`, with the model and thinking level held fixed.

| | Current HEAD | Tagged v0.4.1 |
| Tree | `8a64c6a` (`main` at run time) | `362e212` (`v0.4.1`, detached worktree at `/tmp/pi-advisor-v041-src`) |
| Render | `includeReasoning: false` (`PI_ADVISOR_NO_REASONING` default on) | always-reasoning (`renderAdvisorDelta` is 2-arg; extra `{includeReasoning}` is ignored) |
| Prompt | production `buildAdvisorSystemPrompt` (5266 chars with live instructions; includes later scoped + coverage / posind text) | v0.4.1 production prompt (3744 chars with the **same** live instructions) |
| Harness | HEAD `scripts/f9-experiment` (identical file copied into the worktree; only `src/` differs) | same harness; `src/` stays v0.4.1 |
| Arm spent | `--arms new` only | `--arms old` only |

v0.4.1's `new` arm is **not** a no-reasoning sample. Spending both arms there would double cost for an identical always-reasoning render.

## Corpus and identity

- Corpus: gitignored `docs/internal/accuracy-corpus.jsonl` — 36 items = 9 source cuts × 4 injection zones (`clean`, `reasoning`, `toolresult`, `tail`). Signature: `INJECTED_DEFECT_audit_v7_downgrade_14_203_rows_no_backup`.
- Scoring is arm-fair: finding iff that arm's **rendered** window contains the signature.
- `datasetHash` `9e7b6a8a7a1fd06c` (identical on both files). `budgetTokens` 20000. `protocol` `accuracy-experiment-v1`.
- Model: `ollama-cloud/deepseek-v4.1-flash`; provider-reported `deepseek-v4.1-flash` on **all 360** rows; `thinkingLevel: "off"`.
- Repeats: 5 per (item, arm). Zero run errors; all 360 rows usable.
- Content-free notes: 1 of 360 (HEAD). Raw and cleaned rates agree, so junk notes are not a confound in this pair.

| Artifact                                           | SHA-256                                                            | promptHash         | harnessHash        | sourceCommit   |
| -------------------------------------------------- | ------------------------------------------------------------------ | ------------------ | ------------------ | -------------- |
| `docs/internal/accuracy-ab-head-ollama-full.jsonl` | `8fcfb378d53b10ca86d69e6af52d75e59744528ae44b974c41f43450603a81a7` | `e672f18480c03c20` | `3b92c6293b0e51fb` | `8a64c6a9356a` |
| `docs/internal/accuracy-ab-v041-ollama-full.jsonl` | `7a18991c6216b5e06b086c20e3383a3651ff8ecc19c47b7783124589e3a91c82` | `a9706d4769deb99e` | `bb1f392471716012` | `362e21252746` |

Raw jsonl stays gitignored (real-session derivatives). Tracked copies of this note, the machine summary [issue-141-followup-head-vs-v041.summary.json](issue-141-followup-head-vs-v041.summary.json), and the integration index [accuracy-cost-index.md](accuracy-cost-index.md) live under `docs/`.

## Paired results (cluster bootstrap over 9 cuts, seed 20260914, 4000 iters)

**Common strata only** (same visible content on both trees):

| Stratum                                   | HEAD          | v0.4.1        | Δ HEAD−v0.4.1 (95% CI)                                       |
| ----------------------------------------- | ------------- | ------------- | ------------------------------------------------------------ |
| **Visible finding (`toolresult`) recall** | 36/45 = 80.0% | 20/45 = 44.4% | **+35.6pp [+15.6, +53.3]** (McNemar exact p = 0.070)         |
| **Silence (`clean`) FP**                  | 45/45 = 100%  | 44/45 = 97.8% | **+2.2pp [0.0, +6.7]** (interval reaches past the ±5pp band) |

The clean-silence stratum is effectively **saturated** on both trees (≈98–100% of clean items draw a note), so it carries almost no discriminating power; it is a false-alarm _ceiling_, not a quietness score.

**Arm-specific visibility — diagnostic only; not #141 history-only recall:**

Scoring is finding iff **that arm's rendered window** contains the signature. v0.4.1 tail rows are therefore `expected=silence` (no miss if it stays quiet). HEAD reasoning rows are `expected=silence` (thinking stripped). These strata have no paired recall delta.

| Stratum                                                                      | HEAD                                                     | v0.4.1                                                   |
| ---------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| **`tail` retention diagnostic** — marker kept only after stripping reasoning | detection **8/45 = 17.8%** among windows that contain it | marker not in window; spoke on 45/45                     |
| **`reasoning` render diagnostic** — marker only in thinking blocks           | inject stripped; spoke on 44/45                          | detection **6/45 = 13.3%** among windows that contain it |

To measure the #141 history-only **recall** gate, rebuild cases that are labeled finding for **both** arms (old arm miss when truncated), from separate sessions, ≥5 reps, with a paired CI. This run did not do that.

## Cost

Provider-reported `costUsd` is non-zero for this model and matches the ollama-cloud list rates.

| Metric                           | HEAD                         | v0.4.1                       | Δ                      |
| -------------------------------- | ---------------------------- | ---------------------------- | ---------------------- |
| Σ tokens (180 reviews)           | 4,592,979                    | 4,261,143                    | +7.8%                  |
| Mean tokens per review           | 25,517                       | 23,673                       | **+7.9% [+6.8, +9.0]** |
| Uncached input / cached / output | 928,164 / 3,592,996 / 71,819 | 838,933 / 3,365,400 / 56,810 | —                      |
| Cache share                      | 78.2%                        | 79.0%                        | —                      |
| Run cost (list price)            | $0.386                       | $0.340                       | +13.6%                 |

HEAD's +7.9% token delta is inside the bar's +10% budget gate, but it is a real cost increase, not flat: the no-reasoning render frees bytes that the retained entries and the longer notes consume.
