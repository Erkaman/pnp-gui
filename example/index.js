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

shell.on("gl-render", function(t) {


    var gl = shell.gl
    var canvas = shell.canvas;
    
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0.0, 0.6, 0.7, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var pressed = shell.wasDown("mouse-left");

    var io = {mouseLeftPressed: !pressed && prev, mousePosition:[shell.mouseX, shell.mouseY] }

    prev = pressed;

    gui.begin(io);
    
    if(gui.button("Eric Arneback")) {
        console.log("button");
    }

    /*
    gui.button("Button");
    gui.button("Lorem Ipsum");
    gui.button("NUM_SAMPLES");
*/
    gui.end(gl,  canvas.width, canvas.height);



})
