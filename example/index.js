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
var boolValue1 = {val: true };
var boolValue2 = {val: false };
var boolValue3 = {val: true };
var boolValue4 = {val: false };
var bg = [0.6, 0.7, 1.0];

shell.on("gl-render", function(t) {


    var gl = shell.gl
    var canvas = shell.canvas;
    
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(bg[0], bg[1],bg[2], 1.0);
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



    gui.end(gl,  canvas.width, canvas.height);



})
