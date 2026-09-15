# unseen.
### Every ranking has a blind side.
**A local-first why-not debugger for ranked lists.** Pick an item that was left out, inspect its blockers, find inclusion-minimal combinations of changes that admit it, and see who leaves the list.
No account. No API key. No model download. No uploads. One self-contained HTML file.
## Try it in 30 seconds
1. Download this repository as a ZIP and extract it.
2. Open **dist/index.html** in a modern browser. No installation or server required.
3. The opening item, **“Listening to the soil after rain”**, has a good score but two blockers. Click **Find minimal repairs**.
4. Apply **Recall this candidate + Extend age limit**. Compare the lists, then Undo.
The three bundled scenarios are synthetic. Import your own [schema-1 JSON](examples/quiet-breakthrough.json), up to 120 items / 256 KiB. Export a scenario to save your work; a report additionally includes the trace and every minimal repair set.
## What it is for
- Editorial shortlists: understand exclusions and the other items affected by a policy change.
- Recommendation prototypes: distinguish recall, filters, base scores and list-level effects.
- Teaching: construct counterexamples where a higher score does not guarantee selection or multiple changes are needed together.
Bring a small candidate set and signals you already have. This is not a production recommender, score predictor, fairness certificate, or a way to diagnose your account on a social platform.
## The unusual part
The output is not another ranking: it is the **smallest sufficient sets of declared interventions**, with the resulting membership changes.
The engine independently reruns every subset of at most 8 actions (at most 256 combinations), then checks **every strict subset** of every success. Greedy list interactions need not be monotone, so checking only one-action removals would be wrong.
“Minimal” means no successful proper subset. It does not mean fewest actions, lowest cost, guaranteed stable admission, or best among all possible policies. Zero changes means already selected. No repair means only that this finite menu did not work.
## The model
```text
supplied candidates → recall flag → age + topic checks
                    → weighted signals → greedy constrained selection
```
Base score is the sum of interest, quality and freshness, each multiplied by its weight. Each slot subtracts the topic penalty once per already-selected item of the same topic; authors at their cap are unavailable. Exact ties use ascending case-sensitive ID code-unit order. Negative effective scores may still be selected: there is no hidden score floor.
Age and freshness are independent supplied values. Base scores for blocked candidates are diagnostic only: they never bypass a hard filter. No clock, randomness, network service or learned behavior affects the ranking.
## Build and test
Node.js 20+. The engine, build and unit tests use only the standard library.
```sh
npm test
npm run build
# Optional browser testing dependency:
npm install --no-save playwright@1.63.0
npx playwright install chromium
npm run test:browser
# Or: CHROME_PATH=/path/to/chromium npm run test:browser
```
The deterministic build writes dist/index.html and the example JSON. Browser checks cover real file downloads, roundtrips, hostile input, invalid imports, offline solving, undo, mobile layouts and the precision / stale-search regressions. Screenshots go to ignored qa/.
## Files
- src/engine.js: pure ranking, validation, exhaustive repairs and reports.
- src/app.js: browser interaction and escaped rendering.
- src/fixtures.js: explicit synthetic scenarios.
- src/style.css and src/index.html: responsive light/dark interface.
- scripts/build.mjs: dependency-free single-file builder.
- tests/engine.test.js: unit and exhaustive cross-checks.
- scripts/browser.mjs: browser interaction and privacy regression tests.
- dist/index.html: ready-to-open application.
## Privacy and provenance
No backend, telemetry, account connection, external assets or persistent storage. A content security policy denies outbound connections. Imported text is escaped and bounded; unknown fields are dropped. Data stays in memory until reload. **Exports include your candidate data: review before sharing.** Hostile browser extensions and compromised hosts are outside the app's control.
Independent implementation, MIT licensed. Public recommender architectures informed stage separation; no upstream code, weights or models are bundled. This is not Phoenix, SimClusters, DPP, or a replica of X. Ranking exploration and counterfactual explanations already have substantial prior work: [concrete distinctions](docs/RELATED_WORK.md). No first-invention claim is made.
[Algorithm](docs/ALGORITHM.md) · [Input format](docs/FORMAT.md) · [Security](SECURITY.md) · [License](LICENSE)
