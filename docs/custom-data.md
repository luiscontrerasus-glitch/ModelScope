# Custom data · Milestone 3

Choose **Analyze your data** in the experiment selector. The four built-in demonstrations remain available. The custom workflow is data → variables → model → review → analysis, with a compact configuration page followed by the same editable table, linked response/residual plots, findings, candidate profile and JSON export.

## Accepted input

- **CSV file:** local file picker, `.csv`, comma-separated, named headers required. Quoted commas, escaped quotes, multiline quoted cells, CRLF and UTF-8 BOM are supported.
- **Paste:** CSV or tab-separated text, including headers. Papa Parse detects comma/tab; an inconclusive guess is retried only with a delimiter that separates the parsed header record.
- **Manual:** empty X/Y table with add, delete, edit and clear controls. Tab navigates native numeric inputs; adding focuses the new X cell and deleting moves focus to a surviving row or Add row. IDs are not recycled during that input session.

Limits: 1 MiB, 500 data records, 32 source columns. Invalid oversized sources are blocked, not silently truncated into accepted data. The preview displays up to those limits. No XLSX/PDF, remote URLs, locale-formatted decimals, formulas or spreadsheet editing engine are supported. Use decimal numbers with optional signs/exponents, such as `-2.5` or `1.2e-3`. Commas inside numeric values are not interpreted as thousands separators. Text columns may remain unmapped.

Headers must be named and distinct after trimming/case folding. Original header/cell strings remain in the export; trimmed names are used for mapping. A final newline is a line terminator, not an extra measurement. Interior completely blank records are displayed and require explicit confirmation to exclude; their IDs and original cells remain exported. Partially blank meaningful records cannot be excluded this way. Width mismatches, malformed quotes, missing/nonnumeric mapped cells and incompatible numbers block analysis with record/row context.

## Mapping and units

Select different independent X and dependent Y columns. Numeric-looking columns are identified, not silently selected. Confirm variable names and choose one of:

- **No unit specified:** the quantity's units are unknown, displayed/exported as unspecified.
- **Unitless quantity:** explicitly dimensionless, represented by 1.
- **Known unit label:** user-entered text, such as °C or V.

Labels do not change numbers. No automatic scaling, SI-prefix interpretation, unit guessing or dimensional analysis is implemented. If you rescale externally, document the new labels and rescale the response reference scale consistently. A slope's unit ratio is unspecified if either input unit is unknown. The physical meaning of custom metadata is not independently verified.

## Supported baselines

| Model | Fitted parameters | Fixed/user-supplied values |
| --- | --- | --- |
| Y = mX + b | m and b, OLS | None |
| Y = mX | m, OLS | Zero intercept, explicitly assumed |
| Y = C | None | Finite signed C supplied by the user |

C must be an externally justified expectation. It is not estimated from the observations to hide systematic disagreement. There is no equation parser or arbitrary-model support. Review the chosen columns, names, units, model parameters and reference scale before selecting **Run analysis**.

## Reference scale and unknown uncertainty

Custom data has **no default noise floor**. A positive assumed response reference scale is required, from 0.000001 to 1000 in the same numeric units as Y. Choose a defensible scale from measurement resolution, prior error information or an explicitly declared tolerance. It is not automatically measured uncertainty, a confidence interval or a significance level. A justified uncertainty scale may inform this assumption, but the app does not verify that justification.

If uncertainty is unknown and no response scale can be justified, analysis remains disabled. Investigate rather than accepting an invented high-confidence result. This is a deliberate conservative entry gate. After a scale is supplied, the shared method still uses max(user scale, early residual RMS/standard error), sustained disagreement and the influence diagnostic. It does not estimate robust population uncertainty from an arbitrary dataset. Review whether conclusions change under plausible alternative scales; increasing the scale can withhold support as ambiguous.

## Validation and analysis

Two complete distinct measurements permit a baseline. Fewer than 14 return insufficient transition evidence; each tested candidate needs six at/below and six above. Repeated X values are unsupported; do not discard replicates silently. Aggregate externally only with a documented method. Signed X is supported for custom models. Absolute X/Y and C are bounded by 1,000,000. Extremely close X values and numerically dependent fitting columns are rejected; rescale externally or improve precision.

Unsorted X is accepted with a warning. Original table order and IDs remain; analysis sorts internally. A constant observed response has undefined centered R². Exact/zero-residual lines remain valid descriptive fits, but the dimensionless numeric floor prevents spurious support from machine precision. Zero/negative/non-finite reference scales are rejected.

All three models use the existing detector: same-data penalized comparison, four consecutive strictly post-knee same-sign residuals beyond twice the reference scale, and retained support after a diagnostic omission of the largest absolute baseline residual. Fixed C has zero fitted baseline parameters; the hinge adds a departure coefficient and searched knee. See [methodology](methodology.md) for formulas.

Outcomes are supported, ambiguous, none or insufficient. Only supported outcomes report candidate location and sensitivity range. The range is not a confidence interval. No clear transition does not establish model adequacy. No physical mechanism, yield point, saturation point or certified operating boundary is inferred from custom data.

## Editing, switching and export

Editing observations or the response scale pauses evidence, clears selections, hides previous custom plots and disables export. Rerunning validates the current data and replaces fits, residuals and findings. Invalid input remains editable; stale plots do not masquerade as current analysis. Model configuration stays intact during data edits. Clear dataset removes current observations while retaining configuration; New custom dataset starts fresh configuration. Switching to a built-in restores its defaults. Switching back to custom starts a new input session rather than retaining hidden state. Reload resets in-memory work.

Custom exports use common evidence schema 1.2.0 and methodology 1.3.0, extending the existing evidence architecture with user-supplied provenance, input method, filename **basename only**, column mapping, variable/unit kinds, model settings, fixed/fitted parameter treatments and explicit scale source. Export includes immutable source header/cell records, excluded blank IDs, current analyzed observations in table order, sorted analysis, predictions, residuals, comparisons, candidate profile, outcome, sensitivity, influence, findings and caveats. Source records and current edited observations are separate so edits remain traceable. No local absolute file path is exported. Built-in exports retain schema 1.1.0/method 1.2.0; legacy Spring callers retain schema 1.0.0/method 1.1.0.

## Local processing and example

CSV reading, parsing, mapping, fitting, plotting and JSON generation happen in browser memory. Raw dataset values are never uploaded. Optional Milestone 4 AI actions send a description/headers or a selected deterministic finding with summary statistics to Google Gemini, after explicit user action; see `docs/ai.md` for exact disclosure and free-tier privacy terms. There are no scientific-data analytics, accounts or backend persistence. Loading the example fetches only a static local asset and does not send user measurements. An export saves a local record; leaving/reloading the page loses in-memory edits.

`public/examples/temperature-response.csv` is a synthetic 24-row temperature/response example independent of the four demonstrations. Temperature runs −10 to 59 °C. Response is an approximately linear voltage signal with gradual high-temperature departure and small deterministic noise. It illustrates import and mapping; no real thermometer or sensor mechanism is claimed. The UI suggests an explicit 0.05 V response scale and asks the user to confirm units/scale. The one-click example records synthetic provenance. An arbitrary uploaded file is user supplied; provenance is not inferred from its filename.

Remaining limits include OLS assumptions, one hinge, no calibrated false-positive rate, no uncertainty propagation, no repeated-X fitting, no unit conversion, no imported-data persistence and no arbitrary AI-generated models. Optional AI proposals require confirmation and do not set the response scale.
