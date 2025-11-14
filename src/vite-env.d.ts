// FIX: Replaced side-effect import with a namespace import for React to resolve namespace errors.
// Also removed the vite/client reference as it was causing a type definition error.
import * as React from 'react';
import type { ThreeElements } from '@react-three/fiber';

/**
 * This file corrects project-wide type errors by properly augmenting the global JSX namespace.
 * It merges React's intrinsic elements with those from @react-three/fiber, allowing
 * both standard HTML/SVG elements and 3D components to be used in JSX without type errors.
 */
declare global {
  namespace JSX {
    interface IntrinsicElements extends React.JSX.IntrinsicElements, ThreeElements {}
  }
}
