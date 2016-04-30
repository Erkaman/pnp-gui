
/* global requestAnimationFrame */

var bunny = require('bunny');
var mat4 = require('gl-mat4');
var vec3 = require('gl-vec3');
var Geometry = require('gl-geometry');
var glShader = require('gl-shader');
var normals = require('normals');
var glslify = require('glslify')
var createOrbitCamera = require('orbit-camera');
var shell = require("gl-now")();
var createGui = require("../index.js");
var cameraPosFromViewMatrix = require('gl-camera-pos-from-view-matrix');
var dragon = require('stanford-dragon/3');
var boundingBox = require('vertices-bounding-box');
var transform = require('geo-3d-transform-mat4');
var randomArray = require('random-array');

var demo1Shader, demo2Shader, bunnyGeo, dragonGeo, planeGeo;

var camera = createOrbitCamera([0, -1000, 0], [0, 0, 0], [0, 1, 0]);

var mouseLeftDownPrev = false;

const RENDER_BUNNY = 0;
const RENDER_DRAGON = 1;
const DEMO_MODEL = 2;
const DEMO_HEIGHTMAP = 3;

/*
 Variables that can be modified through the GUI.
 */

var bg = [0.6, 0.7, 1.0]; // clear color.
var demo = {val: DEMO_MODEL};

var demo1DiffuseColor = [0.42, 0.34, 0.0];
var demo1AmbientLight = [0.77, 0.72, 0.59];
var demo1LightColor = [0.40, 0.47, 0.0];
var demo1SunDir = [-0.69, 1.33, 0.57];
var demo1SpecularPower = {val: 12.45};
var demo1HasSpecular = {val: true};
var demo1RenderModel = {val: RENDER_BUNNY};

var demo2AmbientLight = [0.85, 0.52, 0.66];
var demo2LightColor = [0.38, 0.44, 0.03];
var demo2SunDir = [1.35, 0.61, 1.12];
var demo2SnowColor = [0.6, 0.6, 0.6];
var demo2GrassColor = [0.12, 0.34, 0.12];
var demo2SandColor = [0.50, 0.4, 0.21];
var demo2HeightScale = {val: 200.0};
var demo2NoiseScale = {val: 2.0};
var demo2HeightmapPosition = [0.0, 0.0];

var demo2TextureNoiseScale = {val: 0.3};
var demo2TextureNoiseStrength = {val: 0.01};


const demo1Vert = `
precision mediump float;
attribute vec3 aPosition;
attribute vec3 aNormal;
varying vec3 vNormal;
varying vec3 vPosition;
uniform mat4 uProjection;
uniform mat4 uView;
void main() {
  vNormal = aNormal;
  vPosition = aPosition;
  
  gl_Position = uProjection * uView * vec4(aPosition, 1.0);
}
`

const demo1Frag = `
precision mediump float;
varying vec3 vNormal;
varying vec3 vPosition;
uniform vec3 uDiffuseColor;
uniform vec3 uAmbientLight;
uniform vec3 uLightColor;
uniform vec3 uLightDir;
uniform vec3 uEyePos;
uniform mat4 uView;
uniform float uSpecularPower;
uniform float uHasSpecular;
void main() {
    vec3 n = vNormal;
    vec3 l = normalize(uLightDir);
    vec3 v = normalize(uEyePos - vPosition);
    vec3 ambient = uAmbientLight * uDiffuseColor;
    vec3 diffuse = uDiffuseColor * uLightColor * dot(n, l) ;
    vec3 specular = pow(clamp(dot(normalize(l+v),n),0.0,1.0)  , uSpecularPower) * vec3(1.0,1.0,1.0);
    
    gl_FragColor = vec4(ambient + diffuse + specular*uHasSpecular, 1.0);
}
`

// center geometry on (0,0,0)
function centerGeometry(geo, scale) {

    // Calculate the bounding box.
    var bb = boundingBox(geo.positions);

    // Translate the geometry center to the origin.
    var translate = [-0.5 * (bb[0][0] + bb[1][0]), -0.5 * (bb[0][1] + bb[1][1]), -0.5 * (bb[0][2] + bb[1][2])];
    var m = mat4.create();
    mat4.scale(m, m, [scale, scale, scale]);
    mat4.translate(m, m, translate);

    geo.positions = transform(geo.positions, m)
}

// create a flat plane, that's been tesselated into n quads(rendered as triangles) on the width and depth.
function createPlane(n) {
    var positions = [];
    var cells = [];

    for (var iy = 0; iy <= n; ++iy) {
        for (var ix = 0; ix <= n; ++ix) {
            var x = -1 / 2 + ix / n;
            var y = 1 / 2 - iy / n;
            positions.push([x, 0, y]);
            if (iy < n && ix < n) {
                cells.push([iy * (n + 1) + ix + 1, (iy + 1) * (n + 1) + ix + 1, iy * (n + 1) + ix]);
                cells.push([iy * (n + 1) + ix, (iy + 1) * (n + 1) + ix + 1, (iy + 1) * (n + 1) + ix]);
            }
        }
    }

    return {positions: positions, cells: cells};
}

shell.on("gl-init", function () {
    var gl = shell.gl

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    gui = new createGui(gl)
    gui.windowSizes = [360, 580];

    centerGeometry(bunny, 80.0);
    bunnyGeo = Geometry(gl)
        .attr('aPosition', bunny.positions)
        .attr('aNormal', normals.vertexNormals(bunny.cells, bunny.positions))
        .faces(bunny.cells)

    centerGeometry(dragon, 16.0);
    dragonGeo = Geometry(gl)
        .attr('aPosition', dragon.positions)
        .attr('aNormal', normals.vertexNormals(dragon.cells, dragon.positions))
        .faces(dragon.cells)

    var plane = createPlane(200);

    planeGeo = Geometry(gl)
        .attr('aPosition', plane.positions)
        .attr('aNormal', normals.vertexNormals(plane.cells, plane.positions))
        .faces(plane.cells);

    demo1Shader = glShader(gl, demo1Vert, demo1Frag);
    demo2Shader = glShader(gl,
        glslify("./demo2Vert.glsl"),
        glslify("./demo2Frag.glsl"));

});

function demo1Randomize() {
    demo1DiffuseColor = randomArray(0, 1).oned(3);
    demo1AmbientLight = randomArray(0, 1).oned(3);
    demo1LightColor = randomArray(0, 1).oned(3);
    demo1SunDir = randomArray(-2, +2).oned(3);
    demo1SpecularPower.val = Math.round(randomArray(0, 40).oned(1)[0]);
}

function demo2RandomizeLighting() {
    demo2AmbientLight = randomArray(0, 1).oned(3);
    demo2LightColor = randomArray(0, 1).oned(3);
    demo2SunDir = randomArray(0, +2).oned(3);
}

function demo2RandomizeColor() {
    demo2SnowColor = randomArray(0, 1).oned(3);
    demo2GrassColor = randomArray(0, 1).oned(3);
    demo2SandColor = randomArray(0, 1).oned(3);
}

shell.on("gl-render", function (t) {
    var gl = shell.gl
    var canvas = shell.canvas;

    gl.clearColor(bg[0], bg[1], bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    var model = mat4.create();
    var projection = mat4.create();
    var scratchMat = mat4.create();
    var view = camera.view(scratchMat);
    var scratchVec = vec3.create();

    mat4.perspective(projection, Math.PI / 2, canvas.width / canvas.height, 0.1, 10000.0);

    if (demo.val == DEMO_MODEL) {
        demo1Shader.bind();

        demo1Shader.uniforms.uView = view;
        demo1Shader.uniforms.uProjection = projection;
        demo1Shader.uniforms.uDiffuseColor = demo1DiffuseColor;
        demo1Shader.uniforms.uAmbientLight = demo1AmbientLight;
        demo1Shader.uniforms.uLightColor = demo1LightColor;
        demo1Shader.uniforms.uLightDir = demo1SunDir;
        demo1Shader.uniforms.uEyePos = cameraPosFromViewMatrix(scratchVec, view);
        demo1Shader.uniforms.uSpecularPower = demo1SpecularPower.val;
        demo1Shader.uniforms.uHasSpecular = demo1HasSpecular.val ? 1.0 : 0.0;

        if (demo1RenderModel.val == RENDER_BUNNY) {
            bunnyGeo.bind(demo1Shader);
            bunnyGeo.draw();
        } else if (demo1RenderModel.val == RENDER_DRAGON) {
            dragonGeo.bind(demo1Shader);
            dragonGeo.draw();
        }
    } else {
        demo2Shader.bind();

        demo2Shader.uniforms.uView = view;
        demo2Shader.uniforms.uProjection = projection;

        demo2Shader.uniforms.uAmbientLight = demo2AmbientLight;
        demo2Shader.uniforms.uLightColor = demo2LightColor;
        demo2Shader.uniforms.uLightDir = demo2SunDir;

        demo2Shader.uniforms.uSnowColor = demo2SnowColor;
        demo2Shader.uniforms.uGrassColor = demo2GrassColor;
        demo2Shader.uniforms.uSandColor = demo2SandColor;

        demo2Shader.uniforms.uHeightScale = demo2HeightScale.val;
        demo2Shader.uniforms.uNoiseScale = demo2NoiseScale.val;
        demo2Shader.uniforms.uPosition = demo2HeightmapPosition;

        demo2Shader.uniforms.uTextureNoiseScale = demo2TextureNoiseScale.val;
        demo2Shader.uniforms.uTextureNoiseStrength = demo2TextureNoiseStrength.val;

        planeGeo.bind(demo2Shader);
        planeGeo.draw();
    }

    var pressed = shell.wasDown("mouse-left");
    var io = {
        mouseLeftDownCur: pressed,
        mouseLeftDownPrev: mouseLeftDownPrev,

        mousePosition: shell.mouse,
        mousePositionPrev: shell.prevMouse
    };
    mouseLeftDownPrev = pressed;

    gui.begin(io, "Window");

    gui.textLine("Choose a Demo");
    gui.radioButton("Model", demo, DEMO_MODEL);
    gui.sameLine();
    gui.radioButton("Heightmap", demo, DEMO_HEIGHTMAP);
    gui.separator();

    if (demo.val == DEMO_MODEL) {

        gui.textLine("Lighting Settings");

        gui.radioButton("Bunny", demo1RenderModel, RENDER_BUNNY);
        gui.sameLine();
        gui.radioButton("Dragon", demo1RenderModel, RENDER_DRAGON);

        gui.draggerRgb("Ambient Light", demo1AmbientLight);
        gui.draggerRgb("Diffuse Color", demo1DiffuseColor);
        gui.draggerRgb("Light Color", demo1LightColor);

        gui.checkbox("Has Specular Lighting", demo1HasSpecular);
        if (demo1HasSpecular.val)
            gui.sliderFloat("Specular Power", demo1SpecularPower, 0, 40);

        gui.draggerFloat3("Light Direction", demo1SunDir, [-2, +2], ["X:", "Y:", "Z:"]);

        if (gui.button("Randomize")) {
            demo1Randomize();
        }
    } else {
        gui.textLine("Lighting Settings");

        gui.draggerRgb("Ambient Light", demo2AmbientLight);
        gui.draggerRgb("Light Color", demo2LightColor);
        gui.draggerFloat3("Light Direction", demo2SunDir, [0, +2], ["X:", "Y:", "Z:"]);

        if (gui.button("Randomize")) {
            demo2RandomizeLighting();
        }
        gui.separator();

        gui.textLine("Heightmap Geometry");

        gui.sliderFloat("Height Scale", demo2HeightScale, 0, 400);
        gui.sliderFloat("Noise Scale", demo2NoiseScale, 0, 20.0);
        gui.draggerFloat2("Position", demo2HeightmapPosition, [-10, +10], ["X:", "Z:"]);

        gui.separator();

        gui.textLine("Heightmap Color");

        gui.draggerRgb("Snow Color", demo2SnowColor);
        gui.draggerRgb("Grass Color", demo2GrassColor);
        gui.draggerRgb("Sand Color", demo2SandColor);


        if (gui.button("Randomize")) {
            demo2RandomizeColor();
        }

        gui.sliderFloat("Color Noise Scale", demo2TextureNoiseScale, 0.01, 0.4);
        gui.sliderFloat("Color Noise Strength", demo2TextureNoiseStrength, 0.01, 0.2);
    }

    gui.separator();

    gui.textLine("Miscellaneous");
    gui.draggerRgb("Background", bg);

    gui.end(gl, canvas.width, canvas.height);
});

shell.on("tick", function () {

    // if interacting with the GUI, do not let the mouse control the camera.
    if (gui.hasMouseFocus())
        return;

    if (shell.wasDown("mouse-left")) {
        var speed = 2.0;
        camera.rotate([(shell.mouseX / shell.width - 0.5) * speed, (shell.mouseY / shell.height - 0.5) * speed],
            [(shell.prevMouseX / shell.width - 0.5) * speed, (shell.prevMouseY / shell.height - 0.5) * speed])
    }
    if (shell.scroll[1]) {
        camera.zoom(shell.scroll[1] * 0.6);
    }
});