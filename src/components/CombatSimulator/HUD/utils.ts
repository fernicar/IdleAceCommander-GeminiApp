/**
 * HUD Math Utilities
 * Coordinate conversions and geometric calculations for fighter jet HUD
 */

export interface SphericalCoords {
  azimuth: number;    // Horizontal angle in degrees (0-360, 0=North)
  elevation: number;  // Vertical angle in degrees (-90 to +90, 0=horizon)
  range: number;      // Distance in kilometers
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Convert Cartesian coordinates to Spherical coordinates
 * @param x - X coordinate
 * @param y - Y coordinate (up/down in Three.js)
 * @param z - Z coordinate
 * @returns Spherical coordinates { azimuth, elevation, range }
 */
export function cartesianToSpherical(x: number, y: number, z: number): SphericalCoords {
  // Calculate range (distance from origin)
  const range = Math.sqrt(x * x + y * y + z * z) / 1000; // Convert to km

  // Calculate elevation (pitch angle from horizon)
  const elevation = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);

  // Calculate azimuth (compass bearing)
  // atan2(x, z) gives us angle from North (z-axis in Three.js)
  let azimuth = Math.atan2(x, z) * (180 / Math.PI);
  
  // Normalize to 0-360 range
  if (azimuth < 0) azimuth += 360;

  return { azimuth, elevation, range };
}

/**
 * Calculate relative position of target from camera perspective
 * @param entityPos - Target position [x, y, z]
 * @param cameraPos - Camera position [x, y, z]
 * @param cameraRotation - Camera rotation [x, y, z] in radians
 * @returns Relative spherical coordinates
 */
export function calculateRelativePosition(
  entityPos: [number, number, number],
  cameraPos: [number, number, number],
  cameraRotation: [number, number, number]
): SphericalCoords {
  // Calculate relative vector from camera to entity
  const relX = entityPos[0] - cameraPos[0];
  const relY = entityPos[1] - cameraPos[1];
  const relZ = entityPos[2] - cameraPos[2];

  // Rotate vector to camera's reference frame
  // For now, simplified rotation (will be enhanced with proper quaternion math if needed)
  const yaw = cameraRotation[1]; // Y-axis rotation (heading)
  
  // Rotate around Y-axis
  const rotX = relX * Math.cos(-yaw) - relZ * Math.sin(-yaw);
  const rotZ = relX * Math.sin(-yaw) + relZ * Math.cos(-yaw);

  return cartesianToSpherical(rotX, relY, rotZ);
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Calculate shortest angular difference between two bearings
 * @returns Signed angle difference (-180 to +180)
 */
export function angleDifference(from: number, to: number): number {
  let diff = to - from;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
}

/**
 * Calculate closure rate between two entities
 * @param entity1Pos - Position [x, y, z]
 * @param entity1Vel - Velocity [x, y, z]
 * @param entity2Pos - Position [x, y, z]
 * @param entity2Vel - Velocity [x, y, z]
 * @returns Closure rate in m/s (positive = closing, negative = opening)
 */
export function calculateClosureRate(
  entity1Pos: [number, number, number],
  entity1Vel: [number, number, number],
  entity2Pos: [number, number, number],
  entity2Vel: [number, number, number]
): number {
  // Calculate relative position vector
  const dx = entity2Pos[0] - entity1Pos[0];
  const dy = entity2Pos[1] - entity1Pos[1];
  const dz = entity2Pos[2] - entity1Pos[2];
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (distance === 0) return 0;

  // Calculate relative velocity
  const dvx = entity2Vel[0] - entity1Vel[0];
  const dvy = entity2Vel[1] - entity1Vel[1];
  const dvz = entity2Vel[2] - entity1Vel[2];

  // Closure rate is negative dot product of relative velocity and relative position unit vector
  const closureRate = -(dvx * dx + dvy * dy + dvz * dz) / distance;

  return closureRate;
}

/**
 * Convert screen coordinates to normalized device coordinates (-1 to 1)
 */
export function screenToNDC(
  screenX: number,
  screenY: number,
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: (screenX / width) * 2 - 1,
    y: -(screenY / height) * 2 + 1
  };
}

/**
 * Project 3D world position to 2D screen coordinates
 * Simplified projection (for full implementation, use Three.js camera.project())
 */
export function worldToScreen(
  worldPos: Vector3D,
  cameraPos: Vector3D,
  width: number,
  height: number,
  fov: number = 75
): { x: number; y: number; visible: boolean } {
  // Calculate relative position
  const relX = worldPos.x - cameraPos.x;
  const relY = worldPos.y - cameraPos.y;
  const relZ = worldPos.z - cameraPos.z;

  // Check if behind camera
  if (relZ <= 0) {
    return { x: -1000, y: -1000, visible: false };
  }

  // Simple perspective projection
  const fovRad = (fov * Math.PI) / 180;
  const scale = Math.tan(fovRad / 2);

  const screenX = (relX / (relZ * scale)) * (width / 2) + width / 2;
  const screenY = (-relY / (relZ * scale)) * (height / 2) + height / 2;

  const visible = screenX >= 0 && screenX <= width && screenY >= 0 && screenY <= height;

  return { x: screenX, y: screenY, visible };
}

/**
 * Format distance for HUD display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Format bearing for HUD display (3 digits with leading zeros)
 */
export function formatBearing(degrees: number): string {
  const normalized = normalizeAngle(degrees);
  return normalized.toFixed(0).padStart(3, '0');
}
