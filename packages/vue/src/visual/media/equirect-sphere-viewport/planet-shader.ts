/**
 * Unified equirect viewport: rectilinear (Three.js unproject) blended to stereographic
 * little-planet. Yaw/pitch define the projection center (center of attention).
 */
export const VIEWPORT_VERTEX_SHADER = `
varying vec2 vNdc;
void main() {
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const VIEWPORT_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D map;
uniform mat4 projectionMatrixInverse;
uniform mat4 cameraMatrixWorld;
uniform vec3 cameraOrigin;
uniform mat3 viewRot;
uniform float planetMix;
uniform float planetSpread;
uniform float aspect;
uniform float flipInterior;

varying vec2 vNdc;

const float PI = 3.141592653589793;

vec3 cameraWorldRay(vec2 ndc) {
  vec4 clip = vec4(ndc.x, ndc.y, 0.5, 1.0);
  vec4 view = projectionMatrixInverse * clip;
  view /= view.w;
  vec4 world = cameraMatrixWorld * view;
  return normalize(world.xyz - cameraOrigin);
}

/** Stereographic disk in camera space; center = look direction (0,0,-1). */
vec3 stereographicLocal(vec2 ndc) {
  vec2 p = ndc * planetSpread;
  float r2 = dot(p, p);
  return vec3(2.0 * p.x, 2.0 * p.y, r2 - 1.0) / (1.0 + r2);
}

/** Match Three.js SphereGeometry UV + horizontal flip used on interior sphere. */
vec2 equirectUv(vec3 dir) {
  vec3 d = normalize(dir);
  float theta = acos(clamp(d.y, -1.0, 1.0));
  float phi = atan(d.z, -d.x);
  float u = phi / (2.0 * PI) + 0.5;
  float v = 1.0 - theta / PI;
  if (flipInterior > 0.5) {
    u = 1.0 - u;
  }
  return vec2(u, v);
}

void main() {
  vec2 ndc = vNdc;
  ndc.x *= aspect;

  float mixAmt = clamp(planetMix, 0.0, 1.0);
  vec3 dirRect = cameraWorldRay(ndc);
  vec3 dirStereo = viewRot * stereographicLocal(ndc);
  vec3 dir = normalize(mix(dirRect, dirStereo, mixAmt));

  gl_FragColor = texture2D(map, equirectUv(dir));
}
`;
