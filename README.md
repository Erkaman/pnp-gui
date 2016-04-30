# pnp-gui

pnp-gui is a WebGL gui toolkit whose main goal is to be easy to use, bloat-free, and be easy to
integrate into any project. Impatient people probably want a demo right away,
and [here](http://erkaman.github.io/gl-simple-gui/#demo) it is.

pnp-gui takes much inspiration from the fantastic [imgui](https://github.com/ocornut/imgui)
project. Like imgui, it provides an Immediate Mode GUI toolkit. Also like imgui,
it aims to be as bloat-free as possible, and to be as easy to integrate into
any project as project. Very little code to be written to initialize the GUI,
and a font comes pre-packaged with the library.

pnp-gui is mainly meant to be used by programmers who want to make a simple GUI
for debugging purposes, or who want a simple GUI that can be used
to tweak a couple of variables in their applications. In the provided demo,
some possible use-cases of pnp-gui are shown.

However, do note that due to the simplicity of the toolkit, there are many drawbacks.
pnp-gui does not provide you with any way to do advanced widget and window layout.
More advanced GUI toolkits such as Swing and QT provides ways to create advanced
window layouts. However, in order to reduce complexity, the window layout
options of pnp-gui have been made very limited, in order to reduce complexity.

Another important thing to note is that pnp-gui does not provide any way of
creating beautiful interfaces that can be presented to the end user. You can
tweak a couple of colors and spacing constants here and there, but there is
no support at all for skinning the GUI. Again, we empathize that the toolkit
is mainly meant to be used by programmers who want a simple GUI for debugging
purposes..

## Demo

A demo is given at this link:
http://erkaman.github.io/gl-simple-gui/

![text](images/demo_screen.png)

It is actually two demos in one, and the demo can be toggled with the upper radio button.
In the first demo, you can use the widgets of pnp-gui to change the lighting and color
settings of a simple model. In the second demo, you can use the widgets
of pnp-gui to modify the lighting, color and geometry of a simple heightmap.

## Tutorial

In this section, we give a tutorial that demonstrates how easy it is to use
the toolkit.

## FAQ

<b>What is an Immediate Mode GUI?</b>

This basically means that there is no retained state in the GUI; that is to say,
there are no objects that are used to store the widgets of the GUI. Instead the
GUI is being created on the fly every single frame. While this seem unnatural
to people who have not used such a GUI before, this kind of GUI results in
a GUI that is very intuitive to use for programmers. If you wish to know more, please
see the tutorial(TODO: MAKE INTO LINK).

<b>Does pnp-gui support text input?</b>

TODO

<b>Is it possible to change the default font?</b>

TODO

<b>How does it handle text encodings?</b>

## API


2500x2500