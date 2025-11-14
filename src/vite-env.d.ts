// FIX: Add a triple-slash directive to ensure React's global types are loaded before augmentation.
/// <reference types="react" />

// NOTE: The vite/client reference is commented out as it was reported to cause errors.
// /// <reference types="vite/client" />

/**
 * Augment the global JSX namespace to include types for @react-three/fiber.
 * This allows using components like <mesh>, <ambientLight>, etc., in JSX without
 * TypeScript errors. This is defined in the global scope as a script-style
 * type definition file rather than a module to avoid potential module resolution
 * issues with type augmentation.
 */
declare global {
  namespace JSX {
    interface IntrinsicElements extends import('@react-three/fiber').ThreeElements {}
  }
}

// FIX: Add an empty export to make this file a module, which is required for global augmentation.
// This is now handled by making this a script-style declaration file (no imports/exports).
