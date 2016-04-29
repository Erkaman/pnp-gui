precision mediump float;

attribute vec3 aPosition;
attribute vec3 aNormal;

varying vec3 vNormal;
varying vec3 vColor;
varying float vHeight;
varying vec3 vPosition;

uniform mat4 uProjection;
uniform mat4 uView;
uniform float uHeightScale;
uniform float uNoiseScale;
uniform vec2 uPosition;

#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)

float height(vec2 coord) {
  return ( snoise2(vec2(coord.xy)*uNoiseScale)) ;
}

float height(float x, float y) {
  return height(vec2(x,y)) ;
}

vec3 getNormal(vec2 texCoord)
{
  float eps = 1e-5;
  vec3 p = vec3(texCoord.x, 0.0, texCoord.y);

  // approximate the derivatives by the method of finite differences.
  vec3 va = vec3(2.0*eps, height(p.x+eps,p.z) - height(p.x-eps,p.z), 0.0 );
  vec3 vb = vec3(0.0, height(p.x,p.z+eps) - height(p.x,p.z-eps), 2.0*eps );

  return normalize(cross(normalize(vb), normalize(va) ));
}

void main() {
  // compute normal, based on the noise.
  vNormal = getNormal(aPosition.xz);

  float h = height(aPosition.xz);

  // output height.
  vHeight = h;

  float horizontalScale = 3000.0;

  // now use the height value to modify the originally flat plane.
  vec3 pos =
    100.0 * vec3(uPosition.x, 0.0, uPosition.y) +
    vec3(horizontalScale, uHeightScale, horizontalScale)* vec3(aPosition.x,h ,aPosition.z);

  // output pos.
  vPosition = pos;
  gl_Position = uProjection * uView* vec4(pos, 1.0);

// vNormal = (vec3(height(aPosition.xz)*0.5 + 0.5));

}