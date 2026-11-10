# v144 maintained requirements and storage decisions

This is a local, unpublished change. SAVE_V stays 16; MX1 and all existing storage keys stay unchanged. The source is a static site without a build step. Browser visual, animation/contact quality, mobile layout and audio remain unverified. VM counts are not release acceptance.

## Opening and mechanics

| Requirement | Implementation and regression |
|---|---|
| First life only when no prior lives or pending legacy; bridge choice precedes reincarnation | game.js initTitle/openNaihe/newGame; regress_storage_round7.js |
| Name, original root sampling and two rerolls remain independent of childhood; age starts at 16 without prologue months | game.js initCreate/rollLinggen, village.js; regress_village.js |
| Four childhood decisions total eight L/B/P/C points, no direct conversion to formal attributes; one chosen talent and one departure | village.js choose/qualify/apply; regress_village.js |
| Explicit action/continue, route and talent confirmation, return/reselect, pause/skip/reduced motion; physical hands/props remain grouped | village_ui.js; regress_village_ui.js (DOM/timeline adapter only) |
| I1 copper slip | book, L≥4/C≥2, craft, rope; basic skill plus one-month deciphering; first three paid study materials refunded, no refund without spending |
| I2 iron core | wood, B≥4/C≥2, craft, carry/rope; normal repair awakens owned tool; first three maintenance materials waived. No second injury effect; separate from T2/T3 pools |
| I3 bead | seed=0, pouch→school→observe→soup; ten successful basic cultivations plus ordinary objective and material; one slot only |
| I3 storage basis | core.js computes pre-gainMul base with negative penalties only. Surviving non-bottleneck basic action counts; first successful base fixes capacity, stores base/10, later reserved action releases at most its base, then recharges; no offline/retreat/death gain |
| Ordinary village work | village.js checks death/ascension after time before rewards; existing paid costs remain paid. I1/I2/I3 tests in regress_village.js |
| Old saves and version round trips | slots.js verified destination before v1 cleanup; effect authority plus mirror baselines reconciles lifecycle evidence; v143 fixtures and storage round4/5/6 suites |

## Decision contract

Display tolerance is not authorization. `Samsara.loadMeta(true)`, `peekLegacy(true)` and `bridgeOpen(true)` propagate required read/reconciliation failures. `Slots.readEffect` propagates failure to observe or persist necessary reconciliation. Mirror cleanup/ack failure after trusted authority remains retryable and does not revive consumption residue.

| Actual boundary | Behavior |
|---|---|
| initTitle btn-new first bridge read; go after asynchronous slot picker | Strict reads; error clears target/preparation and releases newLifeLock with retry toast. go rechecks open bridge and legacy before village/create routing |
| openNaihe | Strict bridge snapshot. Closed/no pending calls done without a prompt; open requires real Samsara choice API and panel. Error calls cancel/release and never done. Returned/replaced buttons cannot act on another sheet |
| Choice confirmation | chooseNaihe strictly reads; closed bridge returns current pending legacy without rewriting it. UI passes strictWrite=true so read errors inside writes and persistence failures stop confirmation. Success hides once and invokes done once; sync/async done errors prompt retry |
| Return/cancel | Only closes this sheet/releases entry lock or restores end. Does not choose, consume or clear legacy. Create-back retains chosen legacy; next title attempt skips the already-closed bridge |
| showEnd / reborn | recordLife/dismissBridge source reads strict; failed source read leaves end controls available. Failed dismissal retries without recording another life. Reborn strict precheck plus openNaihe strict recheck; second callback after S cleared is inert |
| Menu return / reset | Return only saves/routes title. Confirmed reset strictly reads before clearing the source; open bridge goes through openNaihe, closed bridge resets without prompting |
| newGame | Already-committed recovery runs first. Before preparing a nontrial candidate, strict meta must show no open bridge; strict legacy consume + Round6 sticky preparation failure guard precede createEmpty |
| No Samsara, with Slots | Reads real Slots effects, never assumed empty. Closed/no bridge and pending v1 legacy work. Open bridge cannot be chosen without Samsara and prompts retry; no role is created |
| Samsara without Slots | Its effect adapter uses actual localStorage get/set/remove; strict reads still throw. General newGame requires Slots. Menu's older no-Slots reset uses raw meta and v1 key |
| Commit and retry | Successful standard setItem is creation commit; unavailable readback retains same-slot recovery. Explicit mismatch is unverified. Precommit failure discards preparation. No destructive rollback after trusted commit |

## Explicit limits

No cross-tab CAS or cross-key transaction. chooseNaihe still writes legacy then meta; the UI detects failure but cannot roll back a partially persisted choice. The optional strictWrite flag is used by production confirmation; historical external two-argument callers retain swallowed **write** errors, while their initial read is now strict. Other noncreation metadata writes (including recordLife/dismissBridge's saveMeta) retain their existing best-effort write boundary; this work does not claim general death-record durability. A failed read in those later best-effort writes is also within that disclosed limitation, rather than an atomic end-of-life guarantee.

Same-byte rewrites without lifecycle evidence cannot be distinguished from failed-deletion residue (consumer wins). Older envelopes without mirror baselines retain bootstrap ambiguity. Forged/no-op/mismatching storage adapters do not acquire rollback guarantees. Staged Core/Folio metadata defaults are guarded by creationReadError; display-only title hints, root lean, origin unlock presentation, atlas and palette reads retain tolerance. Unrelated daily/guide/atlas mutations are not made transactional here.

## Test prerequisites and commands

Run from repository root with Node 18+ (fetch/Response and modern test harness APIs), Python 3, fontTools and its WOFF2/Brotli support. Runtime remains ES2020-compatible; test-harness syntax is not shipped to browsers. No network, absolute shared directory, installed application, browser or font source directory is needed for these commands. The two v143 fixtures under tools/fixtures/storage-v143 are real source fixtures with SHA checks, not generated approximations.

```
node tools/regress_storage_round7.js
node tools/regress_storage_round6.js
node tools/regress_storage_round5.js
node tools/regress_storage_round4.js
node tools/regress_storage_comparison.js
node tools/regress_village.js
node tools/regress_village_ui.js
node tools/regress_village_shell.js
node tools/playtest.js
node tools/regress_trial.js
node tools/regress_mingge.js
node tools/regress_xiaobi.js
node tools/regress_logs.js
node tools/regress_event_audits.js
node tools/audit_events.js
python3 tools/fonts.py audit
node --check js/game.js
node --check js/samsara.js
```

Shared review evidence is separately inventoried in round7-audit-bundle-manifest.json and ROUND7-EXECUTOR-COMPLETION.md under the review workspace. It is not required to run product tests and is excluded from the product patch. Original independent defect assertions remain immutable evidence, not product pass criteria.
