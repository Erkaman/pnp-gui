/*
 Require dependencies
 */
var createShader = require("gl-shader");
var mat4 = require("gl-mat4");
var createTexture = require('gl-texture2d');
var hashString = require('hash-string');
var clamp = require('clamp');
var createBuffer = require('gl-buffer');

/*
 Require resources.
 */
var fontInfo = require("./font_info.js");
var fontAtlas = require("./font_atlas.js");
var shaders = require("./shaders.js");

/*
 Constructor
 */
function GUI(gl) {

    /*
     We use this single shader to render the GUI.
     */
    this.shader = createShader(gl, shaders.vert, shaders.frag);

    /*
     These buffers contain all the geometry data.
     */
    this.positionBufferObject = createBuffer(gl, [], gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.colorBufferObject = createBuffer(gl, [], gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.uvBufferObject = createBuffer(gl, [], gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.indexBufferObject = createBuffer(gl, [], gl.ELEMENT_ARRAY_BUFFER, gl.DYNAMIC_DRAW);


    this._setupDefaultSettings();

    this.fontAtlasTexture = createTexture(gl, fontAtlas);
    this.fontAtlasTexture.magFilter = gl.LINEAR;
    this.fontAtlasTexture.minFilter = gl.LINEAR;

    /*
    DO NOT CHANGE THIS VALUE. The entire GUI layout will break!
     */
    this.textScale = 1.0;

    /*
     Keeps track of the ID of the widget that is currently being pressed down.
     We need to keep track of this, because otherwise we can't, for instance,  affect the value of a
     slider while the mouse is OUTSIDE the hitbox of the slider.
     */
    this.activeWidgetId = null;

    /*
     See _moveWindowCaret() for an explanation.
     */
    this.sameLineActive = false;
    this.prevWidgetSizes = null;
}


GUI.prototype.sameLine = function () {
    this.sameLineActive = true;
};

GUI.prototype.sliderFloat = function (str, value, min, max) {
    this._slider(str, value, min, max, false);
};

GUI.prototype.sliderInt = function (str, value, min, max) {
    this._slider(str, value, min, max, true);
};

GUI.prototype.draggerFloat4 = function (labelStr, value, minMaxValues, subLabels) {
    this._draggerFloatN(labelStr, value, 4, minMaxValues, subLabels);
};

GUI.prototype.draggerFloat3 = function (labelStr, value, minMaxValues, subLabels) {
    this._draggerFloatN(labelStr, value, 3, minMaxValues, subLabels);
};

GUI.prototype.draggerFloat2 = function (labelStr, value, minMaxValues, subLabels) {
    this._draggerFloatN(labelStr, value, 2, minMaxValues, subLabels);
};


GUI.prototype.draggerFloat1 = function (labelStr, value, minMaxValues, subLabels) {
    this._draggerFloatN(labelStr, value, 1, minMaxValues, subLabels);
};

GUI.prototype.draggerRgb = function (labelStr, value) {
    this._draggerFloatN(
        labelStr, value, 3, [0, 1], ["R:", "G:", "B:"],
        [
            [this.draggerRgbRedColor, this.draggerRgbRedColorHover],
            [this.draggerRgbGreenColor, this.draggerRgbGreenColorHover],
            [this.draggerRgbBlueColor, this.draggerRgbBlueColorHover]
        ]);
};

/*
 If value.val == id, then that means this radio button is chosen.
 */
GUI.prototype.radioButton = function (labelStr, value, id) {

    this._moveWindowCaret();

    /*
     Radio button IO
     */


    var zeroHeight = this._getTextSizes("0")[1];

    var innerRadius = (zeroHeight + 2 * 1) / 2;
    var outerRadius = (zeroHeight + 2 * 4) / 2;

    var radioButtonPosition = this.windowCaret;


    var radioButtonSizes = [outerRadius * 2, outerRadius * 2];

    var mouseCollision = _inCircle(radioButtonPosition, radioButtonSizes, this.io.mousePosition);


    if (this.io.mouseLeftDownCur == true && this.io.mouseLeftDownPrev == false && mouseCollision) {
        value.val = id;
    }

    var isHover = mouseCollision;


    /*
     CHECKBOX RENDERING
     */

    this._circle(radioButtonPosition, radioButtonSizes,
        isHover ? this.radioButtonOuterColorHover : this.radioButtonOuterColor, this.radioButtonCircleSegments );


    if (value.val == id) {
        var p = radioButtonPosition;
        var s = radioButtonSizes;
        var innerCirclePosition = [
            Math.round(0.5 * (p[0] + (p[0] + s[0]) - innerRadius * 2 )),
            Math.round(0.5 * (p[1] + (p[1] + s[1]) - innerRadius * 2 )),
        ];

        this._circle(innerCirclePosition, [innerRadius * 2, innerRadius * 2],
            isHover ? this.radioButtonInnerColorHover : this.radioButtonInnerColor, this.radioButtonCircleSegments );
    }


    // now render radio button label.
    var labelPosition = [radioButtonPosition[0] + radioButtonSizes[0] + this.widgetLabelHorizontalSpacing, radioButtonPosition[1]]
    var labelStrSizes = [this._getTextSizes(labelStr)[0], radioButtonSizes[1]];
    this._textCenter(labelPosition, labelStrSizes, labelStr);

    this.prevWidgetSizes = [radioButtonSizes[0] + labelStrSizes[0], radioButtonSizes[1]];
}


GUI.prototype.checkbox = function (labelStr, value) {

    this._moveWindowCaret();

    /*
     CHECKBOX IO(if checkbox clicked, flip boolean value.)
     */

    // use height of zero to determine size of checkbox, to ensure that the textl label does become higher
    // than the checkbox.
    var zeroHeight = this._getTextSizes("0")[1];

    var innerSize = zeroHeight + 2 * 2;
    var outerSize = zeroHeight + 2 * 4;

    var checkboxPosition = this.windowCaret;
    var checkboxSizes = [outerSize, outerSize];

    var mouseCollision = _inBox(checkboxPosition, checkboxSizes, this.io.mousePosition);

    if (this.io.mouseLeftDownCur == true && this.io.mouseLeftDownPrev == false && mouseCollision) {
        value.val = !value.val;
    }

    var isHover = mouseCollision;

    /*
     CHECKBOX RENDERING
     */

    // render outer box.
    this._box(
        checkboxPosition,
        checkboxSizes, isHover ? this.checkboxOuterColorHover : this.checkboxOuterColor);


    // now render a centered inner box, that shows whether the checkbox is true, or false.

    if (value.val) {
        var p = checkboxPosition;
        var s = checkboxSizes;
        var innerboxPosition = [
            Math.round(0.5 * (p[0] + (p[0] + s[0]) - innerSize )),
            Math.round(0.5 * (p[1] + (p[1] + s[1]) - innerSize )),
        ];

        this._box(
            innerboxPosition,
            [innerSize, innerSize], isHover ? this.checkboxInnerColorHover : this.checkboxInnerColor);
    }

    // now render checkbox label.
    var labelPosition = [checkboxPosition[0] + checkboxSizes[0] + this.widgetLabelHorizontalSpacing, checkboxPosition[1]]
    var labelStrSizes = [this._getTextSizes(labelStr)[0], checkboxSizes[1]];
    this._textCenter(labelPosition, labelStrSizes, labelStr);

    this.prevWidgetSizes = [checkboxSizes[0] + labelStrSizes[0], checkboxSizes[1]];
}


GUI.prototype.button = function (str) {

    this._moveWindowCaret();

    var widgetId = hashString(str);

    /*
     BUTTON RENDERING
     */

    var buttonPosition = this.windowCaret;

    var textSizes = this._getTextSizes(str);

    // button size is text size, plus the spacing around the text.
    var buttonSizes = [
        textSizes[0] + this.buttonSpacing * 2,
        textSizes[1] + this.buttonSpacing * 2
    ];

    var color;
    var isButtonClick = false;

    // we can only hover or click, when are not interacting with some other widget.
    if ((this.activeWidgetId == null || this.activeWidgetId == widgetId ) && _inBox(buttonPosition, buttonSizes, this.io.mousePosition)) {

        if (this.io.mouseLeftDownPrev && !this.io.mouseLeftDownCur) {

            isButtonClick = true;
            color = this.clickButtonColor;
        } else if (this.io.mouseLeftDownCur) {

            color = this.clickButtonColor;
            this.activeWidgetId = widgetId;
        } else {
            color = this.hoverButtonColor;
        }


    } else {
        color = this.buttonColor
    }

    this._box(
        buttonPosition,
        buttonSizes, color)

    // Render button text.
    this._text([buttonPosition[0] + this.buttonSpacing,
        buttonPosition[1] + buttonSizes[1] - this.buttonSpacing], str);


    this.prevWidgetSizes = (buttonSizes);


    /*
     BUTTON IO
     If button is pressed, return true;
     Otherwise, return false.
     */


    if (isButtonClick) {
        return true; // button press!
    }

    return false;
}


GUI.prototype.separator = function () {
    this._moveWindowCaret();

    var separatorPosition = this.windowCaret;
    // the separator should fill out the windows size.
    var separatorSizes = [
        this.windowSizes[0] - 2 * this.windowSpacing,
        this._getTextSizes("0")[1] *  this.separatorHeightRatio];

    this._box(separatorPosition, separatorSizes, [0.4, 0.4, 0.4]);

    this.prevWidgetSizes = (separatorSizes);
}


GUI.prototype.textLine = function (str) {
    this._moveWindowCaret();

    var textLinePosition = this.windowCaret;
    var textSizes = this._getTextSizes(str);

    // Render button text.
    this._textCenter(textLinePosition, textSizes, str);

    this.prevWidgetSizes = textSizes;
};

GUI.prototype.begin = function (io, windowTitle) {

    this.windowTitle = windowTitle;

    /*
    Setup geometry buffers.
     */
    this.indexBuffer = [];
    this.positionBuffer = [];
    this.colorBuffer = [];
    this.uvBuffer = [];

    this.indexBufferIndex = 0;
    this.positionBufferIndex = 0;
    this.colorBufferIndex = 0;
    this.uvBufferIndex = 0;

    this.io = io;

    // render window.
    this._window();
};


GUI.prototype.end = function (gl, canvasWidth, canvasHeight) {

    /*
     If a VAO is already bound, we need to unbound it. Otherwise, we will write into a VAO created by the user of the library
     when calling vertexAttribPointer, which means that we would effectively corrupt the user data!
     */
    var VAO_ext = gl.getExtension('OES_vertex_array_object');
    if (VAO_ext)
        VAO_ext.bindVertexArrayOES(null);

    /*
     We are changing some GL states when rendering the GUI. So before rendering we backup these states,
     and after rendering we restore these states. This is so that the end-user does not involuntarily have his
     GL-states messed with.
     */
    this._backupGLState(gl);


    this.positionBufferObject.update(this.positionBuffer);
    gl.enableVertexAttribArray(this.shader.attributes.aPosition.location);
    gl.vertexAttribPointer(this.shader.attributes.aPosition.location, 2, gl.FLOAT, false, 0, 0);
    this.positionBufferObject.unbind();


    this.colorBufferObject.update(this.colorBuffer);
    gl.enableVertexAttribArray(this.shader.attributes.aColor.location);
    gl.vertexAttribPointer(this.shader.attributes.aColor.location, 4, gl.FLOAT, false, 0, 0);
    this.colorBufferObject.unbind();

    this.uvBufferObject.update(this.uvBuffer);
    gl.enableVertexAttribArray(this.shader.attributes.aUv.location);
    gl.vertexAttribPointer(this.shader.attributes.aUv.location, 2, gl.FLOAT, false, 0, 0);
    this.uvBufferObject.unbind();

    this.indexBufferObject.update(this.indexBuffer);


    /*
     Setup matrices.
     */
    var projection = mat4.create()
    mat4.ortho(projection, 0, canvasWidth, canvasHeight, 0, -1.0, 1.0)

    this.shader.bind()

    this.shader.uniforms.uProj = projection;
    this.shader.uniforms.uFontAtlas = this.fontAtlasTexture.bind()

    gl.disable(gl.DEPTH_TEST) // no depth testing; we handle this by manually placing out
    // widgets in the order we wish them to be rendered.


    // for text rendering, enable alpha blending.
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    gl.drawElements(gl.TRIANGLES, (this.indexBufferIndex), gl.UNSIGNED_SHORT, 0);


    /*
     Make sure to always reset the active widget id, if mouse is released.
     This makes sure that every widget does not explicitly have to reset this value
     by themselves, which is a bit error-prone.
     */
    if (this.activeWidgetId != null && this.io.mouseLeftDownCur == false) {
        this.activeWidgetId = null;
    }


    this._restoreGLState(gl);

};


/*
 Mouse has focus EITHER when the mouse is inside the window, OR
 it is outside the window, but is interacting with a widget.
 */
GUI.prototype.hasMouseFocus = function () {
    return this.mouseInWindow || this.activeWidgetId != null;
}



GUI.prototype._setupDefaultSettings = function (char) {

    /*
    window settings
     */

    // distance from window-borders to the widgets.
    this.windowSpacing = 14;

    // the vertical and horizontal spacing between the widgets.
    this.widgetSpacing = 11;

    // position of the window.
    this.windowPosition = [20, 20];
    // size of the window.
    this.windowSizes = [360, 500];
    // color of the window.
    this.windowColor = [0.1, 0.1, 0.1];
    // the transparency of the window.
    this.windowAlpha = 0.9;

    // the title bar height.
    this.titleBarHeight = 21;
    // spacing between the title bars border, and the window title.
    this.titleBarVerticalSpacing = 6;
    // the title bar color.
    this.titleBarColor = [0.2, 0.4, 0.6];


    /*
    button settings
     */

    // the horizontal and vertical spacing between the button border and its text label.
    this.buttonSpacing = 3;
    // normal button color.
    this.buttonColor = [0.35, 0.1, 0.1];
    // button button color when mouse hover
    this.hoverButtonColor = [0.40, 0.1, 0.1];
    // button color when mouse click.
    this.clickButtonColor = [0.50, 0.1, 0.1];

    /*
    slider settings
     */

    // the vertical space between the number(inside the slider) and the border of the slider box.
    this.sliderVerticalSpacing = 4;
    // the color of the slider background.
    this.sliderBackgroundColor = [0.16, 0.16, 0.16];
    // the color of the bar in the slider.
    this.sliderFillColor = [0.0, 0.3, 0.7];
    // the color of the slider background when mouse hover,
    this.sliderBackgroundColorHover = [0.19, 0.19, 0.19];
    // the color of the bar in the slider when mouse hover.
    this.sliderFillColorHover = [0.0, 0.4, 0.8];
    // the number of decimal digits that the slider value is displayed with.
    this.sliderValueNumDecimalDigits = 2;

    /*
    dragger settings
     */

    // the horizontal spacing between the subdragger widgets in a dragger widget.
    this.draggerWidgetHorizontalSpacing = 3;
    // the vertical spacing between the top and bottom borders and the text in draggers.
    this.draggerVerticalSpacing = 5;

    // The colors of the three subdraggers in the rgbDragger widget.
    // "Hover", refers to the color when the dragger is hovered.
    this.draggerRgbRedColor = [0.3, 0.0, 0.0];
    this.draggerRgbRedColorHover = [0.35, 0.0, 0.0];
    this.draggerRgbGreenColor = [0.0, 0.3, 0.0];
    this.draggerRgbGreenColorHover = [0.0, 0.35, 0.0];
    this.draggerRgbBlueColor = [0.0, 0.0, 0.3];
    this.draggerRgbBlueColorHover = [0.0, 0.0, 0.38];
    //The colors of the subdraggers in the draggerFloat widgets.
    // "Hover", refers to the color when the dragger is hovered.
    this.draggerFloatColor = [0.30, 0.30, 0.30];
    this.draggerFloatColorHover = [0.32, 0.32, 0.32];

    /*
    checkbox settings
     */


    // the outer color is the color of the outer box of the checkbox,
    // and the inner color is the color of the inner box
    this.checkboxOuterColor = [0.3, 0.3, 0.3];
    this.checkboxInnerColor = [0.15, 0.15, 0.15];
    this.checkboxOuterColorHover = [0.33, 0.33, 0.33];
    this.checkboxInnerColorHover = [0.18, 0.18, 0.18];

    /*
     radioButton settings
     */


    // the outer color is the color of the outer circle of the radioButton,
    // and the inner color is the color of the inner circle
    this.radioButtonOuterColor = [0.3, 0.3, 0.3];
    this.radioButtonInnerColor = [0.15, 0.15, 0.15];
    this.radioButtonOuterColorHover = [0.33, 0.33, 0.33];
    this.radioButtonInnerColorHover = [0.18, 0.18, 0.18];
    // in order to render the radio button, we must triangulate the circles into triangle segments
    // this number is the number of triangle segments.
    this.radioButtonCircleSegments = 9;

    /*
    separator settings.
     */

    //  the color of a separator.
    this.separatorColor = [0.4, 0.4, 0.4];
    // the height of a separator (height of "0") * this.separatorHeightRatio
    this.separatorHeightRatio = 0.2;

    /*
    general settings
     */

    // Some widgets render a label in addition to themselves(such as the sliders and draggers)
    // this value is the horizontal spacing between the label and the widget for those widgets.
    this.widgetLabelHorizontalSpacing = 4;

    // Some widgets will grow horizontally as the window size increases. They are grown to occupy this
    // ratio of the total window width.
    this.widgetHorizontalGrowRatio = 0.6;
};

GUI.prototype._getCharDesc = function (char) {
    return fontInfo.chars[char.charCodeAt(0) - 32];
};

GUI.prototype._addIndex = function (index) {
    this.indexBuffer[this.indexBufferIndex++] = index;
};

GUI.prototype._addPosition = function (position) {
    this.positionBuffer[this.positionBufferIndex++] = position[0];
    this.positionBuffer[this.positionBufferIndex++] = position[1];
};

GUI.prototype._addColor = function (color) {
    this.colorBuffer[this.colorBufferIndex++] = color[0];
    this.colorBuffer[this.colorBufferIndex++] = color[1];
    this.colorBuffer[this.colorBufferIndex++] = color[2];
    this.colorBuffer[this.colorBufferIndex++] = color[3];
};

GUI.prototype._addUv = function (uv) {
    this.uvBuffer[this.uvBufferIndex++] = uv[0];
    this.uvBuffer[this.uvBufferIndex++] = uv[1];
};

/*
 Get width and height of a text string.
 */
GUI.prototype._getTextSizes = function (str) {

    var width = 0;
    var height = 0; // the height of the highest character.

    for (var i = 0; i < str.length; ++i) {
        var ch = str[i];
        var cd = this._getCharDesc(ch);

        width += (cd.xadvance) * this.textScale;

        var y0 = (cd.yoff) * this.textScale;
        var y1 = (cd.yoff2) * this.textScale;
        var h = y1 - y0;

        if (height < h) {
            height = h;
        }

    }

    return [width, height];
}


/*
 render text
 */
GUI.prototype._text = function (position, str) {

    /*
     Make sure to round the position to integer. Otherwise, anti-aliasing causes the text to get blurry,
     it seems
     */
    var x = Math.round(position[0]);
    var y = Math.round(position[1]);

    /*
     Width of a single pixel in the font atlas.
     */
    var ipw = 1.0 / 256;
    var iph = 1.0 / 256;

    for (var i = 0; i < str.length; ++i) {

        var ch = str[i];

        // char desc
        var cd = this._getCharDesc(ch);

        /*
         We will render a single character as a quad.
         First we gather all information needed to render the quad:
         */

        var x0 = (x + cd.xoff) * this.textScale;
        var y0 = (y + cd.yoff) * this.textScale;
        var x1 = (x + cd.xoff2) * this.textScale;
        var y1 = (y + cd.yoff2) * this.textScale;


        var s0 = (cd.x0 * ipw);
        var t0 = (cd.y0 * iph);
        var s1 = (cd.x1 * ipw);
        var t1 = (cd.y1 * iph);

        // render text as white.
        var whiteColor = [1, 1, 1, 1]


        /*
         Now we have all the information. Now render the quad as two triangles:
         */

        var baseIndex = this.positionBufferIndex / 2;

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

        // triangle 1
        this._addIndex(baseIndex + 0);
        this._addIndex(baseIndex + 1);
        this._addIndex(baseIndex + 2);

        // triangle 2
        this._addIndex(baseIndex + 3);
        this._addIndex(baseIndex + 2);
        this._addIndex(baseIndex + 1);

        // finally, advance the x-coord, in preparation of rendering the next character.
        x += (cd.xadvance) * this.textScale;
    }
}

/*
 Render text centered in a box with position `p`, width `s[0]`, height `[1]`,
 */
GUI.prototype._textCenter = function (p, s, str) {
    var strSizes = this._getTextSizes(str);

    // we must round, otherwise the text may end up between pixels(say at 1.5, or 1.6, or something ),
    // and this makes it blurry
    var strPosition = [
        Math.round(0.5 * (p[0] + (p[0] + s[0]) - strSizes[0] )),
        Math.round(0.5 * (p[1] + (p[1] + s[1]) + strSizes[1] )),
    ];

    this._text(strPosition, str);
}

/*
 Add vertex that only has one color, and does not use a texture.
 */
GUI.prototype._coloredVertex = function (position, color) {
    // at this uv-coordinate, the font atlas is entirely white.
    var whiteUv = [0.95, 0.95];

    this._addPosition(position);
    this._addColor(color);
    this._addUv(whiteUv);
};

/*
 Render a box.

 `color` is a RGB-triplet.
 the optional `alpha` argument specifies the transparency of the box.
 default value of `alpha` is 1.0
 */
GUI.prototype._box = function (position, size, color, alpha) {


    if (typeof alpha === 'undefined') {
        alpha = 1.0; // default to 1.0
    }

    // top-left, bottom-left, top-right, bottom-right corners
    var tl = position;
    var bl = [position[0], position[1] + size[1]];
    var tr = [position[0] + size[0], position[1]];
    var br = [position[0] + size[0], position[1] + size[1]];

    var baseIndex = this.positionBufferIndex / 2;

    var c = [color[0], color[1], color[2], alpha];

    // vertex 1
    this._coloredVertex(tl, c);

    // vertex 2
    this._coloredVertex(bl, c);

    // vertex 3
    this._coloredVertex(tr, c);

    // vertex 4
    this._coloredVertex(br, c);


    // triangle 1
    this._addIndex(baseIndex + 0);
    this._addIndex(baseIndex + 1);
    this._addIndex(baseIndex + 2);

    // triangle 2
    this._addIndex(baseIndex + 3);
    this._addIndex(baseIndex + 2);
    this._addIndex(baseIndex + 1);

};

GUI.prototype._unitCircle = function (position, theta, radius) {
    return [position[0] + radius * Math.cos(theta), position[1] + radius * Math.sin(theta)];
};

/*
 Render a circle, where the top-left corner of the circle is `position`
 Where `segments` is how many triangle segments the triangle is rendered with.
 */
GUI.prototype._circle = function (position, sizes, color, segments) {

    var centerPosition = [
        position[0] + 0.5 * sizes[0],
        position[1] + 0.5 * sizes[1]
    ];
    var radius = sizes[0] / 2;

    var baseIndex = this.positionBufferIndex / 2;

    var c = [color[0], color[1], color[2], 1.0];

    // add center vertex.
    this._coloredVertex(centerPosition, c);
    var centerVertexIndex = baseIndex + 0;


    var stepSize = (2 * Math.PI) / segments;
    var curIndex = baseIndex + 1;
    for (var theta = 0; theta <= 2 * Math.PI + 0.1; theta += stepSize, ++curIndex) {

        // for first frame, we only create one vertex, and no triangles
        if (theta == 0) {
            var p = this._unitCircle(centerPosition, theta, radius);
            this._coloredVertex(p, c);
        } else {
            var p = this._unitCircle(centerPosition, theta, radius);
            this._coloredVertex(p, c);

            this._addIndex(curIndex + 0);
            this._addIndex(curIndex - 1);
            this._addIndex(centerVertexIndex);
        }
    }
};

function _inCircle(p, s, x) {

    // circle center
    var cp = [
        p[0] + 0.5 * s[0],
        p[1] + 0.5 * s[1]

    ];
    var radius = s[0] * 0.5;

    // distance from `x` to circle center.
    var dist = Math.sqrt((x[0] - cp[0]) * (x[0] - cp[0]) + (x[1] - cp[1]) * (x[1] - cp[1]));

    return (dist <= radius);
}


/*
 Given a box with position `p`, width `s[0]`, height `[1]`,
 return whether the point with the position `x` is inside the box.
 */
function _inBox(p, s, x) {
    var minX = p[0];
    var minY = p[1];

    var maxX = p[0] + s[0];
    var maxY = p[1] + s[1];

    return (
        minX <= x[0] && x[0] <= maxX &&
        minY <= x[1] && x[1] <= maxY
    );
}


/*
 Before adding a widget, move the window caret to the right of the previous widget if this.sameLineActive,
 ELSE start a line.
 you should ALWAYS call this function before adding a new widget.
 */
GUI.prototype._moveWindowCaret = function () {

    if (this.prevWidgetSizes == null) {
        // we have not yet laid out the first widget. Do nothing.
        return;
    }

    if (this.sameLineActive) {
        this.windowCaret = [this.windowCaret[0] + this.widgetSpacing + this.prevWidgetSizes[0], this.windowCaret[1]];
    } else {
        this.windowCaret = [this.windowSpacing + this.windowPosition[0], this.windowCaret[1] + this.widgetSpacing + this.prevWidgetSizes[1]];
    }

    // the user have to explicitly call sameLine() again if we he wants samLineActive again.
    this.sameLineActive = false;

};

GUI.prototype._draggerFloat = function (widgetId, labelStr, value, color, colorHover, width, position, minVal, maxVal) {

    /*
    DRAGGER IO
     */

    var draggerPosition = position;
    var draggerSizes = [
        width,
        this._getTextSizes("0")[1] + 2 * this.draggerVerticalSpacing
    ];

    var mouseCollision = _inBox(draggerPosition, draggerSizes, this.io.mousePosition);
    if (
        mouseCollision &&
        this.io.mouseLeftDownCur == true && this.io.mouseLeftDownPrev == false) {
        // if slider is clicked, it becomes active.
        this.activeWidgetId = widgetId;
    }

    if (this.activeWidgetId == widgetId) {
        value.val += 0.01 * (this.io.mousePosition[0] - this.io.mousePositionPrev[0]);
        value.val = clamp(value.val, minVal, maxVal);

        this.activeWidgetId = widgetId;

    }

    /*
     DRAGGER RENDERING
     */

    var sliderValueStr = labelStr + value.val.toFixed(this.sliderValueNumDecimalDigits);


    /*
     If either widget is active, OR we are hovering but not clicking,
     switch to hover color.
     */
    var isHover = (this.activeWidgetId == widgetId) || (mouseCollision && !this.io.mouseLeftDownCur  );

    this._box(
        draggerPosition,
        draggerSizes, isHover ? colorHover : color);


    var sliderValueStrSizes = this._getTextSizes(sliderValueStr);


    // render text in slider
    this._textCenter(draggerPosition, draggerSizes, sliderValueStr);

    // return top right corner, and bottom right corner of the dragger.
    return {
        topRight: [draggerPosition[0] + draggerSizes[0], draggerPosition[1]],
        bottomRight: [draggerPosition[0] + draggerSizes[0], draggerPosition[1] + draggerSizes[1]],
    };
};

/*
 sublabels,
 min max, for all n.
 hover color, for all three.
 */
GUI.prototype._draggerFloatN = function (labelStr, value, N, minMaxValues, subLabels, colors) {
    this._moveWindowCaret();

    if (!minMaxValues)
        minMaxValues = [];

    if (!subLabels)
        subLabels = [];

    if (!colors)
        colors = [];


    // if minMaxValues is only a single min-max pair(a  n array on the form [min,max]),
    // then that pair becomes the value of the rest
    // of the min-max pairs.
    if (minMaxValues.length == 2 &&  typeof minMaxValues[0][0] == "undefined" ) {
        var defaultValue = [minMaxValues[0], minMaxValues[1]  ];
        for (var i = 0; i < N; ++i) {
            minMaxValues[i] = defaultValue;
        }


    }


    /*
     Set default values of arguments
     */
    for (var i = 0; i < N; ++i) {
        if (!subLabels[i]) {
            subLabels[i] = "";
        }

        if (!minMaxValues[i]) {
            minMaxValues[i] = [-1, 1];
        }

        if (!colors[i]) {
            colors[i] = [this.draggerFloatColor, this.draggerFloatColorHover];

        }
    }

    // width of a single subdragger.
    var draggerWidth =
        (((this.windowSizes[0] - 2 * this.windowSpacing) * (this.widgetHorizontalGrowRatio)) - (N - 1) * this.draggerWidgetHorizontalSpacing) / (N);

    var nDraggerPosition = this.windowCaret;
    var formerDraggerPosition = {topRight: nDraggerPosition};

    for (var iDragger = 0; iDragger < N; ++iDragger) {
        var v = {val: value[iDragger]};

        // first dragger has no spacing in front.
        var hasFrontSpacing = (iDragger == 0) ? false : true;

        var position = [
            formerDraggerPosition.topRight[0] + (hasFrontSpacing ? this.draggerWidgetHorizontalSpacing : 0),
            formerDraggerPosition.topRight[1]];

        // make sure each subdragger has an unique widget-ID.
        var draggerWidgetId = hashString(labelStr + (iDragger + ""));

        formerDraggerPosition = this._draggerFloat(draggerWidgetId, subLabels[iDragger], v,
            colors[iDragger][0],
            colors[iDragger][1], draggerWidth, position, minMaxValues[iDragger][0], minMaxValues[iDragger][1]);

        // update value
        value[iDragger] = v.val;
    }

    // the total size of all the N draggers.
    var draggerSizes = [
        formerDraggerPosition.bottomRight[0] -
        nDraggerPosition[0],
        formerDraggerPosition.bottomRight[1] -
        nDraggerPosition[1]];

    // finally, we place a label after all the draggers.
    var draggerLabelPosition = [nDraggerPosition[0] + draggerSizes[0] + this.widgetLabelHorizontalSpacing, nDraggerPosition[1]]
    var draggerLabelStrSizes = [this._getTextSizes(labelStr)[0], draggerSizes[1]];
    this._textCenter(draggerLabelPosition, draggerLabelStrSizes, labelStr);

    this.prevWidgetSizes = [

        draggerSizes[0] + this.widgetLabelHorizontalSpacing + draggerLabelStrSizes[0],
        draggerSizes[1]];
}

GUI.prototype._slider = function (labelStr, value, min, max, doRounding) {

    this._moveWindowCaret();

    /*
     SLIDER IO
     */

    var sliderPosition = this.windowCaret;
    var widgetId = hashString(labelStr);

    // * if we use the height of a single digit, we know that the slider will always be high enough.
    // (since all digits have equal height in our font).
    // * also, we dynamically determine the slider width, based on the window width.
    var sliderSizes = [
        (this.windowSizes[0] - 2 * this.windowSpacing) * this.widgetHorizontalGrowRatio,
        this._getTextSizes("0")[1] + 2 * this.sliderVerticalSpacing
    ];

    var mouseCollision = _inBox(sliderPosition, sliderSizes, this.io.mousePosition);

    if (
        mouseCollision &&
        this.io.mouseLeftDownCur == true && this.io.mouseLeftDownPrev == false) {
        // if slider is clicked, it becomes active.
        this.activeWidgetId = widgetId;
    }

    if (this.activeWidgetId == widgetId) {
        // if the mouse is clicking on the slider, we modify `value.val` based
        // on the x-position of the mouse.

        var xMax = sliderPosition[0] + sliderSizes[0];
        var xMin = sliderPosition[0];

        /*
         Values larger than xMin and xMax should not overflow or underflow the slider.
         */
        var mouseX = clamp(this.io.mousePosition[0], xMin, xMax);

        value.val = (max - min) * ((mouseX - xMin) / (xMax - xMin)) + min;

        if (doRounding)
            value.val = Math.round(value.val);

        this.activeWidgetId = widgetId;

    }

    /*
     If either widget is active, OR we are hovering but not clicking,
     switch to hover color.
     */
    var isHover = (this.activeWidgetId == widgetId) || (mouseCollision && !this.io.mouseLeftDownCur  );


    /*
     SLIDER RENDERING
     */

    /*
     Compute slider fill. Measures how much of the slider is filled.
     In range [0,1]
     */
    var sliderFill = (value.val - min) / (max - min);

    var sliderValueStr = value.val.toFixed(this.sliderValueNumDecimalDigits);

    this._box(
        sliderPosition,
        sliderSizes, isHover ? this.sliderBackgroundColorHover : this.sliderBackgroundColor);

    /*
     Now fill the slider based on `sliderFill`
     */
    this._box(
        sliderPosition,
        [sliderSizes[0] * sliderFill, sliderSizes[1]],
        isHover ? this.sliderFillColorHover : this.sliderFillColor);

    var sliderValueStrSizes = this._getTextSizes(sliderValueStr);


    // render text in slider
    this._textCenter(sliderPosition, sliderSizes, sliderValueStr);

    // now render slider label.
    var sliderLabelPosition = [sliderPosition[0] + sliderSizes[0] + this.widgetLabelHorizontalSpacing, sliderPosition[1]]
    var sliderLabelStrSizes = [this._getTextSizes(labelStr)[0], sliderSizes[1]];
    this._textCenter(sliderLabelPosition, sliderLabelStrSizes, labelStr);

    this.prevWidgetSizes = [sliderSizes[0] + sliderLabelStrSizes[0], sliderSizes[1]];

}


GUI.prototype._window = function () {

    var widgetId = hashString(this.windowTitle);

    /*
     WINDOW IO(move window when dragging the title-bar using the left mouse button)
     */

    var titleBarPosition = this.windowPosition;
    var titleBarSizes = [this.windowSizes[0], this.titleBarHeight];

    if (
        _inBox(titleBarPosition, titleBarSizes, this.io.mousePosition) &&
        this.io.mouseLeftDownCur == true && this.io.mouseLeftDownPrev == false) {
        this.activeWidgetId = widgetId;
    }

    if (this.activeWidgetId == widgetId) {

        if (_inBox(titleBarPosition, titleBarSizes, this.io.mousePosition)) {
            // if mouse in title bar, just use the mouse position delta to adjust the window pos.

            this.windowPosition = [
                this.windowPosition[0] + (this.io.mousePosition[0] - this.io.mousePositionPrev[0]),
                this.windowPosition[1] + (this.io.mousePosition[1] - this.io.mousePositionPrev[1])
            ];

            // the mouse position relative to the top-left corner of the window.
            this.relativeMousePosition = [
                (this.windowPosition[0] - this.io.mousePosition[0]),
                (this.windowPosition[1] - this.io.mousePosition[1])
            ];

        } else {

            /*
             If the window cannot keep up with the mouse, we must use the relative mouse position to approximate
             the change in (x,y)
             */

            this.windowPosition = [
                this.relativeMousePosition[0] + (this.io.mousePosition[0]),
                this.relativeMousePosition[1] + (this.io.mousePosition[1])
            ];
        }

        // update title bar position.
        titleBarPosition = this.windowPosition;
    }

    /*
     WINDOW RENDERING.
     */

    // draw title bar
    this._box(titleBarPosition, titleBarSizes, this.titleBarColor);

    // draw title bar text
    this._textCenter(
        [this.windowPosition[0] + this.titleBarVerticalSpacing, this.windowPosition[1]],
        [this._getTextSizes(this.windowTitle)[0], this.titleBarHeight],
        this.windowTitle);

    // draw the actual window.
    this._box([this.windowPosition[0], this.windowPosition[1] + this.titleBarHeight], this.windowSizes,
        this.windowColor, this.windowAlpha);

    // setup the window-caret. The window-caret is where we will place the next widget in the window.
    this.windowCaret = [
        this.windowPosition[0] + this.windowSpacing,
        this.windowPosition[1] + this.windowSpacing + this.titleBarHeight];
    this.prevWidgetSizes = null; // should be null at the beginning.


    /*
     Determine whether the mouse is inside the window. We need this in some places.
     */
    this.mouseInWindow = _inBox(titleBarPosition,
        [this.windowSizes[0], this.titleBarHeight + this.windowSizes[1]],
        this.io.mousePosition);
}


GUI.prototype._restoreGLState = function (gl) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lastElementArrayBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lastArrayBuffer);
    gl.useProgram(this.lastProgram);
    gl.bindTexture(gl.TEXTURE_2D, this.lastTexture);

    if (this.lastEnableDepthTest) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);
    if (this.lastEnableBlend) gl.enable(gl.BLEND); else gl.disable(gl.BLEND);
}


GUI.prototype._backupGLState = function (gl) {

    this.lastProgram = gl.getParameter(gl.CURRENT_PROGRAM);
    this.lastElementArrayBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
    this.lastArrayBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    this.lastTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
    this.lastEnableDepthTest = gl.isEnabled(gl.DEPTH_TEST);
    this.lastEnableBlend = gl.isEnabled(gl.BLEND);

    /*
     TODO: figure out how to back up `blendFunc`.
     */

}

module.exports = GUI;
