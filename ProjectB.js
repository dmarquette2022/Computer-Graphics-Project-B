// Project A by David Marquette and Alejandro Malavet

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

//------------For WebGL-----------------------------------------------
var gl;           // webGL Rendering Context. Set in main(), used everywhere.
var g_canvas = document.getElementById('webgl');     
                  // our HTML-5 canvas object that uses 'gl' for drawing.
                  
// ----------For tetrahedron & its matrix---------------------------------
var g_vertsMax = 0;                 // number of vertices held in the VBO 
                                    // (global: replaces local 'n' variable)
var g_modelMatrix = new Matrix4();  // Construct 4x4 matrix; contents get sent
                                    // to the GPU/Shaders as a 'uniform' var.
var g_modelMatLoc;                  // that uniform's location in the GPU

//------------For Animation---------------------------------------------
var g_isRun = true;                 // run/stop for animation; used in tick().
var g_lastMS = Date.now();    			// Timestamp for most-recently-drawn image; 

var main_speed = document.getElementById("main_rotor");

var g_mainRpm = main_speed.value;          // rotation speed, in degrees/second
var g_mainAngle = 0;

var tail_speed = document.getElementById("tail_rotor");
		
var g_tailRpm = tail_speed.value;
var g_tailAngle = 0.0;

var spin_speed = document.getElementById("spin_rotor");
		
var g_spinRpm = spin_speed.value;
var g_spinAngle = 0.0;

var g_vertical = 1;
var g_horizontal = 0.8;

var g_rotation = 0;
var g_pitch = 0;

var g_propAngle = 0;
var g_propRate = 90;

var zoom = document.getElementById("zoom");
var g_scale = zoom.value;

g_viewAngle = 30;

var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0;


window.addEventListener("mousedown", myMouseDown); 
// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
window.addEventListener("mousemove", myMouseMove); 
window.addEventListener("mouseup", myMouseUp);	
window.addEventListener("click", myMouseClick);				
window.addEventListener("dblclick", myMouseDblClick);
window.addEventListener("wheel",scroll);




function main() {

	// Get gl, the rendering context for WebGL, from our 'g_canvas' object
	gl = getWebGLContext(g_canvas);

	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.');
		return;
	}

	// Initialize a Vertex Buffer in the graphics system to hold our vertices
	g_maxVerts = initVertexBuffer(gl);  
	if (g_maxVerts < 0) {
		console.log('Failed to set the vertex information');
		return;
	}

	window.addEventListener("keydown", myKeyDown, false);
	gl.clearColor(0.3, 0.3, 0.3, 1.0);

	gl.depthFunc(gl.LESS);
	gl.enable(gl.DEPTH_TEST); 	  

	// Get handle to graphics system's storage location of u_ModelMatrix
	g_modelMatLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');

	if (!g_modelMatLoc) 
	{ 
		console.log('Failed to get the storage location of u_ModelMatrix');
		return;
	}

  var tick = function() {
	animate();
    drawAll();
    requestAnimationFrame(tick, g_canvas);
  };

  tick();
}

function initVertexBuffer() {				 

  var colorShapes = new Float32Array([
	
// Propeller
	0, 0, 0, 1, 		0.2,0.2,0.2,
	1, -0.1, 0, 1, 		0.2,0.2,0.2,
	1, 0.1, 0, 1,	 	0,0,0,
	1, -0.1, 0, 1, 		1,0,0,
	1, 0.1, 0, 1,	 	0,1,0,
	1, 0.1, -0.5, 1,	0,0,1,
	1, -0.1, 0, 1,	 	0.2,0.2,0.2,
	1, -0.1, -0.5, 1,	0.2,0.2,0.2,
	1, 0.1, -0.5, 1,	0,0,0,
	0, 0, 0, 1, 		0.2,0.2,0.2,
	1, -0.1, -0.5, 1, 	0.2,0.2,0.2,
	1, 0.1, -0.5, 1,	0,0,0,
	0, 0, 0, 1, 		0.2,0.2,0.2,
	1, 0.1, 0, 1,	 	0.2,0.2,0.2,
	1, 0.1, -0.5, 1,	0,0,0,
	0, 0, 0, 1, 		0.2,0.2,0.2,
	1, -0.1, 0, 1,	 	0.2,0.2,0.2,
	1, -0.1, -0.5, 1,	0,0,0,

// Body
	// Front
	0.0, 0.0, 0.0, 1.0, 	1,0.7,1,
	0.0,  1.0, 0.0, 1.0,  	0,0,1,
	1.0,  1.0, 0.0, 1.0, 	0.7,0,0,
	0.0, 0.0,  0.0, 1.0, 	0.7,0.7,1, 
	1.0,  0.0,  0.0, 1.0,   0.7,0.7,1,
	1.0,  1.0,  0.0, 1.0, 	0.7,0.7,1,
	0.0, 0.0,  1.0, 1.0, 	1,0.7,1, 
	0.0,  1.0,  1.0, 1.0,  	0,0,1,   
	1.0,  1.0,  1.0, 1.0, 	1,0,0,   
	0.0, 0.0,  1.0, 1.0, 	0.7,0.7,1,
	1.0,  0.0,  1.0, 1.0,   0.7,0.7,1,
	1.0,  1.0,  1.0, 1.0, 	0.7,0.7,1,
	1.0, 0.0,  0.0, 1.0, 	0.7,0.7,1, 
	1.0,  1.0,  0.0, 1.0,   0.7,0.7,1,
	1.0,  1.0,  1.0, 1.0, 	0.7,0.7,1,
	1.0, 0.0,  0.0, 1.0, 	0.7,0.7,1, 
	1.0,  0.0,  1.0, 1.0,   0.7,0.7,1,
	1.0,  1.0,  1.0, 1.0, 	0.7,0.7,1,
	0.0, 0.0,  0.0, 1.0, 	1,0.7,1, 
	0.0,  1.0,  0.0, 1.0,   0,0,1,   
	0.0,  1.0,  1.0, 1.0, 	1,0,0,   
	0.0, 0.0,  0.0, 1.0, 	1, 0.7,1, 
	0.0,  0.0,  1.0, 1.0,   0,0,1,   
	0.0,  1.0,  1.0, 1.0, 	1,0,0,   
	0.0, 1.0,  0.0, 1.0, 	0.7,0.7,1, 
	0.0,  1.0,  1.0, 1.0,   0.7,0.7,1,
	1.0,  1.0,  1.0, 1.0, 	0.7,0.7,1,
	0.0, 1.0,  0.0, 1.0, 	0.7,0.7,1, 
	1.0,  1.0,  0.0, 1.0,   0.7,0.7,1,
	1.0,  1.0,  1.0, 1.0, 	0.7,0.7,1,
	0.0, 0.0,  0.0, 1.0, 	0.7,0.7,1, 
	0.0,  0.0,  1.0, 1.0,   0.7,0.7,1,
	1.0,  0.0,  1.0, 1.0, 	0.7,0.7,1,
	0.0, 0.0,  0.0, 1.0, 	0.7,0.7,1, 
	1.0,  0.0,  0.0, 1.0,   0.7,0.7,1,
	1.0,  0.0,  1.0, 1.0, 	0.7,0.7,1,

	// Back
	0.0, 0.0, 0.0, 1.0, 	0.1,0.2,0,
	0.0,  1.0, 0.0, 1.0, 	1,0,0,
	1.0,  1,  -0.2, 1.0,    0,0,1,
	0.0, 0.0, -1.0, 1.0, 	0.1,0.2,0, 
	0.0,  1.0, -1.0, 1.0,  	0.7,0.7,1,
	1.0,  1,  -0.2, 1.0,  	0,0,1,
	0.0, 0.0, 0.0, 1.0, 	0.7,0.7,1, 
	0.0, 0.0, -1.0, 1.0, 	0.7,0.7,1,
	1.0,  1,  -0.2, 1.0,    0,0,1,

	0.0,  1.0, 0.0, 1.0,  	0.7,0.7,1,
	0.0,  1.0, -1.0, 1.0,  	1,0,0,
	1.0,  1,  -0.2, 1.0,   	0.7,0.7,1,

	// Propeller Stand
	0,   0, 0, 1, 		0,0,1,
	0, 0.8, 0, 1,		0,1,0,
	0.2, 0, 0, 1, 		1,0,0,
	0, 0.8, 0, 1,		0,1,0,
	0.2, 0.8, 0, 1, 	1,0,0,
	0.2, 0, 0, 1, 		0,0,1,
	0.2, 0.8, 0, 1, 	0,0,0,
	0.2, 0, 0, 1,  	 	0,0,0,
	0.2, 0, -0.2, 1, 	0,0,0,
	0.2, 0.8, 0, 1, 	0,0,0,
	0.2, 0.8, -0.2, 1, 	0,0,0,
	0.2, 0, -0.2, 1, 	0,0,0,
	0, 0, -0.2, 1, 		0,0,1,
	0, 0.8, -0.2, 1,	0,1,0,
	0.2, 0, -0.2, 1, 	1,0,0,
	0, 0.8, -0.2, 1,	0,1,0,
	0.2, 0.8, -0.2, 1,  1,0,0,
	0.2, 0, -0.2, 1, 	0,0,1,
	0, 0, -0.2, 1,		0,0,0,
	0, 0.8, -0.2, 1, 	0,0,0,
	0, 0.8, 0, 1, 		0,0,0,
	0, 0, 0, 1, 		0,0,0,
	0, 0.8, 0, 1,  		0,0,0,
	0, 0, -0.2, 1,		0,0,0,
	0, 0.8, 0, 1,		0,0,0,
	0, 0.8, -0.2, 1,	0,0,0,
	0.2, 0.8, 0, 1,		0,0,0,
	0, 0.8, -0.2, 1,	0,0,0,
	0.2, 0.8, 0, 1,		0,0,0,
	0.2, 0.8, -0.2, 1,	0,0,0,
	0, 0, 0, 1, 		0,0,0,
	0.2, 0, 0, 1, 		0,0,0,
	0, 0, -0.2, 1, 		0,0,0,
	0.2, 0, -0.2, 1, 	0,0,0,
	0.2, 0, 0, 1, 		0,0,0,
	0, 0, -0.2, 1, 		0,0,0,

	// Landing Gear
	0, 0, 0, 1, 		0,0,1,
	0, 0.2, 0, 1, 		0,1,0,
	1, 0, 0, 1, 		1,0,0,
	0, 0.2, 0,  1, 		0,1,0,
	1, 0, 0, 	1, 		0,0,1,
	1, 0.2, 0,  1, 		1,0,0,
	0, 0, -0.2, 1, 		0,0,0,
	0, 0.2, -0.2, 1, 	0,0,0,
	1, 0, -0.2, 1, 		0,0,0,
	0, 0.2, -0.2, 1, 	0,0,0,
	1, 0, -0.2, 1, 		0,0,0,
	1, 0.2, -0.2, 1, 	0,0,0,
	0, 0.2, -0.2, 1, 	0,0,0,
	1, 0.2, -0.2, 1, 	0,0,0,
	1, 0.2, 0, 1, 		0,0,0,
	1, 0.2, 0, 1, 		0,0,0,
	0, 0.2, -0.2, 1, 	0,0,0,
	0, 0.2, 0, 1, 		0,0,0,
	0, 0, -0.2, 1, 		0,0,0,
	1, 0, -0.2, 1, 		0,0,0,
	1, 0, 0, 1, 		1,1,1,
	1, 0, 0, 1, 		0,0,0,
	0, 0, -0.2, 1, 		0,0,0,
	0, 0, 0, 1, 		1,1,1,
	0, 0, -0.2, 1, 		0,0,0,
	0, 0, 0, 1, 		0,0,0,
	0, 0.2, 0, 1, 		1,1,1,
	0, 0.2, -0.2, 1, 	0,0,0,
	0, 0.2, 0, 1, 		0,0,0,
	0, 0, -0.2, 1, 		1,1,1,
	1, 0, -0.2, 1, 		0,0,0,
	1, 0, 0, 1, 		0,0,0,
	1, 0.2, 0, 1, 		1,1,1,
	1, 0.2, -0.2, 1, 	0,0,0,
	1, 0.2, 0, 1, 		0,0,0,
	1, 0, -0.2, 1, 		1,1,1,

	// Landing Gear Supports
	0, 0, 0, 1, 		0,0,1,
	0, 0.2, 0, 1,		0,1,0,
	0.2, 0, 0, 1, 		1,0,0,
	0, 0.2, 0, 1,		0,1,0,
	0.2, 0.2, 0, 1, 	0,0,1,
	0.2, 0, 0, 1, 		1,0,0,
	0.2, 0.2, 0, 1, 	0,0,0,
	0.2, 0, 0, 1,  	 	0,0,0,
	0.2, 0, -0.2, 1, 	0,0,0,
	0.2, 0.2, 0, 1, 	0,0,0,
	0.2, 0.2, -0.2, 1, 	0,0,0,
	0.2, 0, -0.2, 1, 	0,0,0,
	0, 0, -0.2, 1, 		1,0,0,			
	0, 0.2, -0.2, 1,	0,1,0,	
	0.2, 0, -0.2, 1, 	0,0,1,
	0, 0.2, -0.2, 1,	1,0,0,	
	0.2, 0.2, -0.2, 1,	0,0,1,  
	0.2, 0, -0.2, 1, 	0,0,1,

	0, 0, -0.2, 1,		0,0,0,
	0, 0.2, -0.2, 1, 	0,0,0,
	0, 0.2, 0, 1, 		0.5,0.5,0.5,
	0, 0, 0, 1, 		0,0,0,
	0, 0.2, 0, 1,  		0,0,0,
	0, 0, -0.2, 1,		0.5,0.5,0.5,
	0, 0.2, 0, 1,		0,0,0,
	0, 0.2, -0.2, 1,	0,0,0,
	0.2, 0.2, 0, 1,		0.5,0.5,0.5,
	0, 0.2, -0.2, 1,	0,0,0,
	0.2, 0.2, 0, 1,		0,0,0,
	0.2, 0.2, -0.2, 1,	0.5,0.5,0.5,
	0, 0, 0, 1, 		0,0,0,
	0.2, 0, 0, 1, 		0,0,0,
	0, 0, -0.2, 1, 		0.5,0.5,0.5,
	0.2, 0, -0.2, 1, 	0,0,0,
	0.2, 0, 0, 1, 		0,0,0,
	0, 0, -0.2, 1, 		0.5,0.5,0.5,
  ]);

  g_vertsMax = 138;

  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; 

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, FSIZE * 7, 0);						
  									
  gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 7, FSIZE * 4);
  									
  gl.enableVertexAttribArray(a_Color);  

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

}


function drawAll() 
{
  	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	clrColr = new Float32Array(4);
	clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);
	


	g_modelMatrix.setTranslate(-0.5,-0.5,0,0);
	
	g_modelMatrix.translate(g_horizontal,g_vertical,0,0);
	g_modelMatrix.scale(g_scale/100,g_scale/100,g_scale/100);
	var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
	g_modelMatrix.rotate(dist*60.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawBody();
	pushMatrix(g_modelMatrix);
	g_modelMatrix.translate(0.5,1.1,0.5,0);
	g_modelMatrix.rotate(g_mainAngle,0,1,0);
	g_modelMatrix.scale(0.7,0.7,0.7);
	//g_modelMatrix.rotate(90, 1, 0, 0);

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90, 0,1,0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90, 0,1,0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90, 0,1,0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();

	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);

	g_modelMatrix.translate(-0.1,0.5,0.5,0);
	g_modelMatrix.rotate(g_tailAngle,1,0,0);
	g_modelMatrix.rotate(90,0,0,1);
	g_modelMatrix.scale(0.4,0.4,0.4);

	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);
	
	g_modelMatrix.translate(1,0,1,0);
	g_modelMatrix.scale(1.3,1,1);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);

	drawBack();
	g_modelMatrix.translate(1,1,-0.15,0);
	g_modelMatrix.scale(0.5,0.5,0.5);
	g_modelMatrix.translate(-0.2,0,0,0);
	g_modelMatrix.rotate(g_propAngle, 0, 0, 1);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawBackProp();
	g_modelMatrix.translate(0.1,0.8,0,0);
	g_modelMatrix.rotate(90,1,0,0);
	g_modelMatrix.rotate(g_tailAngle, 0,1,0);
	g_modelMatrix.scale(0.6,0.6,0.6);
	//g_modelMatrix.scale(0.2,0.2,0.2);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();


	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);
	g_modelMatrix.translate(0,-0.4, 0.2, 0);
	//g_modelMatrix.scale(2,2,2);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawLanding();
	
	g_modelMatrix.translate(0.15,0.2, 0, 0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawFeetSupport();
	g_modelMatrix.translate(0.45, 0, 0, 0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawFeetSupport();

	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);
	g_modelMatrix.translate(0,-0.4, 1, 0);
	//g_modelMatrix.scale(2,2,2);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawLanding();
	g_modelMatrix.translate(0.15,0.2, 0, 0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawFeetSupport();
	g_modelMatrix.translate(0.45, 0, 0, 0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawFeetSupport();









	
	g_modelMatrix.setTranslate(-0.3,0,0,0);
	g_modelMatrix.rotate(90,0,0,1);
	g_modelMatrix.rotate(140,1,0,0);
	g_modelMatrix.rotate(-7,0,1,0);
	g_modelMatrix.rotate(g_spinAngle,0,0,1);
	g_modelMatrix.scale(0.5,0.5,0.5);
	g_modelMatrix.rotate(90,1,0,0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();

	pushMatrix(g_modelMatrix);
	g_modelMatrix.scale(0.3,0.3,0.3);
	g_modelMatrix.translate(3, 0,0, 0);
	g_modelMatrix.rotate(90,1,0,0);
	g_modelMatrix.rotate(g_spinAngle,0,1,0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	
	
	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);

	g_modelMatrix.scale(0.3,0.3,0.3);
	g_modelMatrix.rotate(90,1,0,0);
	g_modelMatrix.rotate(90,0,0,1);
	g_modelMatrix.translate(-3, 0,0, 0);
	g_modelMatrix.rotate(g_spinAngle,0,1,0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();

	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);

	g_modelMatrix.scale(0.3,0.3,0.3);
	g_modelMatrix.rotate(90,1,0,0);
	g_modelMatrix.rotate(90,0,0,1);
	g_modelMatrix.translate(3, 0,0, 0);
	g_modelMatrix.rotate(g_spinAngle,0,1,0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();

	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);
	g_modelMatrix.scale(0.3,0.3,0.3);
	g_modelMatrix.translate(-3, 0,0, 0);
	g_modelMatrix.rotate(90,1,0,0);
	g_modelMatrix.rotate(g_spinAngle,0,1,0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	g_modelMatrix.rotate(90,0,1,0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawPropeller();
	

}

function drawPropeller()
{
	gl.drawArrays(gl.TRIANGLES, 0,18);
}

function drawBody()
{
	gl.drawArrays(gl.TRIANGLES, 18,36);
}

function drawBack()
{
	gl.drawArrays(gl.TRIANGLES, 54,12);
}

function drawBackProp()
{
	gl.drawArrays(gl.TRIANGLES, 66,36);
}

function drawLanding()
{
	gl.drawArrays(gl.TRIANGLES, 102, 36);
}

function drawFeetSupport()
{
	gl.drawArrays(gl.TRIANGLES, 138, 36);
}

var g_last = Date.now();

function animate() 
{
	var now = Date.now();
	var elapsed = now - g_last;
	g_mainRpm = main_speed.value;
	g_tailRpm = tail_speed.value;
	g_spinRpm = spin_speed.value;
	g_scale = zoom.value;

	g_last = now;
	g_mainAngle = g_mainAngle + (g_mainRpm * elapsed) / 1000;
	g_tailAngle = g_tailAngle + (g_tailRpm * elapsed) / 1000;
	g_spinAngle = g_spinAngle + (g_spinRpm * elapsed) / 1000; 
	g_viewAngle = g_viewAngle + 0.2;

	if(g_propAngle > 0 && g_propRate > 0){
		g_propRate = -1 * g_propRate;
	}
	if(g_propAngle < -90 && g_propRate < 0){
		g_propRate = -1 * g_propRate;
	}
	g_propAngle = g_propAngle + (g_propRate * elapsed)/1000;


}

function slowMain(){
	if (g_mainRpm == 0)
	{
		return;
	}
	g_mainRpm -= 10;
}

function speedMain(){
	g_mainRpm += 10;
}

function slowTail(){
	if (g_tailRpm == 0)
	{
		return;
	}
	g_tailRpm -= 5;
}

function speedTail(){
	g_tailRpm += 5;
}
//==================HTML Button Callbacks======================

function myKeyDown(kev) {
	switch(kev.code) {
		//------------------WASD navigation-----------------
		case "KeyA":
			g_horizontal-=0.05;
			break;
    	case "KeyD":  
			g_horizontal+=0.05;
			break;
		case "KeyS":  
			g_vertical-=0.05;
			break;
		case "KeyW":  
			g_vertical+=0.05;
			break;
		case "KeyE":  
			g_rotation-=5;
			break;
		case "KeyQ":  
			g_rotation+=5;
			break;
		case "KeyX":  
			g_pitch-=5;
			break;
		case "KeyZ":  
			g_pitch+=5;
			break;
		case "ArrowUp":		  
			g_scale-=0.1;
			break;
		case "ArrowDown":  
			g_scale+=0.1;
			break;	
	}
}

function myMouseDown(ev) {
	if(ev.clientY > 500){
		return
	}
	  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge

	  
	  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
							   (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
		var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
								 (g_canvas.height/2);
	//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
		
		g_isDrag = true;											// set our mouse-dragging flag
		g_xMclik = x;													// record where mouse-dragging began
		g_yMclik = y;
	};
	
	
	function myMouseMove(ev) {
	//==============================================================================
	// Called when user MOVES the mouse with a button already pressed down.
	// 									(Which button?   console.log('ev.button='+ev.button);    )
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
		if(g_isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'
	
		// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
		var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
	  
		// Convert to Canonical View Volume (CVV) coordinates too:
	  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
							   (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
		var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
								 (g_canvas.height/2);
	//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);
	
		// find how far we dragged the mouse:
		g_xMdragTot += (x - g_xMclik);					// Accumulate change-in-mouse-position,&
		g_yMdragTot += (y - g_yMclik);
	
		g_xMclik = x;													// Make next drag-measurement from here.
		g_yMclik = y;
	};
	
	function myMouseUp(ev) {
		if(ev.clientY > 500){
			g_isDrag = false;
			return
		}
	//==============================================================================
	// Called when user RELEASES mouse button pressed previously.
	// 									(Which button?   console.log('ev.button='+ev.button);    )
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
	
	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
		var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
	  
		// Convert to Canonical View Volume (CVV) coordinates too:
	  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
							   (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
		var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
								 (g_canvas.height/2);
		
		g_isDrag = false;											// CLEAR our mouse-dragging flag, and
		// accumulate any final bit of mouse-dragging we did:
		g_xMdragTot += (x - g_xMclik);
		g_yMdragTot += (y - g_yMclik);
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
