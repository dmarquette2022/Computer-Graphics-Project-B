	
// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
'uniform mat4 u_ModelMatrix;\n' +
'attribute vec4 a_Position;\n' +
'attribute vec4 a_Color;\n' +
'varying vec4 v_Color;\n' +
'void main() {\n' +
'  gl_Position = u_ModelMatrix * a_Position;\n' +
'  gl_PointSize = 10.0;\n' +
'  v_Color = a_Color;\n' +
'}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
'precision mediump float;\n' +
//  '#endif GL_ES\n' +
'varying vec4 v_Color;\n' +
'void main() {\n' +
'  gl_FragColor = v_Color;\n' +
'}\n';

// Global Variables
var ANGLE_STEP = 45.0;		// Rotation angle rate (degrees/second)
var floatsPerVertex = 7;	// # of Float32Array elements used for each vertex
var canvas;

var g_EyeX = 5, g_EyeY = 5, g_EyeZ = 3; 
var g_LookatZ = 2.4;
var g_DisplaceX = (g_LookAtX - g_EyeX) * 0.2;
var g_DisplaceY = (g_LookAtY - g_EyeY) * 0.2;
var g_DisplaceZ = (g_LookatZ - g_EyeZ) * 0.2;
var theta = 40;
var g_LookAtX = g_EyeX + Math.cos(theta * (Math.PI/180));
var g_LookAtY = g_EyeY + Math.sin(theta * (Math.PI/180));


// Global vars for mouse click-and-drag for rotation.
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  
var rotatedX = (g_DisplaceX * Math.cos(90 * (Math.PI/180))) - (g_DisplaceY * Math.sin(90 * (Math.PI/180)));
var rotatedY = (g_DisplaceX * Math.sin(90 * (Math.PI/180))) + (g_DisplaceY * Math.cos(90 * (Math.PI/180)));

var qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0,0,0,1);	// 'current' orientation (made from qNew)
var quatMatrix = new Matrix4();				// rotation matrix, made from latest qTot

var sphereX = 0, sphereY = 0;
var spinny = 0;


//window.addEventListener("mousedown", myMouseDown); 
// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
//window.addEventListener("mousemove", myMouseMove); 
//window.addEventListener("mouseup", myMouseUp);	
//window.addEventListener("click", myMouseClick);				
//window.addEventListener("dblclick", myMouseDblClick);
//window.addEventListener("wheel",scroll);

var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0;
var gl;
var n;

function main() {
//==============================================================================
// Retrieve <canvas> element
canvas = document.getElementById('webgl');
var xtraMargin = 16;
canvas.width = window.innerWidth - xtraMargin;
canvas.height = (window.innerHeight*(3/4)) - xtraMargin; 
// Get the rendering context for WebGL
gl = getWebGLContext(canvas);
if (!gl) {
	console.log('Failed to get the rendering context for WebGL');
	return;
}

// Initialize shaders
if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
	console.log('Failed to intialize shaders.');
	return;
}

// 
n = initVertexBuffer(gl);
if (n < 0) {
	console.log('Failed to set the vertex information');
	return;
}

canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
  					// when user's mouse button goes down, call mouseDown() function
canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };
											// when the mouse moves, call mouseMove() function					
canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};

// Specify the color for clearing <canvas>
gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);			 // WebGL default setting: (default)
	gl.enable(gl.DEPTH_TEST); 	 

// Get handle to graphics system's storage location of u_ModelMatrix
var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
if (!u_ModelMatrix) { 
	console.log('Failed to get the storage location of u_ModelMatrix');
	return;
}
// Create a local version of our model matrix in JavaScript 
var modelMatrix = new Matrix4();

document.onkeydown= function(ev){keydown(ev, gl, u_ModelMatrix, modelMatrix); };

// Create, init current rotation angle value in JavaScript
var currentAngle = 0.0;

//-----------------  
// Start drawing: create 'tick' variable whose value is this function:
var tick = function() {
	spinny+=2
	currentAngle = animate(currentAngle);  // Update the rotation angle
	drawAll(gl, n, currentAngle, modelMatrix, u_ModelMatrix);   // Draw shapes
	// report current angle on console
	//console.log('currentAngle=',currentAngle);
	requestAnimationFrame(tick, canvas);   
										// Request that the browser re-draw the webpage
};
tick();							// start (and continue) animation: draw current image
	
}

function initVertexBuffer(gl) 
{
//==============================================================================
// Create one giant vertex buffer object (VBO) that holds all vertices for all
// shapes.

	// Make each 3D shape in its own array of vertices:
	makeGroundGrid();
	makeSphere();
					// create, fill the gndVerts array
// how many floats total needed to store all shapes?
	var mySiz = (gndVerts.length+sphVerts.length);						

	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);
	// Copy all shapes into one big Float32 array:
var colorShapes = new Float32Array(mySiz);
	for(i=0,j=0;j<sphVerts.length;i++,j++){
		colorShapes[j] = sphVerts[j]
	}
		gndStart = sphVerts.length;						// next we'll store the ground-plane;
	for(i=gndStart, j=0; j< gndVerts.length; i++, j++)
	{
		colorShapes[i] = gndVerts[j];
	}
// Create a buffer object on the graphics hardware:
var shapeBufferHandle = gl.createBuffer();
console.log(colorShapes)
if (!shapeBufferHandle) {
	console.log('Failed to create the shape buffer object');
	return false;
}

// Bind the the buffer object to target:
gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
// Transfer data from Javascript array colorShapes to Graphics system VBO
// (Use sparingly--may be slow if you transfer large shapes stored in files)
gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);
	
//Get graphics system's handle for our Vertex Shader's position-input variable: 
var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
if (a_Position < 0) {
	console.log('Failed to get the storage location of a_Position');
	return -1;
}

var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

// Use handle to specify how to retrieve **POSITION** data from our VBO:
gl.vertexAttribPointer(
		a_Position, 	// choose Vertex Shader attribute to fill with data
		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
		false, 				// did we supply fixed-point data AND it needs normalizing?
		FSIZE * floatsPerVertex, // Stride -- how many bytes used to store each vertex?
									// (x,y,z,w, r,g,b) * bytes/value
		0);						// Offset -- now many bytes from START of buffer to the
									// value we will actually use?
gl.enableVertexAttribArray(a_Position);  
									// Enable assignment of vertex buffer object's position data

// Get graphics system's handle for our Vertex Shader's color-input variable;
var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
if(a_Color < 0) {
	console.log('Failed to get the storage location of a_Color');
	return -1;
}
// Use handle to specify how to retrieve **COLOR** data from our VBO:
gl.vertexAttribPointer(
	a_Color, 				// choose Vertex Shader attribute to fill with data
	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
	false, 					// did we supply fixed-point data AND it needs normalizing?
	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
									// (x,y,z,w, r,g,b) * bytes/value
	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
									// value we will actually use?  Need to skip over x,y,z,w
									
gl.enableVertexAttribArray(a_Color);  
									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
// Unbind the buffer object 
gl.bindBuffer(gl.ARRAY_BUFFER, null);

return nn;
}
function makeSphere() {
	//==============================================================================
	// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
	// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
	// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
	// sphere from one triangle strip.
	  var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
												// (choose odd # or prime# to avoid accidental symmetry)
	  var sliceVerts	= 27;	// # of vertices around the top edge of the slice
												// (same number of vertices on bottom of slice, too)
	  var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
	  var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
	  var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
	  var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.
	
		// Create a (global) array to hold this sphere's vertices:
	  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
											// # of vertices * # of elements needed to store them. 
											// each slice requires 2*sliceVerts vertices except 1st and
											// last ones, which require only 2*sliceVerts-1.
											
		// Create dome-shaped top slice of sphere at z=+1
		// s counts slices; v counts vertices; 
		// j counts array elements (vertices * elements per vertex)
		var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
		var sin0 = 0.0;
		var cos1 = 0.0;
		var sin1 = 0.0;	
		var j = 0;							// initialize our array index
		var isLast = 0;
		var isFirst = 1;
		for(s=0; s<slices; s++) {	// for each slice of the sphere,
			// find sines & cosines for top and bottom of this slice
			if(s==0) {
				isFirst = 1;	// skip 1st vertex of 1st slice.
				cos0 = 1.0; 	// initialize: start at north pole.
				sin0 = 0.0;
			}
			else {					// otherwise, new top edge == old bottom edge
				isFirst = 0;	
				cos0 = cos1;
				sin0 = sin1;
			}								// & compute sine,cosine for new bottom edge.
			cos1 = Math.cos((s+1)*sliceAngle);
			sin1 = Math.sin((s+1)*sliceAngle);
			// go around the entire slice, generating TRIANGLE_STRIP verts
			// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
			if(s==slices-1) isLast=1;	// skip last vertex of last slice.
			for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {	
				if(v%2==0)
				{				// put even# vertices at the the slice's top edge
								// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
								// and thus we can simplify cos(2*PI(v/2*sliceVerts))  
					sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
					sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
					sphVerts[j+2] = cos0;		
					sphVerts[j+3] = 1.0;			
				}
				else { 	// put odd# vertices around the slice's lower edge;
								// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
								// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
					sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
					sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
					sphVerts[j+2] = cos1;																				// z
					sphVerts[j+3] = 1.0;																				// w.		
				}
				if(s==0) {	// finally, set some interesting colors for vertices:
					sphVerts[j+4]=0.678-Math.random()/10;
						sphVerts[j+5]=0.847-Math.random()/10;
						sphVerts[j+6]=0.902;	
					}
				else if(s==slices-1) {
					sphVerts[j+4]=0.678-Math.random()/10;
						sphVerts[j+5]=0.847-Math.random()/10;
						sphVerts[j+6]=0.902;	
				}
				else {
						sphVerts[j+4]=0.678-Math.random()/10;
						sphVerts[j+5]=0.847-Math.random()/10;
						sphVerts[j+6]=0.902;				
				}
			}
		}
	}

function drawSwirly(gl, n, currentAngle, modelMatrix, u_ModelMatrix){
	modelMatrix.translate(20,2,10,0);
	modelMatrix.scale(4,4,4);
	modelMatrix.rotate(spinny*2, 0,1, 0.0);
	quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w);	// Quaternion-->Matrix
	//modelMatrix.concat(quatMatrix);
	
	
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
		0/floatsPerVertex,	// start at this vertex number, and
		sphVerts.length/floatsPerVertex);	// draw this many vertices.
	pushMatrix(modelMatrix);
	modelMatrix = popMatrix();
	modelMatrix.scale(0.9,0.9,0.9);
	modelMatrix.rotate(spinny*3, 1,1, 0.0);
	modelMatrix.translate(0.8,0.8,0.8,0);
	
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
	0/floatsPerVertex,	// start at this vertex number, and
	sphVerts.length/floatsPerVertex);	// draw this many vertices.
	pushMatrix(modelMatrix);
	modelMatrix = popMatrix();
	modelMatrix.scale(0.7,0.7,0.7);
	modelMatrix.rotate(spinny, 1,1, 0.0);
	modelMatrix.translate(0.8,0.8,0.8,0);

	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
	0/floatsPerVertex,	// start at this vertex number, and
	sphVerts.length/floatsPerVertex);	// draw this many vertices.
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
	0/floatsPerVertex,	// start at this vertex number, and
	sphVerts.length/floatsPerVertex);	// draw this many vertices.
	pushMatrix(modelMatrix);
	modelMatrix = popMatrix();
	modelMatrix.scale(0.7,0.7,0.7);
	modelMatrix.rotate(spinny, 1,1, 0.0);
	modelMatrix.translate(0.8,0.8,0.8,0);

	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
	0/floatsPerVertex,	// start at this vertex number, and
	sphVerts.length/floatsPerVertex);	// draw this many vertices.
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
	0/floatsPerVertex,	// start at this vertex number, and
	sphVerts.length/floatsPerVertex);	// draw this many vertices.
	pushMatrix(modelMatrix);
	modelMatrix = popMatrix();
	modelMatrix.scale(0.7,0.7,0.7);
	modelMatrix.rotate(spinny, 1,1, 0.0);
	modelMatrix.translate(0.8,0.8,0.8,0);

	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
	0/floatsPerVertex,	// start at this vertex number, and
	sphVerts.length/floatsPerVertex);	// draw this many vertices.
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
	0/floatsPerVertex,	// start at this vertex number, and
	sphVerts.length/floatsPerVertex);	// draw this many vertices.
	pushMatrix(modelMatrix);
	modelMatrix = popMatrix();
	modelMatrix.scale(0.7,0.7,0.7);
	modelMatrix.rotate(spinny, 1,1, 0.0);
	modelMatrix.translate(0.8,0.8,0.8,0);

	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
	0/floatsPerVertex,	// start at this vertex number, and
	sphVerts.length/floatsPerVertex);	// draw this many vertices.
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
	0/floatsPerVertex,	// start at this vertex number, and
	sphVerts.length/floatsPerVertex);	// draw this many vertices.
	pushMatrix(modelMatrix);
	modelMatrix = popMatrix();
	modelMatrix.scale(0.7,0.7,0.7);
	modelMatrix.rotate(spinny, 1,1, 0.0);
	modelMatrix.translate(0.8,0.8,0.8,0);

	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
	0/floatsPerVertex,	// start at this vertex number, and
	sphVerts.length/floatsPerVertex);	// draw this many vertices.
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
	0/floatsPerVertex,	// start at this vertex number, and
	sphVerts.length/floatsPerVertex);	// draw this many vertices.
	pushMatrix(modelMatrix);
	modelMatrix = popMatrix();
	modelMatrix.scale(0.7,0.7,0.7);
	modelMatrix.rotate(spinny*4, 1,1, 0.0);
	modelMatrix.translate(0.8,0.8,0.8,0);

	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
	0/floatsPerVertex,	// start at this vertex number, and
	sphVerts.length/floatsPerVertex);	// draw this many vertices.
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
	0/floatsPerVertex,	// start at this vertex number, and
	sphVerts.length/floatsPerVertex);	// draw this many vertices.
	pushMatrix(modelMatrix);
	modelMatrix = popMatrix();
	modelMatrix.scale(0.7,0.7,0.7);
	modelMatrix.rotate(spinny*8, 1,1, 0.0);
	modelMatrix.translate(0.8,0.8,0.8,0);

	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
	0/floatsPerVertex,	// start at this vertex number, and
	sphVerts.length/floatsPerVertex);	// draw this many vertices.
	
}

function drawSphere(gl, n, currentAngle, modelMatrix, u_ModelMatrix)
{
	quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w);	// Quaternion-->Matrix
	modelMatrix.concat(quatMatrix);
	modelMatrix.scale(10,10,10);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
	0/floatsPerVertex,	// start at this vertex number, and
	sphVerts.length/floatsPerVertex);	// draw this many vertices.
}
function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 100;			// # of lines to draw in x,y to make the grid.
	var ycount = 100;		
	var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
	var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
	var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
	
	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndVerts[j+4] = xColr[0];			// red
		gndVerts[j+5] = xColr[1];			// grn
		gndVerts[j+6] = xColr[2];			// blu
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndVerts[j+4] = yColr[0];			// red
		gndVerts[j+5] = yColr[1];			// grn
		gndVerts[j+6] = yColr[2];			// blu
	}
}

function drawAll(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(canvas.width/2,											// Viewport lower-left corner
			0, 			// location(in pixels)
			canvas.width/2, 				// viewport width,
			canvas.height);			// viewport height in pixels.
	var vpAspect = (canvas.width/2) /(canvas.height);

	
	// ORTHOGRAPHIC VIEW ///////////////////////////////////////////////////////////////////////////
	pushMatrix(modelMatrix);
	modelMatrix.setIdentity();
	modelMatrix.setOrtho(-(canvas.width/2)/20,(canvas.width/2)/20,-canvas.height/20,canvas.height/20,1,500);
	modelMatrix.lookAt(g_EyeX, g_EyeY, g_EyeZ,	// center of projection
		g_LookAtX, g_LookAtY, g_LookatZ,	// wlook-at point 
		0, 0, 1);
	modelMatrix.translate(40,30,-30,0);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

	gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
							gndStart/floatsPerVertex,	// start at this vertex number, and
							gndVerts.length/floatsPerVertex);	// draw this many vertices.
	pushMatrix(modelMatrix);
	drawSwirly(gl, n, currentAngle, modelMatrix, u_ModelMatrix);
	modelMatrix = popMatrix();
	drawSphere(gl, n, currentAngle, modelMatrix, u_ModelMatrix);

	
	// PERSPECTIVE VIEW ///////////////////////////////////////////////////////////////////////////
	gl.viewport(0, 0, canvas.width/2, canvas.height);  
	modelMatrix = popMatrix();
	
	modelMatrix.setIdentity(); 			    
	modelMatrix.perspective(40, vpAspect, 1.0, 500.0);
	modelMatrix.lookAt(g_EyeX, g_EyeY, g_EyeZ,	// center of projection
		g_LookAtX, g_LookAtY, g_LookatZ,	// look-at point 
		0, 0, 1);	// View UP vector.
	modelMatrix.translate(40,30,-30,0)
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	//DRAWING THE GRID
	gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
	gndStart/floatsPerVertex,	// start at this vertex number, and
	gndVerts.length/floatsPerVertex);	// draw this many vertices.
	pushMatrix(modelMatrix);
	drawSwirly(gl, n, currentAngle, modelMatrix, u_ModelMatrix);
	modelMatrix = popMatrix();
	drawSphere(gl, n, currentAngle, modelMatrix, u_ModelMatrix);
}

function drawResize()
{
	var xtraMargin = 16;
	canvas.width = window.innerWidth - xtraMargin;
	canvas.height = (window.innerHeight*(3/4)) - xtraMargin; 
	drawAll(gl, n, currentAngle, modelMatrix, u_ModelMatrix);
}

function keydown(ev, gl, u_ModelMatrix, modelMatrix) {
	//------------------------------------------------------
	//HTML calls this'Event handler' or 'callback function' when we press a key:
		g_DisplaceX = (g_LookAtX - g_EyeX) * 0.5;
		g_DisplaceY = (g_LookAtY - g_EyeY) * 0.5;
		g_DisplaceZ = (g_LookatZ - g_EyeZ) * 0.5;

		rotatedX = (g_DisplaceX * Math.cos(90 * (Math.PI/180))) - (g_DisplaceY * Math.sin(90 * (Math.PI/180)));
		rotatedY = (g_DisplaceX * Math.sin(90 * (Math.PI/180))) + (g_DisplaceY * Math.cos(90 * (Math.PI/180)));

		
		if(ev.keyCode == 39) { // The right arrow key was pressed
	//      g_EyeX += 0.01;
					g_EyeX -= rotatedX;		// INCREASED for perspective camera)
					g_EyeY -= rotatedY;

					g_LookAtX -= rotatedX;
					g_LookAtY -= rotatedY;
		} else 
		if(ev.keyCode == 38) { // The up arrow key was pressed
			//      g_EyeX += 0.01;
							g_EyeX += g_DisplaceX;
							g_EyeY += g_DisplaceY;
							g_EyeZ += g_DisplaceZ;

							g_LookAtX += g_DisplaceX;
							g_LookAtY += g_DisplaceY;
							g_LookatZ += g_DisplaceZ;
				} else 
		if(ev.keyCode == 40) { // The up arrow key was pressed
			//      g_EyeX += 0.01;
							g_EyeX -= g_DisplaceX;
							g_EyeY -= g_DisplaceY;
							g_EyeZ -= g_DisplaceZ;

							g_LookAtX -= g_DisplaceX;
							g_LookAtY -= g_DisplaceY;
							g_LookatZ -= g_DisplaceZ;
				} else
		if(ev.keyCode == 68) { //D Key
							theta -= 1;
							g_LookAtX = g_EyeX + Math.cos(theta * (Math.PI/180));
							g_LookAtY = g_EyeY + Math.sin(theta * (Math.PI/180));
				} else 
		if(ev.keyCode == 65) { //A Key
							theta += 1;
							g_LookAtX = g_EyeX + Math.cos(theta * (Math.PI/180));
							g_LookAtY = g_EyeY + Math.sin(theta * (Math.PI/180));
				} else
		if(ev.keyCode == 87) { //W Key
							g_LookatZ += 0.04;
				} else
		if(ev.keyCode == 83) { //S Key
							g_LookatZ -= 0.04;
				} else 
		if (ev.keyCode == 37) { // The left arrow key was pressed
	//      g_EyeX -= 0.01;
					g_EyeX += rotatedX;		// INCREASED for perspective camera)
					g_EyeY += rotatedY;

					g_LookAtX += rotatedX;
					g_LookAtY += rotatedY;
		} else { return; } // Prevent the unnecessary drawing   
	}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================
// Calculate the elapsed time
var now = Date.now();
var elapsed = now - g_last;
g_last = now;
	

}
function myMouseDown(ev, gl, canvas) {
	//==============================================================================
	// Called when user PRESSES down any mouse button;
	// 									(Which button?    console.log('ev.button='+ev.button);   )
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
	
	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
	  
		// Convert to Canonical View Volume (CVV) coordinates too:
	  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
							   (canvas.width/2);			// normalize canvas to -1 <= x < +1,
		var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
								 (canvas.height/2);
	//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
		
		isDrag = true;											// set our mouse-dragging flag
		xMclik = x;													// record where mouse-dragging began
		yMclik = y;
	};
	
	
	function myMouseMove(ev, gl, canvas) {
		//==============================================================================
		// Called when user MOVES the mouse with a button already pressed down.
		// 									(Which button?   console.log('ev.button='+ev.button);    )
		// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
		//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
		
			if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'
		
			// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
		  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
		  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
			var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
		//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
		  
			// Convert to Canonical View Volume (CVV) coordinates too:
		  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
								   (canvas.width/2);			// normalize canvas to -1 <= x < +1,
			var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
									 (canvas.height/2);
		
			// find how far we dragged the mouse:
			xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
			yMdragTot += (y - yMclik);
			// AND use any mouse-dragging we found to update quaternions qNew and qTot.
			dragQuat(x - xMclik, y - yMclik);
			
			xMclik = x;													// Make NEXT drag-measurement from here.
			yMclik = y;
			
			// Show it on our webpage, in the <div> element named 'MouseText':
			/*
			document.getElementById('MouseText').innerHTML=
					'Mouse Drag totals (CVV x,y coords):\t'+
					 xMdragTot.toFixed(5)+', \t'+
					 yMdragTot.toFixed(5);	
					 */
		};
		
	
		function myMouseUp(ev, gl, canvas) {
			//==============================================================================
			// Called when user RELEASES mouse button pressed previously.
			// 									(Which button?   console.log('ev.button='+ev.button);    )
			// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
			//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
			
			// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
			  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
			  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
				var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
			//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
			  
				// Convert to Canonical View Volume (CVV) coordinates too:
			  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
									   (canvas.width/2);			// normalize canvas to -1 <= x < +1,
				var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
										 (canvas.height/2);
			//	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
				
				isDrag = false;											// CLEAR our mouse-dragging flag, and
				// accumulate any final bit of mouse-dragging we did:
				xMdragTot += (x - xMclik);
				yMdragTot += (y - yMclik);
			//	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
			
				// AND use any mouse-dragging we found to update quaternions qNew and qTot;
				dragQuat(x - xMclik, y - yMclik);
			
				// Show it on our webpage, in the <div> element named 'MouseText':
				/*
				document.getElementById('MouseText').innerHTML=
						'Mouse Drag totals (CVV x,y coords):\t'+
						 xMdragTot.toFixed(5)+', \t'+
						 yMdragTot.toFixed(5);	
						 */
			};
	function dragQuat(xdrag, ydrag) {
	//==============================================================================
	// Called when user drags mouse by 'xdrag,ydrag' as measured in CVV coords.
	// We find a rotation axis perpendicular to the drag direction, and convert the 
	// drag distance to an angular rotation amount, and use both to set the value of 
	// the quaternion qNew.  We then combine this new rotation with the current 
	// rotation stored in quaternion 'qTot' by quaternion multiply.  Note the 
	// 'draw()' function converts this current 'qTot' quaternion to a rotation 
	// matrix for drawing. 
		var res = 5;
		var qTmp = new Quaternion(0,0,0,1);

		var objVecX = g_EyeX - sphereX;
		var objVecY = g_EyeY - sphereY;
		var objVecZ = g_EyeZ;



		var dist = Math.sqrt(xdrag*xdrag + ydrag*ydrag);
		// console.log('xdrag,ydrag=',xdrag.toFixed(5),ydrag.toFixed(5),'dist=',dist.toFixed(5));
		qNew.setFromAxisAngle(-ydrag + 0.0001, xdrag + 0.0001, 0.0, dist*150.0);
		//qNew.setFromAxisAngle(-rotatedY + 0.0001, rotatedX + 0.0001, 0.0, dist*150.0);
		// (why add tiny 0.0001? To ensure we never have a zero-length rotation axis)
								// why axis (x,y,z) = (-yMdrag,+xMdrag,0)? 
								// -- to rotate around +x axis, drag mouse in -y direction.
								// -- to rotate around +y axis, drag mouse in +x direction.

		qTmp.multiply(qNew, qTot);			// apply new rotation to current rotation. 
		//--------------------------
		// IMPORTANT! Why qNew*qTot instead of qTot*qNew? (Try it!)
		// ANSWER: Because 'duality' governs ALL transformations, not just matrices. 
		// If we multiplied in (qTot*qNew) order, we would rotate the drawing axes
		// first by qTot, and then by qNew--we would apply mouse-dragging rotations
		// to already-rotated drawing axes.  Instead, we wish to apply the mouse-drag
		// rotations FIRST, before we apply rotations from all the previous dragging.
		//------------------------
		// IMPORTANT!  Both qTot and qNew are unit-length quaternions, but we store 
		// them with finite precision. While the product of two (EXACTLY) unit-length
		// quaternions will always be another unit-length quaternion, the qTmp length
		// may drift away from 1.0 if we repeat this quaternion multiply many times.
		// A non-unit-length quaternion won't work with our quaternion-to-matrix fcn.
		// Matrix4.prototype.setFromQuat().
	    //qTmp.normalize();						// normalize to ensure we stay at length==1.0.
		qTot.copy(qTmp);
		// show the new quaternion qTot on our webpage in the <div> element 'QuatValue'
		/*
		document.getElementById('QuatValue').innerHTML= 
															 '\t X=' +qTot.x.toFixed(res)+
															'i\t Y=' +qTot.y.toFixed(res)+
															'j\t Z=' +qTot.z.toFixed(res)+
															'k\t W=' +qTot.w.toFixed(res)+
															'<br>length='+qTot.length().toFixed(res);
															*/
	};			

	function myMouseClick(ev) {
	//=============================================================================
	// Called when user completes a mouse-button single-click event 
	// (e.g. mouse-button pressed down, then released)
	// 									   
	//    WHICH button? try:  console.log('ev.button='+ev.button); 
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
	//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.
	
	  // STUB
		console.log("myMouseClick() on button: ", ev.button); 
	}	
	
	function myMouseDblClick(ev) {
	//=============================================================================
	// Called when user completes a mouse-button double-click event 
	// 									   
	//    WHICH button? try:  console.log('ev.button='+ev.button); 
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
	//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.
	
	  // STUB
		console.log("myMouse-DOUBLE-Click() on button: ", ev.button); 
	}	