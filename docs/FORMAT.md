# Schema 1
Start with [the full example](../examples/quiet-breakthrough.json).
| Field | Required value |
| --- | --- |
| schema | Integer 1 |
| name | Nonblank text, max 80 characters |
| items | 1–120 objects |
| item.id | Unique nonblank string, max 60 characters |
| item.title | Nonblank string, max 160 characters |
| item.author, item.topic | Nonblank string, max 60, case-sensitive |
| item.retrieved | Boolean, not a string |
| item.age | Finite number of hours, 0–87600 |
| item.signals.interest, quality, freshness | Finite supplied numbers, each 0–1 |
| policy.k, authorCap | Integers 1–12 |
| policy.maxAge | Finite hours, 0–87600; boundary inclusive |
| policy.diversity | Finite number 0–1 |
| policy.weights.interest, quality, freshness | Finite numbers 0–1; need not sum to 1 |
| policy.muted | Up to 120 nonblank topic strings, max 60 characters each |
File limit: 256 KiB. Missing fields, duplicates, invalid types or bounds reject the entire import and preserve the current scenario. Numeric strings are not coerced. Unknown fields are discarded. Duplicate mutes are deduplicated; identifier whitespace remains significant. No CSV, automatic scoring, URL resolution, timestamp conversion or case folding is performed.
Age and freshness are independent inputs. Signals can represent a supplied rubric or model output; demos are fictional, not calibrated against human behavior.
## Export
Scenario JSON saves normalized input and current policy and can be re-imported. Report JSON (format unseen-report, version 1.0.0) includes scenario, target, ranking, slot traces and every minimal repair. The interface shows up to 12 repair cards; the report includes all. A report is not directly importable: extract its scenario field to replay.
Both files contain candidate data. There is no anonymous report or share link. Review before sharing.
