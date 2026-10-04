# Built-in experiment notes

All data is a **Synthetic educational dataset**, used for deterministic demonstrations, reproducibility, and controlled model-inadequacy examples. It is not laboratory validation. All four families use the same detector; generating formulas and generating departure locations are not passed to detection. Each dataset has 24 observations and a fixed alternating noise sequence. Edits are explicitly recorded in export provenance.

## Spring — Hooke's Law

Question: over what extension range does a constant-stiffness spring model adequately describe these measurements?

Baseline: F = kx by default, assuming unloaded extension and a correctly zeroed force sensor; F = kx + c is selectable to fit an empirical offset. Stiffness is fitted by OLS and has units N/m. The original Milestone 1.5 data and calculations remain unchanged.

Generation: xᵢ = 0.005(i+1) m; F = 32x + fixed force noise + 680 max(0,x−0.060)² N for the progressive example. The linear control omits the quadratic term. Assumed noise floor: 0.040 N.

Assumptions: approximately linear elastic response, extension from unloaded length, stable calibration and apparatus. Geometry, material response, calibration or loading history may explain disagreement. ModelScope can identify statistical departure from a configured line; it cannot establish an elastic limit, yield point, or particular physical mechanism. A fitted hinge need not equal the generating 0.060 m onset.

## Pendulum — Small-Angle Approximation

Question: over what range of initial angles does the small-angle pendulum approximation remain adequate for these measurements?

Baseline: T₀ = 2π√(L/g), with fixed L = 1 m and g = 9.80665 m/s², giving approximately 2.0064093 s. The response is independent of angle under the approximation. Length/gravity are configured constants, T₀ is derived, and no baseline coefficients are fitted. Degrees are used for student-facing angles; generation converts to radians.

Generation only: the ideal finite-amplitude period is T(θ) = 4√(L/g) K(sin(θ/2)) = T₀/AGM(1,cos(θ/2)). The lightweight implementation iterates arithmetic/geometric means until their difference is at most 4 machine epsilons relative to the mean, with a 32-iteration guard. See [NIST's pendulum application](https://dlmf.nist.gov/22.19) and [AGM formula](https://dlmf.nist.gov/19.8#E5). No elliptic-integral package is added.

The progressive dataset covers 2.5–60° with fixed noise up to approximately 0.0018 s; the finite-amplitude correction at 60° is about 7.3%, rather than a cartoonishly large divergence. The small-angle control covers 0.2–4.8° with the same noise, for which the amplitude correction is small relative to the configured 0.006 s scale. Even a small-angle approximation can show measurable systematic disagreement at sufficiently high precision; a wider small-angle fixture can therefore legitimately be ambiguous.

Assumptions: simple pendulum, point-like bob, effectively massless suspension, fixed length, constant g, negligible damping, and sufficiently small initial amplitude for the tested baseline. Length/gravity uncertainty is not propagated. ModelScope can diagnose increasing inadequacy of the small-angle approximation. It cannot certify a universal maximum angle or prove a damping, geometric, or measurement cause. The theoretical reference remains fixed even when statistical support is withheld.

## Beer–Lambert — Concentration Response

Question: across what concentration range is a linear absorbance model adequate for these measurements?

Baseline: empirical A = mc + b, with fitted intercept by default. An explicitly selected A = mc mode fixes zero offset. Concentration is in mmol/L; absorbance is dimensionless (unit symbol 1); slope is L/mmol. This is a generic calibration, not a specified species or molar absorptivity.

Generation: cᵢ = 0.04(i+1) mmol/L; A = 1.2c + 0.018 + 0.003eᵢ − 0.9 max(0,c−0.48)² for the departure example. Fixed eᵢ values lie between −0.8 and +0.9. The linear control omits compression. Assumed response noise floor: 0.008.

Assumptions: fixed path length and absorbing species, stable wavelength and measurement conditions, approximately dilute response; intercept accommodates a blank/zeroing offset. Chemistry, optical effects, or instrument response may contribute to departure. ModelScope can diagnose inadequacy of the linear Beer–Lambert calibration; it cannot prove spectrometer saturation or a particular chemical cause. The synthetic compression formula is illustrative, not a validated instrument/chemical model.

## Sensor Calibration — Linear Range

Question: where does this sensor begin departing from its calibrated linear response?

Baseline: empirical V = mQ + b, default fitted offset. Q is reference force in N; V is sensor voltage in V; slope is V/N. Fixed-zero V = mQ is available only by explicit configuration. The sensor is generic; no commercial specification is implied.

Generation: Qᵢ = 0.5(i+1) N; V = 0.25Q + 0.10 + 0.006eᵢ − 0.015 max(0,Q−5)² V. The curve compresses smoothly and stays monotone over 0.5–12 N; it is not a hard-clipped failure. The linear control omits compression. Assumed voltage noise floor: 0.015 V.

Assumptions: stable offset and operating conditions, accurate reference force, approximately linear early response. ModelScope shows the early calibration reference, candidate sensitivity region, and increasing nonlinear disagreement beyond that region. It cannot certify a safe operating range or identify a specific electrical failure. The generating 5 N departure is not supplied to the detector, and the approximate hinge can occur later.

## Shared interpretation

A supported candidate passes penalized comparison, sustained residuals, and an influential-observation diagnostic. Ambiguous evidence has no reported transition location/range. No clear transition does not imply model adequacy. Sensitivity ranges are score/sampling descriptions, not confidence intervals. Similarity of fixture behavior across these families does not statistically calibrate a universal detector.
