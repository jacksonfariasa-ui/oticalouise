# Performance audit — 11 November 2026

## Reported error
Neither `src/pages/Index.tsx` nor `runAttachedTask` exists in this checkout. The homepage is `src/routes/_authenticated/index.tsx`. No invented global declaration was added: declaring an absent function would hide a type error without providing its implementation. The current application compiles and authenticated navigation produced no page errors.

## Baseline from real visitors
Last seven days, collapsed to one reading per metric series on `/`:

| Metric | Readings | p75 | Good threshold |
|---|---:|---:|---:|
| FCP | 7 | 5.476 s | ≤1.8 s |
| LCP | 7 | 5.732 s | ≤2.5 s |
| INP | 8 | 258 ms | ≤200 ms |
| CLS | 8 | 0.0236 | ≤0.1 |

There are fewer than 30 readings per metric: insufficient data to classify the page reliably or claim a production improvement. FCP and LCP are close, suggesting initial delivery/startup rather than an isolated late image. These are pre-change values, not after-change results.

## Prioritized findings and changes

1. **List persistence and navigation:** page-local timers canceled unsaved changes on navigation, reads ignored errors, and every revisit fetched again. Shared Query loaders/cache now prevent empty editable flashes; key-scoped writes survive page unmount and serialize local edits. Failed writes display a notice and roll back the current optimistic snapshot.
2. **Overbroad requests:** sale catalog and reports fetched every saved dataset. They now request only their five catalog keys or six report keys. Customer reads project only displayed fields; customers and sale selection share a query.
3. **Editable lens rendering:** 404 rows meant roughly 2,828 editable inputs mounted together. Fifty rows render per page; search, totals, import and export still operate on the complete dataset. Sale selection, products, clients and generic modules also have bounded rendering.
4. **Polling:** reports and activities used independent fixed intervals. Query now deduplicates fetches, retains unchanged data, and does not poll in background tabs; existing 15-second refresh and manual report refresh remain.
5. **Auth:** initial session and sign-in events could duplicate role/profile requests or install obsolete results. User-scoped deduplication and request-generation guards prevent those races. The server-validated route gate and permissions remain intact.
6. **Branch synchronization:** fetching metadata could trigger manual-data saves and repeated emissions. Remote metadata now applies in one read-only batch; branch loads deduplicate in-flight work and repeated nearby mounts. The small synchronizer is separate from the editor.
7. **Heavy optional code:** document parsers and OCR imports are deferred until import/photo actions; report rendering is deferred on non-report module pages. Removed unused dashboard chart/data imports. Existing automatic route splitting and dynamic PDF worker loading remain.
8. **Resource lifecycle:** image bitmaps close after conversion, PDF loading tasks/pages clean up, company-image object URLs release on failure, prescription URLs release when the sale page closes. URLs referenced by in-session documents are retained until page exit.
9. **Navigation:** enabled intent preloading; corrected both fiscal link and active state to point at the implemented fiscal page.
10. **Visual performance:** unchanged design; added reduced-motion handling and font-host preconnection. The 6 KB logo was not recompressed; PWA icons were retained.

## Verification

- 38 automated tests passed, including serial writes, save after unmount, read errors, bounded catalog/report keys, and reaching the final four of 404 lens rows.
- Authenticated desktop navigation: products → lenses → sale → customers → products. Five transitions used four saved-data reads and one customer read; revisiting products used the cache.
- Observed local SPA readiness: 861, 868, 378, 236 and 262 ms respectively. These are single development runs, not production benchmarks or before/after speedup claims.
- Created a temporary product, confirmed its save, selected it in a sale with price R$123, reloaded the product page and read it back, then deleted it. No sale/invoice was issued.
- Lens next-page and filtered export verified: 102 matching records exported despite 50 rendered rows.
- Fiscal navigation reached `/notas-fiscais`; reports displayed existing all-time sales and team activity.
- Mobile 390×844: document width 390, no page-level horizontal overflow. Desktop and mobile screenshots inspected; no page errors.
- Harness reported `build OK` after resolving transform/type issues.

## Deliberately not changed / remaining architecture limits

- Shared JSON arrays still transfer complete individual lists and have cross-user last-writer-wins risks. Local write serialization does not make multi-user writes atomic. Normalized records/revision control and transaction-backed idempotent sale distribution require a dedicated data migration; no schema or business workflow was changed here.
- Branch module state and remote manual-data reconciliation need an identity-scoped store redesign; the limited read-only metadata and deduplication fixes are not a complete rewrite.
- Fiscal/customer history pagination and server aggregates remain candidates for larger volumes; fiscal limits were not changed because truncating reads differently could change totals.
- Installed UI dependencies are largely unused tree-shaken wrappers; removal without production reachability measurements was not justified. No claimed bundle-size reduction or Lighthouse score: production bundle/lab measurement was not available in this pass.
- No compute upgrade recommended: no evidence established compute saturation. No paid OCR/provider calls or real invoice operations were triggered.

Applied skill: `otimizar-performance`.