'use strict'

/* global requestAnimationFrame */

var shell = require("gl-now")()
var createGui = require("../index.js");

var gui;



shell.on("gl-init", function() {
    var gl = shell.gl;

    gl.disable(gl.DEPTH_TEST)

    // in order to make the GUI work.
    gui = new createGui(gl)
})

var prev = false;
var intValue = {val: 5 };
var floatValue = {val: 5.54 };

shell.on("gl-render", function(t) {


    var gl = shell.gl
    var canvas = shell.canvas;
    
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0.0, 0.6, 0.7, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var pressed = shell.wasDown("mouse-left");

    var io = {
        mouseLeftDownCur: pressed,
        mouseLeftDownPrev: prev,

        mousePosition:shell.mouse,
        mousePositionPrev:shell.prevMouse}

    prev = pressed;
    
    


    gui.begin(io, "Window");

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


    gui.sliderInt("NUM_SAMPLES2", intValue, 2, 13);
    gui.sliderFloat("density", floatValue, 3, 19);

    gui.button("1234567890.012");


    gui.end(gl,  canvas.width, canvas.height);



})
