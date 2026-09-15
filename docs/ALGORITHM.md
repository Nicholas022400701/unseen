# Algorithm and finite action menu
## Preconditions and ranking
Call validate(raw) before the pure engine. It returns a fresh normalized scenario, discarding unknown fields. Inputs are never changed by rank, applyActions or findRepairs.
Compute base contributions for inspection, then record all independent hard blockers: recall false, age greater than the limit, or topic muted. These are parallel diagnostics, not a claim an unrecalled item reached a real filter.
For each slot, consider unblocked/unselected items below their author's cap. Effective score = base score minus topic penalty times the number of already-selected items with that topic. Select the largest effective score, resolving exact ties by case-sensitive ID code-unit order. Record the eligible ordering and penalties at each slot. Stop at K or when no candidates remain.
The final author-cap label is descriptive, not proof that removing the cap alone fixes the target. Displayed scores are rounded; comparisons use full JavaScript number precision, without epsilon ties or normalization.
## Actions
| ID | Effect | Scope |
| --- | --- | --- |
| retrieve | Recall the target | Target candidate membership |
| age | Widen maxAge to target age | Global policy |
| unmute | Remove target topic from muted | Global policy |
| cap | Set authorCap to K | Global policy |
| diversity | Set topic penalty to zero | Global policy |
| interest | Set interest weight to one | Global policy |
| quality | Set quality weight to one | Global policy |
| freshness | Set freshness weight to one | Global policy |
Only actions changing the current scenario are offered. They write distinct fields and commute. Global relaxations affect competitors too. Each subset starts from a fresh original scenario. Repairs never change K or signal values. Arbitrary continuous changes and actions outside the menu are not searched.
## Exactness
For m actions, evaluate all 2^m subsets including empty. A set succeeds iff the rerun selects the target. Keep a successful set S iff no successful strict subset T exists. Every strict subset is checked: greedy list effects need not be monotone.
Exhaustive evaluation and the strict-subset test give exact inclusion-minimality within this menu. A regression tests {a} and {a,b,c} succeeding while every pair fails; only {a} is minimal. Another checks all 65,536 four-action success truth tables against a separate oracle. Results sort by cardinality then bitmask for reproducibility, not real-world desirability.
Displaced = old selected minus new selected. Entered = new selected minus old selected. No one-to-one causal pairing is implied. Multiple items may enter or leave; a repair can simply fill a vacancy.
One ranking run costs O(K n log n); search costs O(2^m K n log n + 3^m). Limits: n <= 120, K <= 12, m <= 8. The browser yields before the search, but this bounded search runs on the main thread. Slow devices may briefly pause. This is not a large-scale evaluator.
