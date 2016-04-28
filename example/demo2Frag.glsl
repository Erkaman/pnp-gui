precision mediump float;


#pragma glslify: random = require(glsl-random)
#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)

varying vec3 vNormal;
varying vec3 vColor;
varying float vHeight;
varying vec3 vPosition;


uniform vec3 uAmbientLight;
uniform vec3 uLightColor;
uniform vec3 uLightDir;

uniform vec3 uSnowColor;
uniform vec3 uGrassColor;
uniform vec3 uSandColor;

uniform float uTextureNoiseScale;
uniform float uTextureNoiseStrength;


vec3 terrainColor() {

    float snowHeight = 0.5;
    float grassHeight = -0.4;

    float s = 0.1;

    vec3 snow = uSnowColor * smoothstep(snowHeight, snowHeight+s,  vHeight);
    vec3 grass =
       uGrassColor * (1.0-smoothstep(snowHeight, snowHeight+s, vHeight)) * (smoothstep(grassHeight, grassHeight+s, vHeight));
    vec3 sand =
       uSandColor * (1.0 - smoothstep(grassHeight, grassHeight+s, vHeight));

    vec3 noise = vec3(snoise2(uTextureNoiseScale*vec2(vPosition.x, vPosition.x+vPosition.y+vPosition.z))) ;

    return (snow + grass + sand) + noise*uTextureNoiseStrength ;
}

void main() {

    vec3 n = vNormal;
    vec3 l = normalize(uLightDir);

    vec3 diffuseColor = terrainColor();

    vec3 ambient = uAmbientLight * diffuseColor;
    vec3 diffuse = diffuseColor * uLightColor * dot(n, l) ;
    
   gl_FragColor = vec4(ambient + diffuse, 1.0);



}
