// The reference to vite/client was causing a "Cannot find type definition file" error,
// which seems to prevent TypeScript from processing the rest of this file.
// Removing it should allow the JSX namespace augmentation below to take effect.
// /// <reference types="vite/client" />

import * as React from 'react';
import type { ThreeElements } from '@react-three/fiber';

/**
 * This file corrects project-wide type errors by properly augmenting the global JSX namespace.
 * It merges React's intrinsic elements with those from @react-three/fiber, allowing
 * both standard HTML/SVG elements and 3D components to be used in JSX without type errors.
 */
declare global {
  namespace JSX {
    // FIX: This file is being updated to correctly merge React's and @react-three/fiber's JSX element types.
    // The previous implementation was not being picked up correctly, causing project-wide type errors.
    interface IntrinsicElements extends React.JSX.IntrinsicElements, ThreeElements {}
  }
}
