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

vec3 terrainColor() {


    vec3 snow = uSnowColor * smoothstep(0.5, 0.6,  vHeight);
    vec3 grass =
       uGrassColor * (1.0-smoothstep(0.5, 0.6, vHeight)) * (smoothstep(-0.1, 0.0, vHeight));
    vec3 sand =
       uSandColor * (1.0 - smoothstep(-0.1, 0.0, vHeight));

    vec3 noise = vec3(snoise2(0.3*vec2(vPosition.x, vPosition.x+vPosition.y+vPosition.z))) ;

    return (snow + grass + sand) + noise*0.01   ;
}

void main() {

    vec3 n = vNormal;
    vec3 l = normalize(uLightDir);

    vec3 diffuseColor = terrainColor();

    vec3 ambient = uAmbientLight * diffuseColor;
    vec3 diffuse = diffuseColor * uLightColor * dot(n, l) ;
    
   gl_FragColor = vec4(ambient + diffuse, 1.0);
}
