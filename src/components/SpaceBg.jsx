import React, { useEffect } from 'react'
import * as THREE from 'three'
import useThree from '../hooks/useThree'

function SpaceBg() {
   const { scene } = useThree();

   useEffect(() => {
      // ---------------- Build the raw positions array ----------------
      const starCount = 6000;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
         positions[i * 3 + 0] = (Math.random() - 0.5) * 600; // x
         positions[i * 3 + 1] = (Math.random() - 0.5) * 600; // y
         positions[i * 3 + 2] = (Math.random() - 0.5) * 600; // z
      }

      // -------- Create the BufferGeometry and attach positions --------
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
         'position',
         new THREE.BufferAttribute(positions, 3)
      );

      // ----------- Generate a little radial‐gradient sprite -----------
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(
         size / 2, size / 2, 0,
         size / 2, size / 2, size / 2
      );
      gradient.addColorStop(0.0, 'rgba(255,255,255,1.0)');
      gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
      gradient.addColorStop(0.4, 'rgba(255,255,255,0.2)');
      gradient.addColorStop(1.0, 'rgba(255,255,255,0.0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      const starSprite = new THREE.CanvasTexture(canvas);
      starSprite.minFilter = THREE.LinearFilter;

      // ------------------- Create the PointsMaterial -------------------
      const mat = new THREE.PointsMaterial({
         size: 0.7,
         map: starSprite,
         transparent: true,
         depthWrite: false,
         blending: THREE.AdditiveBlending,
         color: 0xaaaaaa
      });
      
      // --------- Build the Points mesh and add it to the scene ---------
      const stars = new THREE.Points(geo, mat);
      scene.add(stars);

      // ---------------------- Cleanup on unmount -----------------------
      return () => {
         scene.remove(stars);
         geo.dispose();
         mat.dispose();
         starSprite.dispose();
      }

   }, [scene]);


   return null;
}

export default SpaceBg;