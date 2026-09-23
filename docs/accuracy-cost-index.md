# Accuracy and cost measurement index

Tracked index of Advisor accuracy/cost runs for issue #141 (HEAD vs v0.4.1, prompt A/Bs). Aggregates only — no session text. Raw jsonl stays gitignored under `docs/internal/` because it derives from real sessions.

- Write-up (gate-safe wording, posted to the issue): [issue-141-followup-head-vs-v041.md](issue-141-followup-head-vs-v041.md)
- Machine summary: [issue-141-followup-head-vs-v041.summary.json](issue-141-followup-head-vs-v041.summary.json)
- Paired analyzer output: `docs/internal/accuracy-ab-head-vs-v041-ollama-full.analysis.md`

---

## Status (do not skip)

**Directional / insufficient for the #141 merge gate.** The bar is defined in comment [5518416233](https://github.com/ribbons-digital/pi-advisor/issues/141#issuecomment-5518416233); our status write-up is posted at [5660636070](https://github.com/ribbons-digital/pi-advisor/issues/141#issuecomment-5660636070).

| Gate                        | Bar                                                        | 2026-09-14 run (36 items × 5 reps)                                                                  |
| --------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Independent finding cases   | 30, separate sessions from silence                         | 9 `toolresult` groups / 9 shared sessions                                                           |
| Independent silence cases   | 30, separate sessions                                      | 9 `clean` groups / same 9 sessions                                                                  |
| Reps                        | ≥5                                                         | **5 (met)**                                                                                         |
| History-only finding recall | +10pp; **both** arms labeled finding; truncated arm = miss | **not measured** (arm-fair tail is `expected=silence`)                                              |
| Visible recall              | 95% paired CI inside the margin                            | **+35.6pp [+15.6, +53.3] (pass)**                                                                   |
| False positives             | within ±5pp                                                | raw +2.2pp [0.0, +6.7]; delivered +0.0pp [−6.7, +6.7] — upper bound exceeds +5pp either way (unmet) |
| Tokens                      | within +10%                                                | **+7.9% [6.8, 9.0] (pass)**                                                                         |

Do not net `expected=finding` across arms. Pair only `toolresult` recall and `clean` FP; `tail` / `reasoning` are visibility diagnostics.

---

## 2026-09-14 canonical run: HEAD vs v0.4.1

Design, per-variant rates, paired intervals and the full SHA-256s are in [the write-up](issue-141-followup-head-vs-v041.md). Identity needed to verify or reproduce a row:

Shared: `protocol=accuracy-experiment-v1`, `datasetHash=9e7b6a8a7a1fd06c`, `budgetTokens=20000`, configured model `ollama-cloud/deepseek-v4.1-flash`, response `deepseek-v4.1-flash` on all 360 rows, `thinkingLevel: off`, 0 run errors.

The recorded `harnessHash` fingerprints the harness sources **at run time**. The HEAD half ran with an uncommitted one-arg `registerProvider` adapter that was later re-landed lint-clean in `scripts/f9-experiment/harness.ts`, so recomputing it from a later tree yields a different value. That code path was not executed in this pair (no provider extension was loaded), so it does not change these numbers; a resume simply will not match and will re-run.

| File (gitignored)                                  | n   | promptHash         | harnessHash        | sourceCommit   |
| -------------------------------------------------- | --- | ------------------ | ------------------ | -------------- |
| `docs/internal/accuracy-ab-head-ollama-full.jsonl` | 180 | `e672f18480c03c20` | `3b92c6293b0e51fb` | `8a64c6a9356a` |
| `docs/internal/accuracy-ab-v041-ollama-full.jsonl` | 180 | `a9706d4769deb99e` | `bb1f392471716012` | `362e21252746` |

| Metric                     | HEAD    | v0.4.1  | Δ                      |
| -------------------------- | ------- | ------- | ---------------------- |
| Mean tokens per review     | 25,517  | 23,673  | **+7.9% [+6.8, +9.0]** |
| Cache share                | 78.2%   | 79.0%   | —                      |
| Provider USD (180 reviews) | $0.3862 | $0.3400 | +13.6%                 |
| Content-free notes         | 1       | 0       | —                      |

Provider `costUsd` is populated for ollama-cloud and matches the list rates (input $0.30 / cache-read $0.006 / output $1.20 per 1M). `commandcode-goat` reports $0 and needs an estimate instead.

### Junk-note suppression (weak-model evidence, still in force)

Whole-note placeholders (`placeholder`, `placeholder2`, `y`, `probe (will not be emitted)`, `占位（不应被采纳，用于对照观察）。`) are dropped at advise-execution time by `isContentFreeAdvice`.

- Live probe (12 reviews, `commandcode-goat`): the model emitted 4 placeholder notes; `createAdviseTool` suppressed all 4. One delivered note was `x`, deliberately not in the placeholder list.
- Historical replay: the 16 junk notes already recorded on `accuracy-ab-head-prod-full.jsonl` were replayed through the same executor — 16/16 suppressed. Not a second live run.

`ollama-cloud/deepseek-v4.1-flash` produced 1 content-free note (HEAD `ctx-06-clean` rep 1) in 360 reviews. That single note sits on the paired silence stratum, so this run must be read in both views: raw silence FP `+2.2pp [0.0, +6.7]` and delivered `+0.0pp [−6.7, +6.7]` (upper bound +6.7pp either way). Raw is the default; add `--junk-notes clean` to `analyze-accuracy-paired.ts` for the delivered view, which is what a user actually sees.

```bash
bun scripts/f9-experiment/analyze-accuracy-paired.ts --in docs/internal/accuracy-ab-head-vs-v041-ollama-full.jsonl --junk-notes clean
```

---

## Related local artifacts (`docs/internal/`, gitignored)

| File                                                                                                                                        | What it is                                                                                              | Use                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `accuracy-ab-head-ollama-full.jsonl`, `accuracy-ab-v041-ollama-full.jsonl`                                                                  | canonical 180-row halves of the 2026-09-14 run                                                          | current #141 evidence                               |
| `accuracy-ab-head-vs-v041-ollama-full.jsonl`, `.analysis.md`, `.analysis.cleaned.md`                                                        | combined 360 rows + the paired analyzer output (raw and `--junk-notes clean`)                           | reproduce the 5-rep numbers                         |
| `clean-note-adjudication.jsonl`, `accuracy-ab-luna-prod-pilot.jsonl`                                                                        | 24-row luna/flash silence-note labels (`true_issue` / `silence` / `true_but_out_of_scope` / `nonsense`) | why corpus clean FP is not production quietness     |
| `accuracy-ab-scoped.jsonl`, `accuracy-ab-lean.jsonl`, `accuracy-ab-tuned.jsonl`, `accuracy-ab-posind.jsonl`, `accuracy-ab-posind-ccg.jsonl` | prompt A/Bs behind the adopted scope + coverage rules (`lean` falsified, `tuned` not adopted)           | prompt-adoption evidence                            |
| `accuracy-ab-ds41.jsonl`, `accuracy-ab-v041.jsonl`                                                                                          | pre-adoption 360-row runs on the frozen baseline prompt                                                 | historical only; do not mix with the canonical pair |
| `accuracy-ab-{head,v041}-prod-{pilot,full}.jsonl`                                                                                           | superseded 1- and 3-repeat `commandcode-goat` runs                                                      | provenance only                                     |
| `accuracy-corpus.jsonl`                                                                                                                     | injection corpus, 36 items = 9 cuts × 4 zones                                                           | shared `datasetHash` 9e7b6a8a7a1fd06c               |

Related tracked note: [f9-evaluation.md](f9-evaluation.md) (F9 tiered prompt, 2026-08).
