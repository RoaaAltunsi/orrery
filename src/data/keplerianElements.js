/**
 * Keplerian elements and their rates from:
 *   https://ssd.jpl.nasa.gov/planets/approx_pos.html   (Table 1)
 *
 * Valid for: 1800 AD – 2050 AD
 *
 * Element layout per planet (two rows):
 *   Row 1: [a₀,    e₀,    I₀,    L₀,    ω̄₀,    Ω₀   ]   base values
 *   Row 2: [ȧ,     ė,     İ,     L̇,     ω̄̇,     Ω̇    ]   rates per century
 *
 * Units:
 *   a  →  AU  (astronomical units)
 *   e  →  dimensionless (0–1)
 *   I  →  degrees
 *   L  →  degrees   (mean longitude)
 *   ω̄  →  degrees   (longitude of perihelion)
 *   Ω  →  degrees   (longitude of ascending node)
 *
 * The Earth row uses "EM Bary" (Earth-Moon Barycenter) — close enough for visual purposes.
 */

export const KEPLERIAN_ELEMENTS = {

  Mercury: {
    // a₀           e₀            I₀            L₀               ω̄₀             Ω₀
    a0: 0.38709927, e0: 0.20563593, I0: 7.00497902, L0: 252.25032350, lp0: 77.45779628, ln0: 48.33076593,
    // ȧ            ė             İ             L̇                ω̄̇              Ω̇
    da: 0.00000037, de: 0.00001906, dI: -0.00594749, dL: 149472.67411175, dlp: 0.16047689, dln: -0.12534081,
  },

  Venus: {
    a0: 0.72333566, e0: 0.00677672, I0: 3.39467605, L0: 181.97909950, lp0: 131.60246718, ln0: 76.67984255,
    da: 0.00000390, de: -0.00004107, dI: -0.00078890, dL: 58517.81538729, dlp: 0.00268329, dln: -0.27769418,
  },

  // "EM Bary" = Earth-Moon Barycenter. Ω is fixed at 0 for this model.
  Earth: {
    a0: 1.00000261, e0: 0.01671123, I0: -0.00001531, L0: 100.46457166, lp0: 102.93768193, ln0: 0.0,
    da: 0.00000562, de: -0.00004392, dI: -0.01294668, dL: 35999.37244981, dlp: 0.32327364, dln: 0.0,
  },

  Mars: {
    a0: 1.52371034, e0: 0.09339410, I0: 1.84969142, L0: -4.55343205, lp0: -23.94362959, ln0: 49.55953891,
    da: 0.00001847, de: 0.00007882, dI: -0.00813131, dL: 19140.30268499, dlp: 0.44441088, dln: -0.29257343,
  },

  Jupiter: {
    a0: 5.20288700, e0: 0.04838624, I0: 1.30439695, L0: 34.39644051, lp0: 14.72847983, ln0: 100.47390909,
    da: -0.00011607, de: -0.00013253, dI: -0.00183714, dL: 3034.74612775, dlp: 0.21252668, dln: 0.20469106,
  },

  Saturn: {
    a0: 9.53667594, e0: 0.05386179, I0: 2.48599187, L0: 49.95424423, lp0: 92.59887831, ln0: 113.66242448,
    da: -0.00125060, de: -0.00050991, dI: 0.00193609, dL: 1222.49362201, dlp: -0.41897216, dln: -0.28867794,
  },

  Uranus: {
    a0: 19.18916464, e0: 0.04725744, I0: 0.77263783, L0: 313.23810451, lp0: 170.95427630, ln0: 74.01692503,
    da: -0.00196176, de: -0.00004397, dI: -0.00242939, dL: 428.48202785, dlp: 0.40805281, dln: 0.04240589,
  },

  Neptune: {
    a0: 30.06992276, e0: 0.00859048, I0: 1.77004347, L0: -55.12002969, lp0: 44.96476227, ln0: 131.78422574,
    da: 0.00026291, de: 0.00005105, dI: 0.00035372, dL: 218.45945325, dlp: -0.32241464, dln: -0.00508664,
  },
};

/**
 * Visual display properties (textures, sizes, ring info).
 * These are purely for Three.js rendering — not part of the orbital math.
 */
export const PLANET_VISUALS = {
  Mercury: { radius: 0.4, hasRings: false },
  Venus: { radius: 0.9, hasRings: false },
  Earth: { radius: 1.0, hasRings: false },
  Mars: { radius: 0.6, hasRings: false },
  Jupiter: { radius: 3.0, hasRings: false },
  Saturn: { radius: 2.5, hasRings: true },
  Uranus: { radius: 1.8, hasRings: false },
  Neptune: { radius: 1.7, hasRings: false },
};

export const AU_TO_UNITS = 20;