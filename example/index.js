
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
var cameraPosFromViewMatrix  = require('gl-camera-pos-from-view-matrix');
var dragon = require('stanford-dragon/3');
var boundingBox = require('vertices-bounding-box');
var tform = require('geo-3d-transform-mat4');
var randomArray = require('random-array');

var demo1Shader, demo2Shader, bunnyGeo, dragonGeo, planeGeo;

var camera = createOrbitCamera(
    //[0,-15,0],
    [0,-1000,0],
    [0,0,0],
    [0,1,0]
)


const demo1Vert = `
precision mediump float;

attribute vec3 aPosition;
attribute vec3 aNormal;

varying vec3 vNormal;
varying vec3 vPosition;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

void main() {
  vNormal = aNormal;
  vPosition = aPosition;
  
  gl_Position = uProjection * uView * uModel* vec4(aPosition, 1.0);
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
    vec3 v = normalize(-(vPosition - uEyePos));

    vec3 ambient = uAmbientLight * uDiffuseColor;
    vec3 diffuse = uDiffuseColor * uLightColor * dot(n, l) ;
    vec3 specular = pow(
    clamp(dot(normalize(l+v),n),0.0,1.0)  , uSpecularPower) * vec3(1.0,1.0,1.0);
    
    gl_FragColor = vec4(ambient + diffuse + specular*uHasSpecular, 1.0);
}
`

function centerGeometry(geo, scale) {

// Calculate the bounding box.
    var bb = boundingBox(geo.positions)

// Translate the geometry center to the origin.
    var translate = [
        -0.5 * (bb[0][0] + bb[1][0]),
        -0.5 * (bb[0][1] + bb[1][1]),
        -0.5 * (bb[0][2] + bb[1][2])
    ]
    var m = mat4.create()
    mat4.scale(m, m, [scale, scale, scale])

    mat4.translate(m, m, translate)

    geo.positions = tform(geo.positions, m)
}


function createPlane(n) {
    var positions = [];
    var cells = [];

    for(var iy = 0; iy <= n; ++iy) {
        for(var ix = 0; ix <= n; ++ix) {
            var x = -1/2 + ix / n;
            var y =  1/2 - iy / n;
            positions.push([x, 0, y]);
            if (iy < n && ix < n) {
                cells.push([iy * (n+1) + ix + 1 , (iy + 1) * (n+1) + ix + 1, iy * (n+1) + ix]);
                cells.push([iy * (n+1) + ix, (iy + 1) * (n+1) + ix + 1, (iy+1) * (n+1) + ix ]);
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

    centerGeometry(bunny, 1.0);
    bunnyGeo = Geometry(gl)
        .attr('aPosition', bunny.positions)
    .attr('aNormal', normals.vertexNormals(bunny.cells, bunny.positions))
    .faces(bunny.cells)

    centerGeometry(dragon, 0.2);
    dragonGeo = Geometry(gl)
        .attr('aPosition', dragon.positions)
        .attr('aNormal', normals.vertexNormals(dragon.cells, dragon.positions))
        .faces(dragon.cells)

    // 200
    var plane = createPlane(100);

    planeGeo = Geometry(gl)
        .attr('aPosition', plane.positions)
        .attr('aNormal', normals.vertexNormals(plane.cells, plane.positions))
        .faces(plane.cells);

    demo1Shader = glShader(gl, demo1Vert, demo1Frag);
    demo2Shader = glShader(gl,
        glslify("./demo2Vert.glsl"),
        glslify("./demo2Frag.glsl"));

})

var prev = false;

const RENDER_BUNNY = 0;
const RENDER_DRAGON = 1;
const DEMO_MODEL = 2;
const DEMO_HEIGHTMAP = 3;


var bg = [0.6, 0.7, 1.0];
var demo = {val: DEMO_HEIGHTMAP};

var demo1DiffuseColor = [0.7, 0.7, 0.7];
var demo1AmbientLight = [0.3, 0.3, 0.3];
var demo1LightColor = [0.4, 0.0, 0.0];
var demo1SunDir = [0.71, 0.71, 0];
var demo1SpecularPower = {val: 4.0};
var demo1HasSpecular = {val: true};
var demo1RenderModel = {val: RENDER_BUNNY};

var demo2AmbientLight = [0.6, 0.6, 0.6];
var demo2LightColor = [0.7, 0.7, 0.7];
var demo2SunDir = [0.71, 0.71, 0];
var demo2SnowColor = [0.8, 0.8, 0.8] ;
var demo2GrassColor = [0.0, 0.5, 0.0] ;
var demo2SandColor = [0.8, 0.7, 0.2] ;





function randomize() {
    demo1DiffuseColor = randomArray(0,1).oned(3);
    demo1AmbientLight = randomArray(0,1).oned(3);
    demo1LightColor = randomArray(0,1).oned(3);
    demo1SunDir = randomArray(-2,+2).oned(3);
    demo1SpecularPower.val = Math.round(randomArray(0,40).oned(1)[0]);
}

shell.on("gl-render", function (t) {

    var gl = shell.gl

    var canvas = shell.canvas;

    gl.clearColor(bg[0], bg[1], bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);


    var model = mat4.create();
    var projection = mat4.create();
    var scratch = mat4.create();
    var view = camera.view(scratch);
    mat4.perspective(projection, Math.PI / 2, canvas.width / canvas.height, 0.1, 10000.0);

    var scratchVec = vec3.create();



    if( demo.val == DEMO_MODEL) {

        demo1Shader.bind();

        demo1Shader.uniforms.uView = view;
        demo1Shader.uniforms.uModel = model;
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


        planeGeo.bind(demo2Shader);
        planeGeo.draw();
    }

    var pressed = shell.wasDown("mouse-left");
    var io = {
        mouseLeftDownCur: pressed,
        mouseLeftDownPrev: prev,

        mousePosition:shell.mouse,
        mousePositionPrev:shell.prevMouse};
    prev = pressed;

    gui.begin(io, "Window");


    gui.textLine("Choose a Demo");
    gui.radioButton("Model", demo, DEMO_MODEL);
    gui.sameLine();
    gui.radioButton("Heightmap", demo, DEMO_HEIGHTMAP);


    gui.separator();



    if( demo.val == DEMO_MODEL) {

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

        gui.draggerFloat3("Light Direction", demo1SunDir, [[-2, +2]], ["X:", "Y:", "Z:"]);

        if (gui.button("Randomize")) {
            randomize();
        }
    } else {

        gui.textLine("Lighting Settings");

        gui.draggerRgb("Ambient Light", demo2AmbientLight);
        gui.draggerRgb("Light Color", demo2LightColor);

        gui.draggerFloat3("Light Direction", demo2SunDir, [[-2, +2]], ["X:", "Y:", "Z:"]);

        gui.separator();

        gui.textLine("Heightmap Settings");

        gui.draggerRgb("Snow Color", demo2SnowColor);
        gui.draggerRgb("Grass Color", demo2GrassColor);
        gui.draggerRgb("Sand Color", demo2SandColor);
    }

    gui.separator();

    gui.textLine("Miscellaneous");
    gui.draggerRgb("Background", bg);



    gui.end(gl,  canvas.width, canvas.height);
})

shell.on("tick", function() {

    if(gui.hasMouseFocus() )
        return;

    if(shell.wasDown("mouse-left")) {

        var speed  = 2.0;
        camera.rotate([ (shell.mouseX/shell.width-0.5)*speed, (shell.mouseY/shell.height-0.5)*speed ],
            [ (shell.prevMouseX/shell.width-0.5)*speed, (shell.prevMouseY/shell.height-0.5)*speed ])
    }
    if(shell.scroll[1]) {
        camera.zoom(shell.scroll[1] * 0.6);
    }
})


/*


 var intValue = {val: 5 };
 var floatValue = {val: 5.54 };
 var boolValue1 = {val: true };
 var boolValue2 = {val: false };
 var boolValue3 = {val: true };
 var boolValue4 = {val: false };
 var bg = [0.6, 0.7, 1.0];
 var radioButtonValue = {val: 1};
 var radioButtonValue2 = {val: 0};





 gui.textLine("Hello World!");


 if(gui.button("Eric Arneback")) {
 console.log("button");
 }


 gui.button("Button");
 gui.sameLine();
 gui.button("Lorem Ipsum");

 gui.button("NUM_SAMPLES");

 gui.textLine("A Text Line");

 gui.button("1234567890.012");


 gui.sliderInt("SAMPLES2", intValue, 2, 13);
 gui.sliderFloat("density", floatValue, 3, 19);

 gui.button("1234567890.012");

 gui.checkbox("LABEL", boolValue1);
 gui.sameLine();
 gui.checkbox("LABEL2", boolValue2);
 gui.sameLine();
 gui.checkbox("LABEL3", boolValue3);
 gui.checkbox("LABEL4", boolValue4);


 gui.sliderFloat("density", floatValue, 3, 19);

 gui.button("lol");
 gui.textLine("Another one");

 gui.radioButton("a", radioButtonValue, 0);
 gui.sameLine();
 gui.radioButton("b", radioButtonValue, 1);
 gui.sameLine();
 gui.radioButton("c", radioButtonValue, 2);


 gui.radioButton("x", radioButtonValue2, 0);
 gui.radioButton("y", radioButtonValue2, 1);
 gui.radioButton("z", radioButtonValue2, 2);



 */