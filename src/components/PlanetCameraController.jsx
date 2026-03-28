import React, { useMemo } from 'react'
import * as THREE from 'three'
import useThree from '../hooks/useThree'
import useFrame from '../hooks/useFrame'

const OVERVIEW_POSITION = new THREE.Vector3(0, 500, 700)
const OVERVIEW_TARGET = new THREE.Vector3(0, 0, 0)

function PlanetCameraController({ selectedPlanet, planetObjects, planetRadii }) {
  const { camera, controls } = useThree()

  const desiredPosition = useMemo(() => new THREE.Vector3(), [])
  const desiredTarget = useMemo(() => new THREE.Vector3(), [])
  const offset = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    if (!controls) return

    if (!selectedPlanet) {
      desiredPosition.copy(OVERVIEW_POSITION)
      desiredTarget.copy(OVERVIEW_TARGET)
      controls.enablePan = true
      controls.minDistance = 10
      controls.maxDistance = 2000
    } else {
      const targetObject = planetObjects[selectedPlanet]
      if (!targetObject) return

      const radius = planetRadii[selectedPlanet] ?? 1

      desiredTarget.copy(targetObject.position)
      offset.set(radius * 5, radius * 2 + 4, radius * 9 + 16)
      desiredPosition.copy(targetObject.position).add(offset)

      controls.enablePan = false
      controls.minDistance = Math.max(radius * 2, 4)
      controls.maxDistance = 200
    }

    camera.position.lerp(desiredPosition, 0.08)
    controls.target.lerp(desiredTarget, 0.08)
  })

  return null
}

export default PlanetCameraController