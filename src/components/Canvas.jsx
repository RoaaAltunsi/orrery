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
        const renderer = new THREE.WebGLRenderer({
            antialias: true, // smoother edges
            alpha: true  // allow transparent background
        });

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.toneMapping = THREE.ReinhardToneMapping
        renderer.toneMappingExposure = 1.5;
        mountRef.current.appendChild(renderer.domElement);

        // ------------------- Scene & Camera --------------------
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75, // ANGLE
            window.innerWidth / window.innerHeight,
            0.1, // NEAR
            1000 // FAR
        );
        camera.position.set(0, 0, 30);

        // ---- Set up OrbitControls for interactive rotation ----
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.dampingFactor = true;

        // ------------- Postprocessing: Filter chain ------------
        // string together a series of effects, called passes
        const composer = new EffectComposer(renderer);
        composer.setSize(window.innerWidth, window.innerHeight);
        composer.addPass(new RenderPass(scene, camera)); // pass1: render the scene normally into an offscreen buffer
        const bloom = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.2, 0.4, 0.85
        );
        composer.addPass(bloom); // pass2: bloom/glow effect on bright areas

        // ---------------- Frame callback registry ---------------
        // We want child components (Sun, Earth…) to register update callbacks each frame
        const frameCallbacks = new Set();
        const registerFrame = (cb) => frameCallbacks.add(cb);
        const unregisterFrame = (cb) => frameCallbacks.delete(cb);

        // -------------------- Animation loop --------------------
        const animate = () => {
            requestAnimationFrame(animate); // schedule the next frame
            controls.update();
            frameCallbacks.forEach((cb) => cb());
            composer.render();
        }
        animate();

        // -------------------- Resize Handler --------------------
        const onResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            composer.setSize(w, h);
        }
        window.addEventListener('resize', onResize);

        // provice context to the children
        setCtxValue({ scene, camera, registerFrame, unregisterFrame });

        // ------------------ Cleanup on unmount ------------------
        return () => {
            window.removeEventListener('resize', onResize);
            mountRef.current?.removeChild(renderer.domElement);
            renderer.dispose();
            composer.dispose();
        }

    }, []);


    return (
        <>
            {/* this div holds the WebGL canvas */}
            <div ref={mountRef} style={{ position: 'fixed', top: 0, left: 0 }} />
            {/* once ctxValue is ready, children can use useThree() */}
            {ctxValue && (
                <ThreeContext.Provider value={ctxValue}>
                    {children}
                </ThreeContext.Provider>
            )}
        </>
    )
};

export default Canvas;