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

var demo1Shader, bunnyGeo, dragonGeo;

var camera = createOrbitCamera([0, -1000, 0], [0, 0, 0], [0, 1, 0]);

var mouseLeftDownPrev = false;

const RENDER_BUNNY = 0;
const RENDER_DRAGON = 1;

/*
 Variables that can be modified through the GUI.
 */

var bg = [0.6, 0.7, 1.0]; // clear color.

var demo1DiffuseColor = [0.42, 0.34, 0.0];
var demo1AmbientLight = [0.77, 0.72, 0.59];
var demo1LightColor = [0.40, 0.47, 0.0];
var demo1SunDir = [-0.69, 1.33, 0.57];
var demo1SpecularPower = {val: 12.45};
var demo1HasSpecular = {val: true};
var demo1RenderModel = {val: RENDER_BUNNY};

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

    demo1Shader = glShader(gl, demo1Vert, demo1Frag);
});

function demo1Randomize() {
    demo1DiffuseColor = randomArray(0, 1).oned(3);
    demo1AmbientLight = randomArray(0, 1).oned(3);
    demo1LightColor = randomArray(0, 1).oned(3);
    demo1SunDir = randomArray(-2, +2).oned(3);
    demo1SpecularPower.val = Math.round(randomArray(0, 40).oned(1)[0]);
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


    var pressed = shell.wasDown("mouse-left");
    var io = {
        mouseLeftDownCur: pressed,
        mouseLeftDownPrev: mouseLeftDownPrev,

        mousePosition: shell.mouse,
        mousePositionPrev: shell.prevMouse
    };
    mouseLeftDownPrev = pressed;

    gui.begin(io, "Window");

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