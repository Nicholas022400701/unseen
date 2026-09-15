# Security and privacy
No backend, authentication, analytics, remote assets, outgoing requests, localStorage, IndexedDB or service worker. The bundle's CSP denies connections and external resources. Imported candidate text is escaped, size-bounded and schema-checked. Unknown fields are discarded.
The self-contained bundle permits its own inline script and style. CSP is not a substitute for escaping or protection against a modified bundle, browser extension, compromised browser or operating system.
Exports contain candidate data and current policy. Reports also contain the target, traces and repairs. Review before sharing. Reload discards in-memory state; browser-level session handling and filesystem backups are outside this app's control.
Report vulnerabilities with a minimal synthetic reproduction. Never publish actual secrets or personal records in an issue.
