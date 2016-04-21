

var createGeometry = require("gl-geometry")
var createShader = require("gl-shader")
var mat4 = require("gl-mat4")

const VIRTUAL_WIDTH  = 2000;
const VIRTUAL_HEIGHT = 1300;



const vert = `
precision mediump float;
 
attribute vec2 aPosition;
attribute vec3 aColor;

uniform mat4 uProj;

varying vec3 vColor;
 
void main() {
  gl_Position = uProj * vec4(aPosition, 0, 1);
  vColor = aColor;
}
`

const
    frag = `
precision mediump float;
 
varying vec3 vColor;


void main() {
  gl_FragColor = vec4(vColor, 1);
}
`

/*
Constructor
 */
function GUI(gl) {
    console.log("CREATE")

    this.allGuiGeometry = createGeometry(gl)
    this.shader = createShader(gl, vert, frag)

    // distance from window-borders to the widgets.
    this.windowSpacing = 19;

    // the vertical spacing between the widgets.
    this.widgetSpacing = 11;


    this.windowPosition = [000,100]
    this.windowSize = [300,1000]


}

/*
PRIVATE
 */
GUI.prototype.addIndex = function(index) {
    this.indexBuffer[this.indexBufferIndex++] = index;
}

/*
PRIVATE
 */
GUI.prototype.addPosition = function(position) {
    this.positionBuffer[this.positionBufferIndex++] = position[0];
    this.positionBuffer[this.positionBufferIndex++] = position[1];

}

/*
 PRIVATE
 */
GUI.prototype.addColor = function(color) {
    this.colorBuffer[this.colorBufferIndex++] = color[0];
    this.colorBuffer[this.colorBufferIndex++] = color[1];
    this.colorBuffer[this.colorBufferIndex++] = color[2];

}



/*
PRIVATE
 */
GUI.prototype.box = function(position, size, color) {

    // top-left, bottom-left, top-right, bottom-right corners
    var tl = position;
    var bl =  [position[0]          , position[1] + size[1]  ];
    var tr =  [position[0] + size[0], position[1]            ];
    var br =  [position[0] + size[0], position[1] + size[1]  ];

    var baseIndex = this.positionBufferIndex / 2;


    this.addPosition(tl);
    this.addColor(color);

    this.addPosition(bl);
    this.addColor(color);

    this.addPosition(tr);
    this.addColor(color);

    this.addPosition(br);
    this.addColor(color);


   // console.log("array",  this.positionBufferIndex / 2 );


    this.addIndex(baseIndex+0);
    this.addIndex(baseIndex+1);
    this.addIndex(baseIndex+2);

    this.addIndex(baseIndex+1);
    this.addIndex(baseIndex+2);
    this.addIndex(baseIndex+3);

}

GUI.prototype.createVirtualToScreenMatrix = function(out, canvasWidth, canvasHeight) {
    var widthScale = canvasWidth / VIRTUAL_WIDTH;
    var heightScale = canvasHeight / VIRTUAL_HEIGHT;

    var scale = 0;
    var xOffset = 0;
    var yOffset = 0;
    if(widthScale < heightScale){
        scale = widthScale;
        yOffset = (canvasHeight - VIRTUAL_HEIGHT * scale) / 2;
        xOffset = 0;
    } else {
        scale = heightScale;
        xOffset = (canvasWidth - VIRTUAL_WIDTH * scale) / 2;
        yOffset = 0;
    }


    out[0] = scale;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = scale;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 0;
    out[11] = 0;
    out[12] = xOffset;
    out[13] = yOffset;
    out[14] = 0;
    out[15] = 1;

    return out;
}

GUI.prototype.button = function() {

    var buttonPosition = this.windowCaret;

    this.box(this.windowCaret, [100,50], [1.0, 0.0, 0.0]  )
    this.windowCaret = [this.windowCaret[0], this.windowCaret[1] + 50 + this.widgetSpacing]


}


GUI.prototype.begin = function(){

    this.indexBuffer = []
    this.positionBuffer = []
    this.colorBuffer = []

    this.indexBufferIndex = 0
    this.positionBufferIndex = 0
    this.colorBufferIndex = 0

    // render window.
    this.box(this.windowPosition, this.windowSize, [0.3, 0.3, 0.3]  )

    // setup the window-caret. The window-caret is where we will place the next widget in the window.
    this.windowCaret = [this.windowPosition[0] + this.windowSpacing, this.windowPosition[1] + this.windowSpacing]

    this.button()

    this.button()

    this.button()


    // this.addBox(vec2.fromValues(000,100), vec2.fromValues(100,100), [1.0, 1.0, 0.0]  )

   // this.addBox(vec2.fromValues(000,200), vec2.fromValues(100,100), [1.0, 1.0, 1.0]  )

}

GUI.prototype.end = function(canvasWidth, canvasHeight){

    // create GUI geometry.
    this.allGuiGeometry
        .attr("aPosition", this.positionBuffer, {size: 2} )
        .attr("aColor", this.colorBuffer, {size: 3} )

        .faces(this.indexBuffer )


    this.shader.bind()

   var projection = mat4.create()

   mat4.ortho(projection, 0, canvasWidth, canvasHeight, 0,  -1.0, 1.0)

    var virtualToScreenMatrix = mat4.create()

    this.createVirtualToScreenMatrix(virtualToScreenMatrix, canvasWidth, canvasHeight)

    mat4.multiply(projection, projection, virtualToScreenMatrix)

    this.shader.uniforms.uProj = projection;

    // render bunny.
    this.allGuiGeometry.bind(this.shader)


    this.allGuiGeometry.draw()
}


module.exports = GUI;

