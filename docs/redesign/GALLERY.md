# Home instrument preview gallery

The Home section headed “Four scientific systems. One question.” now presents Spring / Mechanics, Pendulum / Physics, Beer–Lambert / Chemistry and Sensor / Instrumentation as a quiet visual gallery. The headline is unchanged. Each preview contains the instrument, name, category and a small arrow; there are no descriptions or controls.

The gallery reuses Explore’s actual instrument geometry and studio environment in one shared, demand-rendered WebGL canvas. It loads when the section enters view and releases the canvas when it leaves. Hover or keyboard focus gently extends the spring, sways the pendulum, attenuates the optical beam or compresses the sensor. Leaving returns the instrument smoothly to rest. There is no automatic cycle or idle animation; reduced-motion preferences keep every instrument still. The existing schematic fallback retains the links when WebGL is unavailable.

Desktop and tablet use two columns; mobile uses one column. Production browser review covered 1440px, 768px and 390px widths, with no horizontal page overflow. Keyboard focus has a visible outline. Two reduced-motion screenshots taken several seconds apart were identical while the pendulum link had focus.

All four links were clicked and confirmed by Explore’s selected button:

| Preview | Destination |
|---|---|
| Spring | `/explore?model=spring` |
| Pendulum | `/explore?model=pendulum` |
| Beer–Lambert | `/explore?model=beer-lambert` |
| Sensor | `/explore?model=sensor` |

`npm test` passes all 303 existing tests across nine files. `npm run typecheck`, `npm run lint` and `npm run build` pass. Scientific analysis, APIs, experiment generators, custom-data configuration and AI logic are unchanged. No merge or deployment was performed.

Actual production captures: [desktop](gallery-screenshots/desktop.jpg), [tablet](gallery-screenshots/tablet.jpg), [mobile headline and first previews](gallery-screenshots/mobile-top.jpg), [mobile optical and sensor previews](gallery-screenshots/mobile-bottom.jpg). Mobile was checked in a browser viewport, not on physical hardware. Forced WebGL context loss was not exercised.
