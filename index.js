

var createGeometry = require("gl-geometry")
var createShader = require("gl-shader")
var mat4 = require("gl-mat4")
var fontInfo = require("./font_info.js")
var fontAtlas= require("./font_atlas.js")
var createTexture = require('gl-texture2d')




const vert = `
precision mediump float;
 
attribute vec2 aPosition;
attribute vec3 aColor;
attribute vec2 aUv;

uniform mat4 uProj;

varying vec3 vColor;
varying vec2 vUv;
 
void main() {
  gl_Position = uProj * vec4(aPosition, 0, 1);
  vColor = aColor;
  vUv = aUv;
}
`

const
    frag = `
precision mediump float;
 
varying vec3 vColor;
varying vec2 vUv;

uniform sampler2D uFontAtlas;

void main() {
  vec4 sample = texture2D(uFontAtlas, vUv);
  gl_FragColor = vec4(vColor.xyz * sample.xyz, sample.x );
}
`

/*
Constructor
 */
function GUI(gl) {
    //console.log("CREATE")

    this.allGuiGeometry = createGeometry(gl)
    this.shader = createShader(gl, vert, frag)

    // distance from window-borders to the widgets.
    this.windowSpacing = 19;

    // the vertical spacing between the widgets.
    this.widgetSpacing = 11;

    // the horizontal and vertical spacing between the button border and its text label.
    this.buttonSpacing = 3;


    this.windowPosition = [050,50]
    this.windowSize = [200,400]

   // console.log("font info", fontInfo.chars[2] )
  //  console.log("font atlas", typeof(fontAtlas) )

    this.fontAtlasTexture = createTexture(gl, fontAtlas)

  //  this.fontAtlasTexture.generateMipmap();
    this.fontAtlasTexture.magFilter = gl.LINEAR;
    this.fontAtlasTexture.minFilter = gl.LINEAR;


    //this._getCharDesc("@");

    this.textScale = 1.0;
    /*
    this.textBase = fontInfo.common.base;
    this.textScaleW = fontInfo.common.scaleW;
    this.textScaleH= fontInfo.common.scaleH;
    this.textFontHeight= fontInfo.common.lineHeight;
*/
   // console.log( this.textBase)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    //gl.disable(gl.CULL_FACE)


    console.log("A", this._getCharDesc("A"));

    console.log("n", this._getCharDesc("n"));



}

GUI.prototype._getCharDesc = function(char) {
    return fontInfo.chars[ char.charCodeAt(0) -32];
}

/*
PRIVATE
 */
GUI.prototype._addIndex = function(index) {
    this.indexBuffer[this.indexBufferIndex++] = index;
}

/*
PRIVATE
 */
GUI.prototype._addPosition = function(position) {
    this.positionBuffer[this.positionBufferIndex++] = position[0];
    this.positionBuffer[this.positionBufferIndex++] = position[1];

}

/*
 PRIVATE
 */
GUI.prototype._addColor = function(color) {
    this.colorBuffer[this.colorBufferIndex++] = color[0];
    this.colorBuffer[this.colorBufferIndex++] = color[1];
    this.colorBuffer[this.colorBufferIndex++] = color[2];
}

GUI.prototype._addUv = function(uv) {
    this.uvBuffer[this.uvBufferIndex++] = uv[0];
    this.uvBuffer[this.uvBufferIndex++] = uv[1];
}

/*
Get text width and height.
 */
GUI.prototype._getTextSizes = function(str) {


    var width = 0;
    var height = 0; // the height of the highest character.


    /*
     var x0 = (x + cd.xoff)*this.textScale ;
     var y0 = (y + cd.yoff)*this.textScale;
     var x1 = (x + cd.xoff2)*this.textScale;
     var y1 = (y + cd.yoff2)*this.textScale;

     */
    for(var i = 0; i < str.length; ++i) {
        var ch = str[i];
        var cd = this._getCharDesc(ch);

        width += (cd.xadvance) * this.textScale;


        var y0 = (cd.yoff)*this.textScale;
        var y1 = (cd.yoff2)*this.textScale;
        var h = y1-y0;

        if( height < h ) {
            height = h;
        }

    }

    return {width: width, height: height};


}


/*
render text
 */
GUI.prototype._text = function(position, str) {

    var x = position[0];
    var y = position[1];

    var ipw = 1.0 / 256;
    var iph = 1.0 / 256;

    for(var i = 0; i < str.length; ++i) {

        var ch = str[i];

        // char desc
        var cd = this._getCharDesc(ch);

        var x0 = (x + cd.xoff)*this.textScale ;
        var y0 = (y + cd.yoff)*this.textScale;
        var x1 = (x + cd.xoff2)*this.textScale;
        var y1 = (y + cd.yoff2)*this.textScale;


        var s0 = (cd.x0 * ipw);
        var t0 = (cd.y0 * iph);
        var s1 = (cd.x1 * ipw);
        var t1 = (cd.y1 * iph);

        x += (cd.xadvance)*this.textScale;

        var baseIndex = this.positionBufferIndex / 2;


        var whiteColor = [1,1,1]

        // top left
        this._addPosition([x0, y0]);
        this._addColor(whiteColor);
        this._addUv([s0, t0]);


        // bottom left
        this._addPosition([x0, y1]);
        this._addColor(whiteColor);
        this._addUv([s0, t1]);


        // top right
        this._addPosition([x1, y0]);
        this._addColor(whiteColor);
        this._addUv([s1, t0]);


        // bottom right
        this._addPosition([x1, y1]);
        this._addColor(whiteColor);
        this._addUv([s1, t1]);


        // console.log("array",  this.positionBufferIndex / 2 );


        this._addIndex(baseIndex+0);
        this._addIndex(baseIndex+1);
        this._addIndex(baseIndex+2);

        this._addIndex(baseIndex+1);
        this._addIndex(baseIndex+2);
        this._addIndex(baseIndex+3);
    }
}

/*
PRIVATE
 */
GUI.prototype._box = function(position, size, color) {

    // top-left, bottom-left, top-right, bottom-right corners
    var tl = position;
    var bl =  [position[0]          , position[1] + size[1]  ];
    var tr =  [position[0] + size[0], position[1]            ];
    var br =  [position[0] + size[0], position[1] + size[1]  ];

    var baseIndex = this.positionBufferIndex / 2;

    var whiteUv = [0.95,0.95]

    this._addPosition(tl);
    this._addColor(color);
    this._addUv(whiteUv);

    this._addPosition(bl);
    this._addColor(color);
    this._addUv(whiteUv);

    this._addPosition(tr);
    this._addColor(color);
    this._addUv(whiteUv);

    this._addPosition(br);
    this._addColor(color);
    this._addUv(whiteUv);

   // console.log("array",  this.positionBufferIndex / 2 );


    this._addIndex(baseIndex+0);
    this._addIndex(baseIndex+1);
    this._addIndex(baseIndex+2);

    this._addIndex(baseIndex+1);
    this._addIndex(baseIndex+2);
    this._addIndex(baseIndex+3);

}

GUI.prototype.button = function(str) {

    var buttonPosition = this.windowCaret;

    var textSizes = this._getTextSizes(str);

    // button size is text size, plus the spacing around the text.
    var buttonSizes = {
        width: textSizes.width + this.buttonSpacing * 2,
        height: textSizes.height + this.buttonSpacing * 2
    };

    this._box(
        buttonPosition  ,
        [buttonSizes.width, buttonSizes.height], [1.0, 0.0, 0.0]  )

    // Render button text.
    this._text([buttonPosition[0] + this.buttonSpacing,
        buttonPosition[1] + buttonSizes.height - this.buttonSpacing  ], str);

    // move down window caret.
    this.windowCaret = [this.windowCaret[0], this.windowCaret[1] + this.widgetSpacing + buttonSizes.height ]
}


GUI.prototype.begin = function(){

    this.indexBuffer = [];
    this.positionBuffer = [];
    this.colorBuffer = [];
    this.uvBuffer = [];

    this.indexBufferIndex = 0;
    this.positionBufferIndex = 0;
    this.colorBufferIndex = 0;
    this.uvBufferIndex = 0;

    // render window.
    this._box(this.windowPosition, this.windowSize, [0.3, 0.3, 0.3]  )

    // setup the window-caret. The window-caret is where we will place the next widget in the window.
    this.windowCaret = [this.windowPosition[0] + this.windowSpacing, this.windowPosition[1] + this.windowSpacing]

    this.button("Eric Arneback");
    this.button("Button");
    this.button("Lorem Ipsum");
    this.button("NUM_SAMPLES");
}

GUI.prototype.end = function(canvasWidth, canvasHeight){

    // create GUI geometry.
    this.allGuiGeometry
        .attr("aPosition", this.positionBuffer, {size: 2} )
        .attr("aColor", this.colorBuffer, {size: 3} )
        .attr("aUv", this.uvBuffer, {size: 2} )

        .faces(this.indexBuffer );


    this.shader.bind()

   var projection = mat4.create()

   mat4.ortho(projection, 0, canvasWidth, canvasHeight, 0,  -1.0, 1.0)

    var virtualToScreenMatrix = mat4.create()


    this.shader.uniforms.uProj = projection;

    this.shader.uniforms.uFontAtlas = this.fontAtlasTexture .bind()

    // render bunny.
    this.allGuiGeometry.bind(this.shader)



    this.allGuiGeometry.draw()
}


module.exports = GUI;
