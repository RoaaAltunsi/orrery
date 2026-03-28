import React, { useCallback, useEffect, useRef } from 'react'
import * as THREE from 'three'
import useThree from '../hooks/useThree'
import useFrame from '../hooks/useFrame'
import { KEPLERIAN_ELEMENTS, AU_TO_UNITS } from '../data/keplerianElements'
import { dateToT, orbitPoints, planetPosition } from '../utils/keplerSolver'

function SpherePlanet({
  name,
  textureUrl,
  ringTextureUrl = null,
  radius,
  rotationSpeed = 0.5,    // radians per simulated second for self-spin
  hasRings = false,
  orbitDaysPerSecond = 5, // simulation speed for orbit motion
}) {
  const { scene } = useThree();

  const groupRef = useRef(null);
  const planetMeshRef = useRef(null);
  const orbitLineRef = useRef(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(textureUrl);

    const group = new THREE.Group();
    group.frustumCulled = false;

    const geo = new THREE.SphereGeometry(radius, 64, 64);
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.0,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;

    group.add(mesh);

    // -------------------------- Rings --------------------------
    let ringGeo = null;
    let ringMat = null;
    let ringTexture = null;

    if (hasRings) {
      const innerR = radius * 1.4;
      const outerR = radius * 2.4;
      ringGeo = new THREE.RingGeometry(innerR, outerR, 64);

      // Remap UVs so the texture stretches radially across the ring
      const pos = ringGeo.attributes.position;
      const uv = ringGeo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(pos, i);
        const dist = v.length();
        uv.setXY(i, (dist - innerR) / (outerR - innerR), 0.5);
      }

      if (ringTextureUrl) {
        ringTexture = loader.load(ringTextureUrl);

        ringMat = new THREE.MeshBasicMaterial({
          map: ringTexture,
          alphaMap: ringTexture, // alpha channel drives per-pixel transparency
          side: THREE.DoubleSide,
          transparent: true,
          depthWrite: false,       // prevents z-fighting with the planet sphere
        });
      } else {
        // Fallback solid colour ring if no texture is provided
        ringMat = new THREE.MeshBasicMaterial({
          color: 0xc2a87a,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
      }

      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    }

    // -------------------------- Orbit path --------------------------
    const now = new Date();
    const T = dateToT(now);
    const rawPoints = orbitPoints(KEPLERIAN_ELEMENTS[name], T, AU_TO_UNITS, 360);
    const points = rawPoints.map((p) => new THREE.Vector3(p.x, p.y, p.z));

    const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x4488cc,
      transparent: true,
      opacity: 0.55,
    });
    const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);

    const initPos = planetPosition(KEPLERIAN_ELEMENTS[name], AU_TO_UNITS, now);
    group.position.set(initPos.x, initPos.y, initPos.z);

    scene.add(group);
    scene.add(orbitLine);

    groupRef.current = group;
    planetMeshRef.current = mesh;
    orbitLineRef.current = orbitLine;

    return () => {
      scene.remove(group);
      scene.remove(orbitLine);

      geo.dispose();
      mat.dispose();
      texture.dispose();
      orbitGeo.dispose();
      orbitMat.dispose();

      if (ringGeo) ringGeo.dispose();
      if (ringMat) ringMat.dispose();
      if (ringTexture) ringTexture.dispose();
    };
  }, [scene, name, textureUrl, ringTextureUrl, radius, hasRings]);

  const onFrame = useCallback(({ deltaSec, simDate }) => {
    if (!groupRef.current) return;

    simDate.setTime(simDate.getTime() + deltaSec * orbitDaysPerSecond * 86400000);

    const pos = planetPosition(KEPLERIAN_ELEMENTS[name], AU_TO_UNITS, simDate);
    groupRef.current.position.set(pos.x, pos.y, pos.z);

    if (planetMeshRef.current) {
      planetMeshRef.current.rotation.y += rotationSpeed * deltaSec;
    }
  }, [name, orbitDaysPerSecond, rotationSpeed]);

  useFrame(onFrame);

  return null;
}

export default SpherePlanet;