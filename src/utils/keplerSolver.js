/**
 * Implements the full pipeline from JPL's "Approximate Positions of the Planets":
 *   https://ssd.jpl.nasa.gov/planets/approx_pos.html
 *
 * Pipeline:
 *   dateToT()           → convert a JS Date to Julian centuries past J2000.0
 *   computeElements()   → update the 6 elements to the current epoch using rates
 *   solveKepler()       → iterative Newton-Raphson solver for Eccentric Anomaly E
 *   computePosition()   → turn E + elements into ecliptic XYZ, then equatorial XYZ
 *
 * All angles are handled in DEGREES internally (matching JPL's table) and
 * converted to radians only where trig functions are called.
 *
 * JPL outputs J2000 equatorial coordinates where:
 *   X = toward vernal equinox
 *   Y = 90° east in equatorial plane
 *   Z = toward North Celestial Pole (Earth's rotation axis, "up" in the sky)
 *
 * Three.js uses a Y-up right-hand system where:
 *   Y = world up
 *   XZ = horizontal plane
 *
 * To lay the ecliptic flat (standard orrery view) we remap:
 *   Three.js X =  J2000 X   (vernal equinox direction kept)
 *   Three.js Y =  J2000 Z   (NCP becomes "up" in Three.js)
 *   Three.js Z = -J2000 Y   (negate to preserve right-hand chirality)
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// ----------------- Date → Julian Centuries past J2000.0 -----------------
/**
 * Convert a JavaScript Date object to T, the number of Julian centuries
 * elapsed since J2000.0 (noon on January 1, 2000).
 *
 * JPL formula:  T = (JD_eph − 2451545.0) / 36525
 */
export function dateToT(date = new Date()) {
  const JD = date.getTime() / 86400000 + 2440587.5;
  return (JD - 2451545.0) / 36525.0;
}

// ----------------- Compute current Keplerian elements -----------------
/**
 * Apply the linear rates to get the element values at epoch T.
 *
 * Each element = base_value + rate × T
 *
 * @param {object} el   — planet entry from keplerianElements.js
 * @param {number} T    — Julian centuries from dateToT()
 * @returns {object}    — { a, e, I, L, lp (ω̄), ln (Ω) }  all in original units
 */
export function computeElements(el, T) {
  return {
    a: el.a0 + el.da * T,   // semi-major axis (AU)
    e: el.e0 + el.de * T,   // eccentricity
    I: el.I0 + el.dI * T,   // inclination (degrees)
    L: el.L0 + el.dL * T,   // mean longitude (degrees)
    lp: el.lp0 + el.dlp * T,   // longitude of perihelion (degrees)
    ln: el.ln0 + el.dln * T,   // longitude of ascending node (degrees)
  };
}

// ----------------- Normalize an angle to [−180°, +180°] -----------------
/**
 * JPL step 3: adjust M (mean anomaly) so it lies in [−180, +180] degrees
 * before feeding it into the Kepler solver.
 *
 * @param {number} deg  — angle in degrees (any range)
 * @returns {number}    — equivalent angle in (−180, +180]
 */
function normalizeAngle(deg) {
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
}

// ----------------- Solve Kepler's Equation -----------------
/**
 * Kepler's Equation:  M = E − e* · sin(E)
 * where  e* = (180/π)·e  (eccentricity expressed in degrees)
 *
 * We want E (Eccentric Anomaly) given M (Mean Anomaly) and e.
 * Newton-Raphson iteration as specified by JPL.
 *
 * @param {number} M_deg  — Mean Anomaly in degrees (normalized to ±180)
 * @param {number} e      — eccentricity (0–1)
 * @returns {number}      — Eccentric Anomaly E in degrees
 */
export function solveKepler(M_deg, e) {
  const eStar = RAD * e;        // e in degrees (e* = 57.29578 × e)
  const tol = 1e-6;           // convergence tolerance (degrees)

  // Smart initial guess per JPL — converges faster than E₀ = M
  let E = M_deg + eStar * Math.sin(M_deg * DEG);

  let deltaE = Infinity;
  let iterations = 0;

  while (Math.abs(deltaE) > tol && iterations < 100) {
    const deltaM = M_deg - (E - eStar * Math.sin(E * DEG));
    deltaE = deltaM / (1 - e * Math.cos(E * DEG));
    E += deltaE;
    iterations++;
  }

  return E;  // degrees
}

// ----------------- Full pipeline: elements → 3D position in Three.js world space -----------------
/**
 * Given a planet's current Keplerian elements (from computeElements),
 * return its 3D position mapped into Three.js's Y-up world space.
 *
 * Steps:
 *   1. Derive ω (argument of perihelion) and M (mean anomaly)
 *   2. Solve Kepler → E (eccentric anomaly)
 *   3. Position in orbital plane (x', y')
 *   4. Rotate to J2000 ecliptic frame (Rz(−Ω)·Rx(−I)·Rz(−ω))
 *   5. Rotate to J2000 equatorial frame (tilt by obliquity ε = 23.439°)
 *   6. Remap J2000 equatorial → Three.js Y-up:
 *        Three.js X =  J2000 X
 *        Three.js Y =  J2000 Z   (NCP = "up")
 *        Three.js Z = -J2000 Y   (preserves right-hand chirality)
 *
 * @param {object} elements  — from computeElements()
 * @param {number} auScale   — Three.js units per AU (AU_TO_UNITS)
 * @returns {{ x, y, z }}   — position in Three.js world units
 */
export function computePosition(elements, auScale) {
  const { a, e, I, L, lp, ln } = elements;

  // ── Step 1: argument of perihelion ω and mean anomaly M ──────────────────
  const omega = lp - ln;    // ω = ω̄ − Ω  (degrees)
  let M = L - lp;           // M = L − ω̄  (degrees)
  M = normalizeAngle(M);    // clamp to (−180°, +180°)

  // ── Step 2: solve Kepler's equation → eccentric anomaly E ────────────────
  const E_deg = solveKepler(M, e);
  const E = E_deg * DEG;    // radians for trig

  // ── Step 3: heliocentric position in orbital plane ────────────────────────
  const xp = a * (Math.cos(E) - e);
  const yp = a * (Math.sqrt(1 - e * e) * Math.sin(E));

  // ── Step 4: rotate orbital plane → J2000 ecliptic frame ──────────────────
  // Matrix M = Rz(−Ω) · Rx(−I) · Rz(−ω), expanded form per JPL:
  const omR = omega * DEG;
  const lnR = ln * DEG;
  const IR = I * DEG;

  const cosOm = Math.cos(omR), sinOm = Math.sin(omR);
  const cosLn = Math.cos(lnR), sinLn = Math.sin(lnR);
  const cosI = Math.cos(IR), sinI = Math.sin(IR);

  const xEcl = (cosOm * cosLn - sinOm * sinLn * cosI) * xp
    + (-sinOm * cosLn - cosOm * sinLn * cosI) * yp;

  const yEcl = (cosOm * sinLn + sinOm * cosLn * cosI) * xp
    + (-sinOm * sinLn + cosOm * cosLn * cosI) * yp;

  const zEcl = (sinOm * sinI) * xp + (cosOm * sinI) * yp;

  // ── Step 5: rotate ecliptic → J2000 equatorial frame ─────────────────────
  // The ecliptic is tilted 23.439° relative to Earth's equator (J2000 obliquity).
  const eps = 23.43928 * DEG;
  const cosEps = Math.cos(eps), sinEps = Math.sin(eps);

  const xEq = xEcl;
  const yEq = cosEps * yEcl - sinEps * zEcl;
  const zEq = sinEps * yEcl + cosEps * zEcl;

  // ── Step 6: remap J2000 equatorial → Three.js Y-up ───────────────────────
  return {
    x: xEq * auScale,
    y: zEq * auScale,
    z: -yEq * auScale,
  };
}

// ----------------- Convenience: compute position from a planet entry + date -----------------
/**
 * One-call helper: planet elements object + JS Date → Three.js { x, y, z }
 *
 * @param {object} planetEl  — entry from KEPLERIAN_ELEMENTS
 * @param {number} auScale   — Three.js units per AU
 * @param {Date}   date      — defaults to right now
 * @returns {{ x, y, z }}
 */
export function planetPosition(planetEl, auScale, date = new Date()) {
  const T = dateToT(date);
  const elements = computeElements(planetEl, T);
  return computePosition(elements, auScale);
}

// ----------------- Generate orbit path points -----------------
/**
 * Return an array of {x,y,z} points tracing the planet's full elliptical orbit
 * for the given epoch T.  Used to draw the orbit ring in Three.js.
 *
 * Steps M through 0→360° and solves for each position so that point density
 * is proportional to orbital speed (denser near perihelion).
 *
 * @param {object} planetEl   — entry from KEPLERIAN_ELEMENTS
 * @param {number} T          — Julian centuries (from dateToT())
 * @param {number} auScale    — Three.js units per AU
 * @param {number} numPoints  — how many points on the orbit curve (default 360)
 * @returns {Array<{x,y,z}>}
 */
export function orbitPoints(planetEl, T, auScale, numPoints = 360) {
  const el = computeElements(planetEl, T);
  const { a, e, I, lp, ln } = el;
  const omega = lp - ln;

  // Pre-compute rotation constants once — they don't change around the orbit
  const omR = omega * DEG;
  const lnR = ln * DEG;
  const IR = I * DEG;

  const cosOm = Math.cos(omR), sinOm = Math.sin(omR);
  const cosLn = Math.cos(lnR), sinLn = Math.sin(lnR);
  const cosI = Math.cos(IR), sinI = Math.sin(IR);

  const eps = 23.43928 * DEG;
  const cosEps = Math.cos(eps), sinEps = Math.sin(eps);

  const points = [];

  for (let i = 0; i <= numPoints; i++) {
    // Step M from −180 to +180 to get points all around the ellipse
    const M_deg = -180 + (360 * i) / numPoints;
    const E_deg = solveKepler(M_deg, e);
    const E = E_deg * DEG;

    // Orbital plane position
    const xp = a * (Math.cos(E) - e);
    const yp = a * (Math.sqrt(1 - e * e) * Math.sin(E));

    // → Ecliptic frame
    const xEcl = (cosOm * cosLn - sinOm * sinLn * cosI) * xp
      + (-sinOm * cosLn - cosOm * sinLn * cosI) * yp;
    const yEcl = (cosOm * sinLn + sinOm * cosLn * cosI) * xp
      + (-sinOm * sinLn + cosOm * cosLn * cosI) * yp;
    const zEcl = (sinOm * sinI) * xp + (cosOm * sinI) * yp;

    // → J2000 equatorial frame
    const xEq = xEcl;
    const yEq = cosEps * yEcl - sinEps * zEcl;
    const zEq = sinEps * yEcl + cosEps * zEcl;

    // → Three.js Y-up frame  (same mapping as computePosition)
    points.push({
      x: xEq * auScale,
      y: zEq * auScale,
      z: -yEq * auScale,
    });
  }

  return points;
}