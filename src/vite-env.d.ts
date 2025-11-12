// FIX: Removed reference to vite/client as it was causing a "Cannot find type definition file" error.
// /// <reference types="vite/client" />

// FIX: Augmented the global JSX namespace with types from @react-three/fiber
// to resolve TypeScript errors about unrecognized components like <mesh>, <ambientLight>, etc.
import type { ThreeElements } from '@react-three/fiber';
// FIX: Changed import 'react' to a namespace import to correctly resolve the 'React' namespace.
import * as React from 'react';

declare global {
  namespace JSX {
    // FIX: Extend from React's intrinsic elements to include standard HTML tags
    // and ThreeElements for react-three-fiber components.
    interface IntrinsicElements extends React.JSX.IntrinsicElements, ThreeElements {}
  }
}

// FIX: Add an empty export to make this file a module, which is required for global augmentation.
export {};
