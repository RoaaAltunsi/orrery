/**
 * Manages camera transitions between the default solar-system view and a
 * close-up focus on a selected planet.
 *
 * When a planet is selected:
 *   • OrbitControls is disabled so the lerp isn't fought each frame.
 *   • Camera smoothly moves to a position offset from the planet.
 *   • camera.lookAt() tracks the planet as it orbits.
 */

import { useCallback, useEffect } from 'react'
import * as THREE from 'three'
import useThree from '../hooks/useThree'
import useFrame from '../hooks/useFrame'
import { KEPLERIAN_ELEMENTS, AU_TO_UNITS, PLANET_VISUALS } from '../data/keplerianElements'
import { planetPosition } from '../utils/keplerSolver'

// How fast the camera lerps toward its target (0–1 per frame, ~60 fps)
const LERP_SPEED = 0.055;

export default function CameraController({ selectedPlanet }) {
  const { camera, controls, simDate } = useThree();

  // Toggle OrbitControls when focus changes
  useEffect(() => {
    if (!controls) return;
    controls.enabled = !selectedPlanet;
  }, [selectedPlanet, controls]);

  const onFrame = useCallback(() => {
    if (!selectedPlanet) return;

    // Current planet world position (tracks the moving planet every frame)
    const pos = planetPosition(
      KEPLERIAN_ELEMENTS[selectedPlanet],
      AU_TO_UNITS,
      simDate
    );
    const planetVec = new THREE.Vector3(pos.x, pos.y, pos.z);

    // Camera offset scales with planet size so small/large planets both frame well
    const radius = PLANET_VISUALS[selectedPlanet]?.radius ?? 1;
    const dist = Math.max(radius * 9, 18);

    // Position camera at a fixed angle relative to the planet
    const targetCamPos = new THREE.Vector3(
      pos.x + dist,
      pos.y + dist * 0.45,
      pos.z + dist
    );

    camera.position.lerp(targetCamPos, LERP_SPEED);
    camera.lookAt(planetVec);
  }, [camera, selectedPlanet, simDate]);

  useFrame(onFrame);

  return null;
}