import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import useThree from '../hooks/useThree'
import useFrame from '../hooks/useFrame'

// --------- Define the Vertex Shader ---------
// This vertex shader passes the UV coordinates to the fragment shader
const vertexShader = `
   varying vec2 vUv;
   varying vec3 vPosition;
   void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }
`;

// --------- Define the Fragment Shader -------
// This shader implements a simplex noise function and uses it to compute a "noisy" color
const fragmentShader = `
vec4 mod289(vec4 x) {
   return x - floor(x * (1.0 / 289.0)) * 289.0;
}
float mod289(float x) {
   return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 permute(vec4 x) {
   return mod289(((x * 34.0) + 10.0) * x);
}
float permute(float x) {
   return mod289(((x * 34.0) + 10.0) * x);
}
vec4 taylorInvSqrt(vec4 r) {
   return 1.79284291400159 - 0.85373472095314 * r;
}
float taylorInvSqrt(float r) {
   return 1.79284291400159 - 0.85373472095314 * r;
}
vec4 grad4(float j, vec4 ip) {
   const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
   vec4 p, s;
   p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
   p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
   s = vec4(lessThan(p, vec4(0.0)));
   p.xyz = p.xyz + (s.xyz * 2.0 - 1.0) * s.www;
   return p;
}
#define F4 0.309016994374947451

float snoise(vec4 v) {
   const vec4 C = vec4(0.138196601125011,  // (5 - sqrt(5))/20
                        0.276393202250021,  // 2 * G4
                        0.414589803375032,  // 3 * G4
                     -0.447213595499958); // -1 + 4 * G4
   vec4 i  = floor(v + dot(v, vec4(F4)));
   vec4 x0 = v - i + dot(i, C.xxxx);

   vec4 i0;
   vec3 isX = step(x0.yzw, x0.xxx);
   vec3 isYZ = step(x0.zww, x0.yyz);
   i0.x = isX.x + isX.y + isX.z;
   i0.yzw = 1.0 - isX;
   i0.y += isYZ.x + isYZ.y;
   i0.zw += 1.0 - isYZ.xy;
   i0.z += isYZ.z;
   i0.w += 1.0 - isYZ.z;

   vec4 i3 = clamp(i0, 0.0, 1.0);
   vec4 i2 = clamp(i0 - 1.0, 0.0, 1.0);
   vec4 i1 = clamp(i0 - 2.0, 0.0, 1.0);

   vec4 x1 = x0 - i1 + C.xxxx;
   vec4 x2 = x0 - i2 + C.yyyy;
   vec4 x3 = x0 - i3 + C.zzzz;
   vec4 x4 = x0 + C.wwww;

   i = mod289(i);
   float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);
   vec4 j1 = permute(permute(permute(permute(
               i.w + vec4(i1.w, i2.w, i3.w, 1.0))
            + i.z + vec4(i1.z, i2.z, i3.z, 1.0))
            + i.y + vec4(i1.y, i2.y, i3.y, 1.0))
            + i.x + vec4(i1.x, i2.x, i3.x, 1.0));

   vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0);

   vec4 p0 = grad4(j0, ip);
   vec4 p1 = grad4(j1.x, ip);
   vec4 p2 = grad4(j1.y, ip);
   vec4 p3 = grad4(j1.z, ip);
   vec4 p4 = grad4(j1.w, ip);

   vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
   p0 *= norm.x;
   p1 *= norm.y;
   p2 *= norm.z;
   p3 *= norm.w;
   p4 *= taylorInvSqrt(dot(p4, p4));

   vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
   vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)), 0.0);
   m0 = m0 * m0;
   m1 = m1 * m1;

   float noise = 49.0 * ( dot(m0*m0, vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2)))
                        + dot(m1*m1, vec2(dot(p3, x3), dot(p4, x4))) );
   return noise;
}

uniform float time;
varying vec2 vUv;
varying vec3 vPosition;

float fbm(vec4 p) {
   float sum = 0.;
   float amp = 1.;
   float scale = 1.;
   for(int i=0; i<6; i++) {
      sum += snoise(p*scale)*amp;
      p.w += 100.;
      amp *= 0.9;
      scale *= 2.;
   }
   return sum;
}

void main() {
   // Compute noise based on UV coordinates (scaled) and time for animation
   vec4 p = vec4(vPosition*0.3, time*0.05);
   float noisy = fbm(p);

   vec4 p1 = vec4(vPosition*0.3, time*0.1);
   float spots = max(snoise(p1), 0.1);

   // combine base noise and spot intensity
   float intensity = noisy * mix(1.5, spots, 0.5);

   // define a deep-orange and a bright-yellow
   vec3 deepOrange  = vec3(3.6, 0.04, 0.0);
   vec3 brightYellow = vec3(0.5, 0.6, 0.0);

   // interpolate between them by our intensity
   vec3 sunColor = mix(deepOrange, brightYellow, intensity);

   gl_FragColor = vec4(sunColor, 1.0);
}
`;

export default function Sun() {
   const { scene } = useThree();
   const meshRef = useRef();
   const uniforms = useRef({ time: { value: 0.0 } }).current;

   useEffect(() => {
      const geo = new THREE.SphereGeometry(10, 50, 50);
      const mat = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });

      const mesh = new THREE.Mesh(geo, mat);
      meshRef.current = mesh;
      // Add the mesh into the shared scene
      scene.add(mesh);

      return () => {
         scene.remove(mesh);
         geo.dispose();
         mat.dispose();
      }
   }, [scene, uniforms])

   useFrame(() => {
      uniforms.time.value += 0.01;
   });


   return null;
}