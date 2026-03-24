/**
 * Wrap entire 3D scene in Canvas
 */

import React, { createContext, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

/**
 * Context is a way to pass data “through” the component tree 
 * without having to thread it through every intermediate component via props
 */
export const ThreeContext = createContext(null);

function Canvas({ children }) {
  const mountRef = useRef(null);
  const [ctxValue, setCtxValue] = useState(null);

  useEffect(() => {
    // -------------- Create the WebGL renderer --------------
    // (allocate space in web page for animating 3D models)
    const w = window.innerWidth;
    const h = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true, // smoother edges
      alpha: true  // allow transparent background
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.5;
    mountRef.current.appendChild(renderer.domElement);

    // ------------------- Scene & Camera --------------------
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60, // ANGLE
      w / h,
      0.1, // NEAR
      15000 // FAR
    );
    camera.position.set(0, 500, 700);

    // ---- Set up OrbitControls for interactive rotation ----
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 2000;
    controls.target.set(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xfff4e0, 2.0, 0, 0);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // ------------- Postprocessing: Filter chain ------------
    // string together a series of effects, called passes
    const composer = new EffectComposer(renderer);
    composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera)); // pass1: render the scene normally into an offscreen buffer
    composer.addPass(
      new UnrealBloomPass(new THREE.Vector2(w, h), 1.2, 0.4, 0.85)
    ); // pass2: bloom/glow effect on bright areas

    // ---------------- Frame callback registry ---------------
    // We want child components (Sun, Earth…) to register update callbacks each frame
    const frameCallbacks = new Set();
    const registerFrame = (cb) => frameCallbacks.add(cb);
    const unregisterFrame = (cb) => frameCallbacks.delete(cb);

    // Shared simulation clock — mutated in-place every frame
    const simDate = new Date();
    let animationId = null;
    let lastNow = performance.now();
    let elapsedSec = 0;

    // -------------------- Animation loop --------------------
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const now = performance.now();
      const deltaSec = Math.min((now - lastNow) / 1000, 0.1);
      lastNow = now;
      elapsedSec += deltaSec;

      controls.update();

      frameCallbacks.forEach((cb) => {
        cb({ deltaSec, elapsedSec, simDate });
      });

      composer.render();
    };

    animate();

    // -------------------- Resize Handler --------------------
    const onResize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      composer.setSize(nw, nh);
    };

    window.addEventListener('resize', onResize);

    // Expose simDate (mutated in-place) and controls so child components
    // (e.g. CameraController) can read the live simulation date and toggle controls.
    setCtxValue({
      scene,
      camera,
      controls,
      simDate,
      registerFrame,
      unregisterFrame,
    });

    // ------------------ Cleanup on unmount ------------------
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      scene.remove(ambientLight);
      scene.remove(sunLight);
      controls.dispose();
      composer.dispose();
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div ref={mountRef} style={{ position: 'fixed', top: 0, left: 0 }} />
      {ctxValue && (
        <ThreeContext.Provider value={ctxValue}>
          {children}
        </ThreeContext.Provider>
      )}
    </>
  );
}

export default Canvas;