
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
var g_LookAtX = 1, g_LookAtY = 1, g_LookatZ = 1;
var g_DisplaceX = (g_LookAtX - g_EyeX) * 0.2;
var g_DisplaceY = (g_LookAtY - g_EyeY) * 0.2;
var g_DisplaceZ = (g_LookatZ - g_EyeZ) * 0.2;
var theta = 90;
var ilt = 0;




													// (x,y,z,w)position + (r,g,b)color
													// Later, see if you can add:
													// (x,y,z) surface normal + (tx,ty) texture addr.



function main() {
//==============================================================================
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');
  var xtraMargin = 16;
	canvas.width = window.innerWidth - xtraMargin;
	canvas.height = (window.innerHeight*(3/4)) - xtraMargin; 
  // Get the rendering context for WebGL
  
  var gl = getWebGLContext(canvas);
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
  var n = initVertexBuffer(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

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
	  				// create, fill the gndVerts array
  // how many floats total needed to store all shapes?
	var mySiz = (gndVerts.length);						

	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);
	// Copy all shapes into one big Float32 array:
  var colorShapes = new Float32Array(mySiz);

		gndStart = 0;						// next we'll store the ground-plane;
	for(i=0, j=0; j< gndVerts.length; i++, j++)
	{
		colorShapes[i] = gndVerts[j];
	}
  // Create a buffer object on the graphics hardware:
  var shapeBufferHandle = gl.createBuffer();  
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
	modelMatrix.setOrtho(-60,60,-60,60,1,500);
	modelMatrix.lookAt(g_EyeX, g_EyeY, g_EyeZ,	// center of projection
		g_LookAtX, g_LookAtY, g_LookatZ,	// wlook-at point 
		0, 0, 1);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	
    gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
    						  gndStart/floatsPerVertex,	// start at this vertex number, and
							  gndVerts.length/floatsPerVertex);	// draw this many vertices.
	
	// PERSPECTIVE VIEW ///////////////////////////////////////////////////////////////////////////
	gl.viewport(0, 0, canvas.width/2, canvas.height);  
	modelMatrix = popMatrix();	
	modelMatrix.setIdentity(); 			    
	modelMatrix.perspective(40, vpAspect, 1.0, 500.0);
	modelMatrix.lookAt(g_EyeX, g_EyeY, g_EyeZ,	// center of projection
		g_LookAtX, g_LookAtY, g_LookatZ,	// look-at point 
		0, 0, 1);	// View UP vector.
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
		  gndStart/floatsPerVertex,	// start at this vertex number, and
		  gndVerts.length/floatsPerVertex);	// draw this many vertices.

}

function drawResize()
{
	var xtraMargin = 16;
	canvas.width = window.innerWidth - xtraMargin;
	canvas.height = (window.innerHeight*(3/4)) - xtraMargin; 
	drawAll();
}

function keydown(ev, gl, u_ModelMatrix, modelMatrix) {
	//------------------------------------------------------
	//HTML calls this'Event handler' or 'callback function' when we press a key:
		g_DisplaceX = (g_LookAtX - g_EyeX) * 0.2;
		g_DisplaceY = (g_LookAtY - g_EyeY) * 0.2;
		g_DisplaceZ = (g_LookatZ - g_EyeZ) * 0.2;

		var rotatedX = (g_DisplaceX * Math.cos(90 * (Math.PI/180))) - (g_DisplaceY * Math.sin(90 * (Math.PI/180)));
		var rotatedY = (g_DisplaceX * Math.sin(90 * (Math.PI/180))) + (g_DisplaceY * Math.cos(90 * (Math.PI/180)));

		
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
