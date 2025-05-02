import { useContext } from 'react'
import { ThreeContext } from '../components/Canvas'

/**
 * Allows to access data of ThreeContext defined in Canvas
 * @returns {{ scene: THREE.Scene, camera: THREE.Camera, registerFrame: Function, unregisterFrame: Function }}
 */
export default function useThree() {
   const ctx = useContext(ThreeContext);
   if (!ctx) throw new Error('useThree() must be called inside <Canvas>');
   return ctx;
}
