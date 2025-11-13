
// FIX: Removed reference to vite/client as it was causing a "Cannot find type definition file" error.
// /// <reference types="vite/client" />

// FIX: Augmented the global JSX namespace with types from @react-three/fiber
// to resolve TypeScript errors about unrecognized components like <mesh>, <ambientLight>, etc.
import type { ThreeElements } from '@react-three/fiber';

declare global {
  namespace JSX {
    // FIX: Merged ThreeElements into the existing IntrinsicElements interface via declaration merging.
    // The previous implementation created a circular reference.
    interface IntrinsicElements extends ThreeElements {}
  }
}

// FIX: Add an empty export to make this file a module, which is required for global augmentation.
export {};
