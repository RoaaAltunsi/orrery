# Orrery — NASA-Based Solar System Visualization

A browser-based **orrery** built with **JavaScript**, **Vite**, and **Three.js** that visualizes the planets orbiting the Sun using **approximate Keplerian elements from NASA/JPL**.

Instead of placing planets on hard-coded circles, this project computes each planet’s position from NASA’s published orbital elements and rates, then converts those values into 3D coordinates for rendering in Three.js.

## Technical Stack

- **JavaScript (ES Modules)**
- **Vite** for development and bundling
- **React** for component structure
- **Three.js** for 3D rendering

## Project Structure

```text
src/
├── components/
│   ├── Canvas.jsx            # Three.js renderer, camera, lights, post-processing
│   ├── SpaceBg.jsx           # Star-field background
│   ├── SpherePlanet.jsx      # Planet mesh + orbit line + frame updates
│   └── Sun.jsx               # Procedural animated Sun shader
├── data/
│   └── keplerianElements.js  # NASA orbital elements + visual display settings
│   └── PlanetData.js         # Planets Info

├── hooks/
│   ├── useThree.js           # Access shared Three.js context
│   └── useFrame.js           # Register per-frame callbacks
└── utils/
    └── keplerSolver.js       # NASA formula implementation and orbit math
```

## How NASA Data Is Used

The project uses the **NASA/JPL “Approximate Positions of the Planets”** model.

NASA provides, for each planet:

- semi-major axis `a`
- eccentricity `e`
- inclination `I`
- mean longitude `L`
- longitude of perihelion `varpi`
- longitude of ascending node `Omega`
- and a rate of change for each value per Julian century

These values are stored in `keplerianElements.js` and updated for the current simulation date inside `keplerSolver.js`.

### NASA-based pipeline implemented in this project

1. Convert a JavaScript `Date` into **Julian centuries past J2000.0**.
2. Update each planet’s orbital elements using NASA’s published rates.
3. Compute:
   - argument of perihelion `omega = varpi - Omega`
   - mean anomaly `M = L - varpi`
4. Solve **Kepler’s Equation** iteratively to find the eccentric anomaly `E`.
5. Compute the planet’s position in its orbital plane.
6. Rotate that position into the J2000 ecliptic / equatorial frame.
7. Remap the result into **Three.js Y-up coordinates**.
8. Scale the astronomical distance into scene units using `AU_TO_UNITS`.

This means the planets are not moving on fake circular paths. Their positions are computed from orbital elements for the simulated time.

## Accuracy and Scope

This project is based on the NASA/JPL **approximate** planetary-position model, not the full high-precision ephemeris system.
It is well suited for visualization and educational use, especially within the validity range of the selected table.

The current implementation uses the **Table 1** model from the NASA/JPL page, which is valid for:

- **1800 AD to 2050 AD**

For Earth, the dataset uses **EM Bary** (Earth–Moon Barycenter), which is a common approximation for this type of visualization.

## Visual Scaling

This orrery uses two different scales:

1. **Orbital distance scale** — based on astronomical units and converted with `AU_TO_UNITS`
2. **Planet size scale** — controlled by `PLANET_VISUALS.radius`

Planet radii in the scene are intentionally **not true physical scale**. They are chosen for readability so that planets remain visible relative to the much larger orbital distances.

## Getting Started

### Install

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

## References

- NASA/JPL Solar System Dynamics — **Approximate Positions of the Planets**  
  https://ssd.jpl.nasa.gov/planets/approx_pos.html

- Video reference used for creating the Sun  
  https://www.youtube.com/watch?v=3krH52AhPqk

- Ashima / Stefan Gustavson WebGL noise routines  
  https://github.com/ashima/webgl-noise