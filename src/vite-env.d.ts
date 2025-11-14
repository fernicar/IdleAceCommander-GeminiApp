// FIX: Add a triple-slash directive to ensure React's global types are loaded before augmentation.
/// <reference types="react" />

// NOTE: The vite/client reference is now uncommented as it is standard for Vite.
/// <reference types="vite/client" />

/**
 * Augment the global JSX namespace to include types for @react-three/fiber.
 * This allows using components like <mesh>, <ambientLight>, etc., in JSX without
 * TypeScript errors. This is defined in the global scope as a script-style
 * type definition file (no top-level imports/exports) to ensure it merges
 * with React's global JSX types.
 */
namespace JSX {
    // This extends the existing IntrinsicElements interface from React with the elements from @react-three/fiber
    interface IntrinsicElements extends import('@react-three/fiber').ThreeElements {}
}
