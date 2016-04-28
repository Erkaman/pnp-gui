precision mediump float;

attribute vec3 aPosition;
attribute vec3 aNormal;

varying vec3 vNormal;
varying vec3 vColor;
varying float vHeight;
varying vec3 vPosition;

uniform mat4 uProjection;
uniform mat4 uView;

#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)


float height(vec2 coord) {
 return ( snoise2(vec2(coord.xy)*2.0)) ;
}

float height(float x, float y) {
    return height(vec2(x,y)) ;
}

vec3 getNormal(vec2 texCoord)
{

    float eps = 1e-5;
    vec3 p = vec3(texCoord.x, 0.0, texCoord.y);

    //eps on x axis.
    vec3 va = vec3(2.0*eps, height(p.x+eps,p.z) - height(p.x-eps,p.z), 0.0 );

    vec3 vb = vec3(0.0, height(p.x,p.z+eps) - height(p.x,p.z-eps), 2.0*eps );

    // is there not some more optimal way of doing this?
    // http://stackoverflow.com/questions/5281261/generating-a-normal-map-from-a-height-map
    vec3 n = normalize(cross(normalize(vb), normalize(va) ));

  return(n);
}

void main() {
  vNormal = getNormal(aPosition.xz);

  float horizontalScale = 3000.0;
  float heightScale = 200.0;

  float h = height(aPosition.xz);
  vHeight = h;

  vec3 pos = vec3(horizontalScale, heightScale, horizontalScale)* vec3(aPosition.x,h ,aPosition.z);
    vPosition = pos;

  gl_Position = uProjection * uView* vec4(pos, 1.0);


// vNormal = (vec3(height(aPosition.xz)*0.5 + 0.5));

}