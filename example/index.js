
/* global requestAnimationFrame */

var bunny = require('bunny');
var mat4 = require('gl-mat4');
var vec3 = require('gl-vec3');
var Geometry = require('gl-geometry');
var glShader = require('gl-shader');
var normals = require('normals');
var createOrbitCamera = require('orbit-camera');
var shell = require("gl-now")();
var createGui = require("../index.js");
var cameraPosFromViewMatrix  = require('gl-camera-pos-from-view-matrix');
var dragon = require('stanford-dragon/3');
var boundingBox = require('vertices-bounding-box');
var tform = require('geo-3d-transform-mat4');
var randomArray = require('random-array');

var demo1Shader,bunnyGeo, dragonGeo;

var camera = createOrbitCamera(
    [0,-15,0],
    [0,0,0],
    [0,1,0]
)


const vert = `
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

const frag = `
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


shell.on("gl-init", function () {
    var gl = shell.gl

    gl.enable(gl.DEPTH_TEST)

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

    demo1Shader = glShader(gl, vert, frag)
})

var prev = false;

const RENDER_BUNNY = 0;
const RENDER_DRAGON = 1;


var bg = [0.6, 0.7, 1.0];
var demo1DiffuseColor = [0.7, 0.7, 0.7];
var demo1AmbientLight = [0.3, 0.3, 0.3];
var demo1LightColor = [0.4, 0.0, 0.0];
var demo1SunDir = [0.71, 0.71, 0];
var demo1SpecularPower = {val: 4.0};
var demo1HasSpecular = {val: true};
var demo1RenderModel = {val: RENDER_BUNNY};

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
   /* mat4.translate(model, model, [0,0,0] );
    mat4.scale(model, model, [0.1,0.1,0.1] );
*/
    var projection = mat4.create();
    var scratch = mat4.create();
    var view = camera.view(scratch);
    mat4.perspective(projection, Math.PI / 2, canvas.width / canvas.height, 0.1, 200.0);

    var scratchVec = vec3.create();
    demo1Shader.bind();
    demo1Shader.uniforms.uView = view;
    demo1Shader.uniforms.uModel = model;
    demo1Shader.uniforms.uProjection = projection;
    demo1Shader.uniforms.uDiffuseColor = demo1DiffuseColor;
    demo1Shader.uniforms.uAmbientLight = demo1AmbientLight;
    demo1Shader.uniforms.uLightColor = demo1LightColor;
    demo1Shader.uniforms.uLightDir = demo1SunDir;
    demo1Shader.uniforms.uEyePos = cameraPosFromViewMatrix( scratchVec, view );
    demo1Shader.uniforms.uSpecularPower= demo1SpecularPower.val;
    demo1Shader.uniforms.uHasSpecular=  demo1HasSpecular.val ? 1.0 : 0.0;

    //  var expected = vec3.fromValues(1,2,3);

    if(demo1RenderModel.val == RENDER_BUNNY) {

        bunnyGeo.bind(demo1Shader);
        bunnyGeo.draw();
    } else if(demo1RenderModel.val == RENDER_DRAGON) {
        dragonGeo.bind(demo1Shader);
        dragonGeo.draw();
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
    gui.separator();


    gui.textLine("Demo Settings");

    gui.radioButton("Bunny", demo1RenderModel, RENDER_BUNNY);
    gui.sameLine();
    gui.radioButton("Dragon", demo1RenderModel, RENDER_DRAGON);

    gui.draggerRgb("Ambient Light", demo1AmbientLight);
    gui.draggerRgb("Diffuse Color", demo1DiffuseColor);
    gui.draggerRgb("Light Color", demo1LightColor);

    gui.checkbox("Has Specular Lighting", demo1HasSpecular);
    if(demo1HasSpecular.val)
       gui.sliderFloat("Specular Power", demo1SpecularPower, 0, 40);

    gui.draggerFloat3("Light Direction", demo1SunDir, [ [-2,+2] ], ["X:", "Y:", "Z:"]) ;

    if(gui.button("Randomize")) {
        randomize();
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
        camera.zoom(shell.scroll[1] * 0.1);
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