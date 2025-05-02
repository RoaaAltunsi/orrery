import { useEffect } from 'react'
import useThree from './useThree'

/**
 * Register a function to run on each animation tick (before rendering) 
 * so we can update object properties for smooth, frame-by-frame animations
 * @param {()=>void} callback — called each frame
 */
export default function useFrame(callback) {
   const { registerFrame, unregisterFrame } = useThree();

   useEffect(() => {
      registerFrame(callback);
      return () => unregisterFrame(callback);
   }, [callback, registerFrame, unregisterFrame]);
}
