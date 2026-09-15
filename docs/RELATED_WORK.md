# Related work
Selected public near neighbors inspected 2026-09-15; not an exhaustive market survey or claim of first invention.
- [LineUp.js](https://github.com/lineupjs/lineupjs): interactive multi-attribute ranking, weighted combinations and filtering. Unseen concentrates on exclusions and complete finite-menu interventions, not a general ranking visualization library.
- [DiCE](https://github.com/interpretml/DiCE): established diverse counterfactual explanation work. Unseen uses a small explicit list-selection model and reports membership changes for the entire list.
- [What-If Tool](https://pair-code.github.io/what-if-tool/learn/tutorials/counterfactual/): counterfactual point exploration. Unseen changes declared retrieval and policy controls under greedy list interactions, instead of seeking a nearby differently classified example.
- [RecSim](https://github.com/google-research/recsim): sequential recommendation simulation. Unseen intentionally makes no simulated-user or future-behavior assumptions.
## Architectural references
No source snippets, models, weights, logos or datasets from these projects are bundled.
- [twitter/the-algorithm at c54bec0](https://github.com/twitter/the-algorithm/tree/c54bec0d4e029fe34926ef3258a86ccacc0d0182): inspected default-branch head dated 2025-09-03, root COPYING uses AGPL-3.0.
- [xai-org/x-algorithm at 2d4a03c](https://github.com/xai-org/x-algorithm/tree/2d4a03c2dbfb1214571d8098077c53f4ee8a9dc1): inspected default-branch head dated 2026-09-15, root LICENSE uses Apache-2.0. Its README separates retrieval, scoring, filtering and DPP reranking and explicitly identifies omitted production material.
Unseen is independently written and MIT licensed. Its supplied recall flag, three positive weighted signals, hard author cap and greedy same-topic penalty are inspectable simplifications. It does not implement Phoenix, SimClusters, DPP, visibility labels, account analysis, or any live platform. The structural lesson is that a good score cannot bypass a separate eligibility condition.
