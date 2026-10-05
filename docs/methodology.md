# Transition methodology · version 1.3.0

ModelScope asks where a configured baseline increasingly disagrees with observations. The four built-in families and custom data support empirical lines or a fixed theoretical constant. It does not establish a physical cause, exact failure point, or calibrated operating boundary. The Milestone 1–2 numerical branches and built-in export versions remain unchanged.

## Custom-data extension

Custom Y = mX + b and Y = mX use the same OLS/search code as built-in calibrations. User-supplied Y = C uses the same fixed-constant branch as the pendulum, with C supplied directly rather than derived from L/g. Its fitted baseline count is p = 0; C remains fixed in full, early-region, hinge and influence calculations. No second detector is introduced. Custom inputs may be signed; the original built-in bounds and exact Spring regression fixtures remain intact.

The custom workflow requires an explicit positive response reference scale. It supplies no default or guessed uncertainty. If none can be justified, analysis cannot proceed. Once supplied, the formulas below remain unchanged; scale is an assumption, not calibrated measurement uncertainty. Import validation, original-cell preservation, mapping, label-only units and state handling are described in [custom-data guidance](custom-data.md).

## Baseline models and parameter counts

Baseline fitting/prediction lives in `analysis/models.ts`; regime-deviation search lives in `analysis/breakpoint.ts`. Typed experiment definitions provide identities, units, parameter labels, assumptions and defaults, with no JSX or detection logic. Separate generators construct synthetic observations and never supply generating departure locations to the detector.

For spring, the default is ideal F = kx, requiring unloaded extension and correctly zeroed force. Optional F = kx + c fits an empirical offset. Beer–Lambert defaults to A = mc + b; sensor calibration defaults to V = mQ + b. Their offsets are fitted unless fixed zero is explicitly selected. Ordinary least squares uses every observation:

- Fixed zero: slope = Σ(xy)/Σ(x²), offset = 0; p = 1 fitted parameter.
- Fitted offset: slope = Σ[(x−x̄)(y−ȳ)]/Σ[(x−x̄)²], offset = ȳ−slope·x̄; p = 2.
- Pendulum: T₀ = 2π√(L/g), fixed L = 1 m and g = 9.80665 m/s²; p = 0. No period/offset is fitted. The internal affine representation has slope 0 and intercept T₀; these are not empirical pendulum parameters. Export exposes L, g and derived T₀ with their parameter treatments.

Stiffness/calibration slope is not constrained positive. For every baseline, residual = observation − prediction; SSE = Σresidual²; RMSE = √(SSE/n). Centered R² = 1−SSE/Σ(y−ȳ)². R² can be negative for fixed-zero or fixed-theory predictions and is null for constant observed response. It is not proof of physical adequacy and is particularly limited for a constant theoretical prediction.

## Continuous candidate search

At every eligible measured independent-variable value b, compare the baseline with a continuous hinge alternative on the same complete observations:

- Empirical line: y = slope·x + offset + a max(0,x−b); re-estimate the configured baseline coefficients and a by least squares. Offset stays zero if configured.
- Pendulum: T = T₀ + a max(0,θ−b); T₀ stays fixed, and only a is estimated at each tested b. The finite-amplitude generating model is not used here.

Require at least six observations at or below b and six strictly above b. There are M = n−11 candidates. Original samples below 14 return insufficient evidence without searching. Extension/angle/concentration/reference force must be distinct; input order is sorted without mutating the caller, while original order is retained separately.

Hinge coefficients use reorthogonalized modified Gram–Schmidt QR. Independent-variable values are scaled internally; fitted-offset linear candidates also shift their origin. Numerically dependent columns are rejected. The linear branch preserves Milestone 1.5 arithmetic exactly; captured pre-generalization fits, residuals, candidate profiles, and decisions remain identical in both intercept modes and both datasets.

## Dimensionless penalized comparison

With assumed response noise floor σ₀ and baseline fitted count p:

- C₀ = n ln(max(SSE₀/(nσ₀²), 10⁻¹²)) + p ln(n).
- Cᵦ = n ln(max(SSEᵦ/(nσ₀²), 10⁻¹²)) + (p+2) ln(n) + 2 ln(M).
- Improvement Δ = C₀ − min(Cᵦ). Require Δ ≥ 10.

The extra two parameters count the departure slope a and searched knee b, including for fixed theory. Configured L/g are not fitted parameters. The extra 2 ln(M) is a conservative candidate-search penalty, not exact Bayesian evidence. The common dimensionless floor prevents perfect-line floating-point artifacts from creating transitions. Ties select the earlier measured input.

Compatible response-unit changes must convert observations, predictions, parameter values and σ₀ together. Independent-variable scaling transforms knees and slopes; angle-unit conversion leaves the theoretical constant unchanged. The ratio SSE/(nσ₀²) and adjusted comparison are invariant within numerical tolerance. The app accepts explicit canonical units only and does not implement unit conversion.

The normalized residual threshold and dimensionless score make shared heuristic thresholds interpretable across the implemented families; baseline-specific parameter counts account for fitted flexibility. This does **not** establish shared statistical calibration, power, or a universal false-positive rate. Noise floors are explicit assumed scales, not independently measured uncertainties: 0.040 N (spring), 0.006 s (pendulum), 0.008 dimensionless absorbance, and 0.015 V (sensor). Changing the physical noise assumption can change persistence and the decision.

## Sustained residuals and influence safeguard

For the best candidate, evaluate the baseline on observations at or below the knee. Empirical lines are refitted there; theoretical T₀ stays fixed. Scale = max(σ₀, √(SSEearly/(nearly−p))). For p = 0 this is early residual RMS, not an independently measured timing-error variance.

Require at least four consecutive strictly post-knee residuals of the same sign and magnitude **strictly greater than twice that scale**. A sign change or subthreshold observation ends a run. Qualifying runs retain their exact row IDs. Normalized residuals are residual/scale, not studentized residuals or z-test statistics.

When comparison and persistence pass, diagnostically omit the observation with largest absolute complete-baseline residual (ties select the earlier sorted row). Recompute baseline errors, candidate search and persistence; empirical models refit while theoretical constants remain fixed. Require Δ ≥ 10, a qualifying four-point run, and the same sign of hinge departure slope. The diagnostic can have 13 observations if the original has 14; six observations in each candidate region still apply.

All original observations remain in actual reported fits, predictions, residuals, findings and export. Diagnostic omission is recorded separately. This is one targeted influence check, not exhaustive leave-one-out analysis or robust regression, and can withhold real support when coverage is sparse. Isolated/adjacent fixture resistance is evidence about those fixtures, not a universal guarantee.

## Decision states and displayed reference

| State | Implemented condition | Reported location/range |
| --- | --- | --- |
| insufficient | n < 14 | None; no search |
| none | Δ < 10 | None; alternative comparison/profile remains inspectable |
| ambiguous | Δ ≥ 10, but persistence or influence fails | None; no positive transition shading |
| supported | Comparison, persistence, and influence all pass | Best knee and transition sensitivity range |

Supported empirical results use an early-region reference; other empirical states use the complete-data baseline. Pendulum prediction always uses fixed theory regardless of state. A model can be inadequate without a supported hinge; no transition does not validate it.

## Sensitivity construction

For supported results, retain the exact set of tested knees within 2 penalized criterion units of the optimum. Export that list and its min/max. Expand endpoints by one neighboring measured independent-variable value on each side to produce the displayed sampling range. This hull can span gaps or untested positions. Near-best scores do not independently prove every candidate passes all safeguards.

This is **not a confidence interval**, probability distribution, or calibrated uncertainty estimate. It describes objective sensitivity and sampling under this baseline and grid. Other states have null estimate, range and sensitivity. A hinge can lag the onset of a gradual generating correction.

## Reproducible evidence schema

All four UI exports use schema 1.1.0 and method 1.2.0, preserving the evidence architecture: experiment/question, variable definitions and canonical units, baseline ID/equation/fit mode, reference and complete-data parameters with treatments, assumptions, synthetic provenance and edit flag, original input order, full sorted analysis, predictions/residuals, comparisons, every candidate score, support state, sensitivity when supported, influence result when evaluated, findings and caveats.

Custom exports use schema 1.2.0/method 1.3.0 with the same evidence structure, extending provenance and configuration for user inputs, selected columns, unspecified/unitless/labeled unit kinds, explicit reference-scale source, raw source records and edited analyzed observations. They contain filename basenames, never private filesystem paths. Built-in exports continue using their verified prior versions.

The original schema 1.0 spring helper and method 1.1.0 metadata remain available to existing callers and original tests. It rejects other experiment identities rather than mislabeling them. New exports use one common structure across all four families. Export is disabled after edits until a successful rerun.

## Scientific limits and sources

Synthetic educational demonstrations are not laboratory validation. Assume accurate independent-variable measurements, approximately independent/equal-variance response errors, coverage adequate for one hinge, and known theoretical pendulum parameters. No causal inference, calibrated error rates, parameter confidence intervals, uncertainty propagation, errors-in-variables fitting, heteroscedastic weighting, repeated-input support or multiple transitions are implemented. Sorting loses acquisition-order information. See [experiment notes](experiments.md) for family-specific assumptions and generating formulas.

Alternatives considered in Milestone 1 included first-threshold crossing (single-point triggering), persistence alone (reference dependence), independent lines (discontinuity), and general multi-change methods (unjustified flexibility for this slice). The audited continuous hinge plus explicit residual/influence gates was retained rather than replacing working mathematics.

- [R information criteria](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/AIC.html): same-observation comparison and log(n) parameter penalties.
- [NIST residual analysis](https://www.itl.nist.gov/div898/handbook/pmd/section6/pmd614.htm): residual patterns diagnose model inadequacy.
- [NIST pendulum application](https://dlmf.nist.gov/22.19) and [AGM elliptic-integral computation](https://dlmf.nist.gov/19.8#E5): finite-amplitude synthetic period generation only.
