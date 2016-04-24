
/* global requestAnimationFrame */

var bunny = require('bunny')
var mat4 = require('gl-mat4')
var Geometry = require('gl-geometry')
var glShader = require('gl-shader')
var normals = require('normals')
var createOrbitCamera = require('orbit-camera')
var shell = require("gl-now")()
var createGui = require("../index.js")

var shader,bunnyGeo;

var camera = createOrbitCamera(
    [8,-8,8],
    [0,0,0],
    [0,1,0]
)

var sunDir = [0.71, 0.71, 0];


const vert = `

precision mediump float;

attribute vec3 aPosition;
attribute vec3 aNormal;

varying vec3 vNormal;

uniform mat4 uProjection;
uniform mat4 uModel;
uniform mat4 uView;

void main() {
  vNormal = aNormal;

  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}
`

const frag = `
precision mediump float;

varying vec3 vNormal;

void main() {

    vec3 rabbitColor = vec3(0.7);

    vec3 ambient = 0.7 * rabbitColor;

    float phong = dot(vNormal, vec3(0.71, 0.71, 0) );
    vec3 diffuse = phong * rabbitColor;

    gl_FragColor = vec4(ambient + diffuse, 1.0);
}
`


shell.on("gl-init", function () {
    var gl = shell.gl

    gl.enable(gl.DEPTH_TEST)

    gui = new createGui(gl)

    bunnyGeo = Geometry(gl)
    bunnyGeo.attr('aPosition', bunny.positions)
    bunnyGeo.attr('aNormal', normals.vertexNormals(bunny.cells, bunny.positions))
    bunnyGeo.faces(bunny.cells)

    shader = glShader(gl, vert, frag)
})

var prev = false;


shell.on("gl-render", function (t) {

    var gl = shell.gl

    var canvas = shell.canvas;

    gl.clearColor(0.3, 0.3, 1, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport(0, 0, canvas.width, canvas.height)

    var model = mat4.create()
    var projection = mat4.create()
    var scratch = mat4.create()
    var view = camera.view(scratch);
    mat4.perspective(projection, Math.PI / 2, canvas.width / canvas.height, 0.1, 200.0)

    gl.enable(gl.DEPTH_TEST)


    // TODO: we should not have to do this!
   bunnyGeo.faces(bunny.cells)

    shader.bind()
    bunnyGeo.bind(shader)
    shader.uniforms.uModel = model
    shader.uniforms.uView = view
    shader.uniforms.uProjection = projection
    bunnyGeo.draw()


    var pressed = shell.wasDown("mouse-left");

    var io = {
        mouseLeftDownCur: pressed,
        mouseLeftDownPrev: prev,

        mousePosition:shell.mouse,
        mousePositionPrev:shell.prevMouse}

    prev = pressed;

    gui.begin(io, "Window");
    gui.button("Hello World!");
    gui.end(gl,  canvas.width, canvas.height);


})

shell.on("tick", function() {
    if(shell.wasDown("mouse-left")) {
        camera.rotate([shell.mouseX/shell.width-0.5, shell.mouseY/shell.height-0.5],
            [shell.prevMouseX/shell.width-0.5, shell.prevMouseY/shell.height-0.5])
    }
    if(shell.scroll[1]) {
        camera.zoom(shell.scroll[1] * 0.1)
    }
})





/*
gui = new createGui(gl)






gui.begin(io, "Window");

gui.rgbDragger("Background", bg);


gui.end(gl,  canvas.width, canvas.height);



})
 var prev = false;
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

 gui.rgbDragger("Color", bg);

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