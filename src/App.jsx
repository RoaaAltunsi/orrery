/**
 * Root component. Adds planet-selection state on top of the existing orrery.
 *
 * selectedPlanet (string | null):
 *   null  → default view; all orbits visible, OrbitControls free
 *   name  → camera lerps to that planet; info panel appears on the right
 */

import { useState } from 'react'
import Canvas from './components/Canvas'
import SpaceBg from './components/SpaceBg'
import Sun from './components/Sun'
import SpherePlanet from './components/SpherePlanet'
import CameraController from './components/CameraController'
import PlanetList from './components/PlanetList'
import { PLANET_VISUALS } from './data/keplerianElements'

// ------------------ Texture imports -------------------
import mercuryTex from './assets/textures/mercury.jpg'
import venusTex from './assets/textures/venus.jpg'
import earthTex from './assets/textures/earth.jpg'
import marsTex from './assets/textures/mars.jpg'
import jupiterTex from './assets/textures/jupiter.jpg'
import saturnTex from './assets/textures/saturn.jpg'
import uranusTex from './assets/textures/uranus.jpg'
import neptuneTex from './assets/textures/neptune.jpg'
import saturnRingTex from './assets/textures/saturn_ring_alpha.png'

const TEXTURES = {
  Mercury: mercuryTex,
  Venus: venusTex,
  Earth: earthTex,
  Mars: marsTex,
  Jupiter: jupiterTex,
  Saturn: saturnTex,
  Uranus: uranusTex,
  Neptune: neptuneTex,
};

const RING_TEXTURES = {
  Saturn: saturnRingTex,
};

// Each real second ≈ 1.4 simulated hours at this scale
const TIME_SCALE = 5000;

export default function App() {
  const [selectedPlanet, setSelectedPlanet] = useState(null);

  return (
    <>
      {/* --------------------- Three.js scene -------------------- */}
      <Canvas>
        <SpaceBg />
        <Sun />

        {Object.entries(PLANET_VISUALS).map(([name, visuals]) => (
          <SpherePlanet
            key={name}
            name={name}
            textureUrl={TEXTURES[name]}
            ringTextureUrl={RING_TEXTURES[name]}
            radius={visuals.radius}
            hasRings={visuals.hasRings ?? false}
            timeScale={TIME_SCALE}
          />
        ))}

        {/* Drives camera to the selected planet (no-op when null) */}
        <CameraController selectedPlanet={selectedPlanet} />
      </Canvas>

      {/* --------------------- HTML overlay --------------------- */}
      <PlanetList
        selectedPlanet={selectedPlanet}
        onSelectPlanet={setSelectedPlanet}
      />
    </>
  );
}