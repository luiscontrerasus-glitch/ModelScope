# Transition methodology · version 1.1.0

ModelScope compares a configured line with an ordered spring dataset. A statistical departure does not establish a physical cause or an exact failure point. The method identifier is `continuous-hinge-sustained-residuals`.

## Model and regression

The built-in experiment defaults to ideal Hooke's law **F = kx**, assuming extension from unloaded length and a correctly zeroed force sensor. The selectable empirical model **F = kx + c** fits an offset that can represent preload or zeroing bias. Neither choice is imposed independently of configuration. Both modes are tested.

The ordinary least-squares baseline uses every observation: k = Σ(xF)/Σ(x²) for fixed zero; for a fitted offset, k = Σ[(x−x̄)(F−F̄)]/Σ[(x−x̄)²], c = F̄−kx̄. Predictions are kx+c. Stiffness is not constrained positive.

Residual = observed force − prediction; SSE = Σresidual²; RMSE = √(SSE/n). Centered R² = 1−SSE/Σ(F−F̄)² in both modes. It can be negative for a through-origin fit and is null for constant response. R² alone cannot establish model adequacy.

## Continuous candidate search and comparison

For each eligible measured extension b, fit **F = kx + c + a max(0,x−b)** on the same complete dataset as the baseline. The hinge is continuous; c remains zero in fixed-zero mode. Require at least six observations at or below b and six strictly above b. There are n−11 eligible candidates. Fewer than 14 distinct-extension observations produce `insufficient`, without a candidate search.

Hinge coefficients use a small reorthogonalized modified Gram–Schmidt QR least-squares solver. Extension is scaled internally; fitted-offset candidates also shift extension before solving. Numerically dependent columns are rejected. This replaces the earlier normal-equation solver.

For p = 1 (fixed zero) or 2 (fitted offset), force noise floor σ₀, and M candidates, the dimensionless criterion is:

- Single line: C₀ = n ln(max(SSE₀/(nσ₀²), 10⁻¹²)) + p ln(n).
- Candidate hinge: Cᵦ = n ln(max(SSEᵦ/(nσ₀²), 10⁻¹²)) + (p+2) ln(n) + 2 ln(M).
- Improvement: Δ = C₀ − min(Cᵦ). Require Δ ≥ 10.

The extra two parameters represent the additional slope and searched knee. The additional 2 ln(M) search penalty is a conservative prototype choice. This is a BIC-style heuristic, not an exact Bayesian calculation, calibrated significance level, or p-value. The common dimensionless floor prevents numerical noise from creating transitions in perfect lines. Exact candidate ties select the earlier measured extension.

## Sustained residual and influence safeguards

Refit the configured line to observations at or below the best knee. Define scale = max(σ₀, √(SSEearly/(nearly−p))). Require at least four consecutive observations strictly after the knee with residuals of the same sign and magnitude **strictly greater than twice that scale**. A sign change or subthreshold point ends a run. Qualifying runs contribute their exact row IDs. Normalized residuals are residual/scale; they are descriptive, not studentized residuals or z-test statistics.

If comparison and sustained gates pass, identify the observation with largest absolute residual from the **complete-data baseline** (ties select the earlier sorted row). Omit it only for a diagnostic refit, repeat baseline fitting and candidate search, and require Δ ≥ 10, a qualifying four-point run, and the same sign of hinge slope change. Candidate search still requires six observations in each region; the diagnostic can have 13 observations when the original has 14.

This is one targeted influence check, not exhaustive leave-one-out analysis or robust regression. It can withhold a real transition when coverage is sparse. **No observation is removed from reported fits, predictions, residuals, findings, or original observations.** The diagnostic omission and its result are exported separately.

## Decision states

| State | Implemented rule | Reported transition location |
| --- | --- | --- |
| `insufficient` | n < 14 | None; no candidate search |
| `none` | Comparison improvement < 10 | None; candidate/comparison remain inspectable |
| `ambiguous` | Comparison passes, but sustained gate or influence check fails | None; no positive transition shading |
| `supported` | Comparison, sustained gate, and influence check pass | Best candidate and transition sensitivity range |

Only supported results use the early-region line as the plotted reference. Other states use the complete-data baseline. A poor model can yield no clear transition; this does not validate it. The four-point gate and influence refit limit isolated-point explanations; the tested isolated and adjacent disturbances did not produce supported regime changes. This is fixture evidence, not a guarantee for every contaminated dataset.

## Transition sensitivity range

For a supported result, retain all tested knees whose criterion is within 2 units of the best candidate. Export that exact list and its minimum/maximum. Expand these endpoints by one neighboring measured extension on each side to produce the displayed sampling range. This hull can include untested positions or gaps between near-best knees. Near-best candidates are defined by scores, not by independently passing every safeguard.

This is **not a confidence interval**, probability distribution, or calibrated uncertainty estimate. It describes objective sensitivity and sampling resolution under this model and candidate grid. Ambiguous, none, and insufficient results have null estimate, range, and sensitivity.

## Units and reproducible export

The interface accepts extension in m and force in N, with stiffness in N/m and SSE in N². It does not offer unit conversion. In the numerical engine, compatible extension scaling transforms slopes and knees; compatible force scaling transforms forces, slopes, offsets, residuals, and the configured noise floor together. SSE/(nσ₀²) and criterion improvements then remain invariant within floating-point tolerance. Changing the physical noise assumption is different from converting units and can change the decision.

JSON schema 1.0.0 includes experiment and variable identities, SI units, configured equation/intercept/noise floor, method identifier/version/policy, original observations in input order, sorted analysis, fitted parameters, predictions, residuals and normalized residuals, both model errors/criteria, every candidate score, support state, sensitivity when supported, influence result when evaluated, and deterministic findings with caveats. It contains only computed values. Export is disabled after edits until successful recomputation.

## Built-in example and limits

The 24-row synthetic example spans 0.005–0.120 m. Its nominal early stiffness is 32 N/m, with fixed alternating noise and quadratic stiffening beginning at 0.060 m. The diagnostic hinge is an approximation to curvature and can lag the generating onset (the built-in result selects 0.080 m). The generating formula is never supplied to detection.

Assumptions include accurate extension, independent approximately equal-variance force errors, adequate coverage, and at most one hinge. Sorting discards acquisition order. No laboratory validation, causal inference, calibrated false-positive rate, parameter confidence intervals, x-uncertainty treatment, weighting, or repeated-extension support is implemented. Ordinary least squares remains sensitive to contamination. A single diagnostic omission does not prove immunity to outliers, and outliers can suppress real support.

## Alternatives and sources

A first-threshold crossing was rejected because one point can trigger it. Sustained residuals alone depend strongly on the reference. Independent lines allow discontinuity. General multiple-change algorithms add unjustified choices for this educational slice. Continuous hinge comparison plus explicit residual and influence safeguards provides inspectable prototype evidence.

- [R information criterion documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/AIC.html): comparison on the same observations and log(n) parameter penalties.
- [NIST residual analysis](https://www.itl.nist.gov/div898/handbook/pmd/section6/pmd614.htm): residual patterns diagnose model inadequacy.
- [NIST model refinement](https://itl.nist.gov/div898/handbook/pmd/section4/pmd45.htm): diagnostics do not by themselves establish a physical mechanism.
