# Method selection (recorded before implementation)

ModelScope asks whether a single configured linear relationship adequately describes an ordered spring dataset. It does not establish a physical cause or an exact failure point.

## Approaches considered

| Approach | Advantage | Limitation |
| --- | --- | --- |
| First residual exceeding a threshold | Simple | A single noisy observation triggers it; rejected. |
| Sustained residual threshold alone | Explainable, resists isolated points | Depends strongly on baseline selection and noise scale. |
| Two independent lines | Simple exhaustive fit | Allows unphysical discontinuity; extra flexibility overfits small samples. |
| Continuous segmented regression, penalized comparison | Fits continuous slope changes, inspectable grid search | A gradual curved departure is only approximated by a hinge; search needs an additional penalty. |
| General change-point algorithms | Flexible multiple-regime detection | Too many choices and parameters for this small educational slice. |

## Selected prototype rule

Exhaustive continuous hinge regression compared with the configured single line on the **same complete dataset**, using a BIC-style complexity penalty and an explicit grid-search penalty. Require an improvement of at least 10 criterion units AND at least four consecutive post-knee residuals of the same sign exceeding twice the early-region residual scale. At least six observations must lie on each side; fewer than 14 observations produce no transition decision. These conservative settings are documented prototype rules, not calibrated significance levels.

The default configured line is F = kx. An optional free intercept supports a force-zero offset. For every candidate knee b, the comparison model is F = kx + c + a max(0, x-b), with c fixed to zero in the default configuration. This is a diagnostic alternative, not a new spring law.

For Gaussian independent equal-variance errors, the comparison criterion up to a common constant is n ln(SSE/n) + p ln(n). We count the searched knee as a parameter in the hinge model and additionally add 2 ln(M) for M candidate knees. This extra search penalty is a conservative prototype choice, not an exact Bayesian calculation or a p-value. A common numeric floor derived from the configured force noise floor prevents division/logarithm singularities; perfect lines cannot generate a transition from floating-point noise.

The plotted reference is the configured line refit to measurements at or below the selected knee, if a transition is supported; otherwise it is the complete-data fit. Full-data fit metrics and reference metrics must be clearly separated. Reference residuals equal observed force minus reference prediction. The noise scale is max(early residual standard error, configured noise floor); normalized residuals are descriptive and are not studentized residuals or z-test statistics.

Candidate knees within 2 units of the best penalized criterion define a sensitivity region, expanded to neighboring measured extensions to show sampling resolution. This region is **not a confidence interval**. A sustained residual finding identifies exact measurements; region labels describe agreement with the plotted reference conditionally on this method.

## Sources consulted

- [R stats information criterion documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/AIC.html): likelihood comparison on the same observations; log(n) parameter penalty.
- [NIST graphical residual analysis](https://www.itl.nist.gov/div898/handbook/pmd/section6/pmd614.htm): residual patterns provide model diagnostic information.
- [NIST improving an inadequate model](https://itl.nist.gov/div898/handbook/pmd/section4/pmd45.htm): residual analysis informs model refinement.

## Scientific assumptions and limits

This illustrative spring dataset is synthetic, not laboratory validation. The early response is approximately linear; later force progressively stiffens. Changes could reflect spring geometry, material response, calibration drift, loading history, or other causes. Statistical evidence alone cannot choose between these mechanisms.

Assume extension is accurately measured, independent force errors, adequate coverage, and one possible transition ordered by extension. No errors-in-variables fit, heteroscedastic weighting, causal inference, parameter confidence intervals, or general multi-transition analysis is implemented. Sorting by extension discards acquisition-order information. Duplicated extensions are rejected in this milestone. An isolated outlier can affect ordinary least squares; the sustained gate helps but is not a robust regression guarantee. A poor fit without a hinge pattern can still yield “no clear transition”; that does not validate the model.
