

var container, gui;
var scene, camera, renderer ;
var controls, projector;
var colors = [ 0xDF1F1F, 0xDFAF1F, 0x80DF1F, 0x1FDF50, 0x1FDFDF, 0x1F4FDF, 0x7F1FDF, 0xDF1FAF, 0xEFEFEF, 0x303030 ];
var gridSize = 20;
var cubeX = 30, cubeY=36, cubeZ = 80, fixY = 0;
var planeX = gridSize * cubeX, planeZ = gridSize * cubeZ, brushHideHeight = 4000;
var cubeGeometry;

var brush, allVoxels = [], topVoxels = [], lockedDestinations = [];
var coordinate0 , coordinate1, coordinateMinY, coordinateMaxY;
var paramX, paramY, paramZ,
paramX0, paramY0, paramZ0, paramX1, paramY1, paramZ1;

var isShiftDown = false, isControlDown = false, isAltDown = false;
var rayCaster, mouse3D, hoveredMesh = null, selectedMesh = null, destinationMesh = null;
var moveOpacity = 0.75, removeOpacity = 0.3; selectedOpacity = 0.5, moveSelectedOpacity = 0.3;

/** <---- @weet [2013-07-21 11:39] ---->
   
   Bus:
   ====
   1. 移动一定次数后会卡死，怀疑是内存泄漏或死循环

   
   Features:
   =========
   . Hover 方块时显示方块的信息(比如坐标...)
   . 允许自行在空白的平面上添加方块
   
 */

init();
render();

function init() {
  // Add container to `body`
  container = document.createElement( 'div' );
  document.body.appendChild( container );
  
  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera( 35, window.innerWidth/window.innerHeight, 1, 10000 );
  camera.position.set( planeX*0.5, (planeX+planeZ)*0.6, planeZ*0.3);
  camera.lookAt( scene.position ); // If not `controls` this is required!!!
  scene.add(camera);

  // Lights
  var light1 = new THREE.PointLight( 0xffffff, 1.0 );
  var light2 = new THREE.DirectionalLight( 0xffffff, 0.6 );
  var light3 = new THREE.DirectionalLight( 0xffffff, 0.2 );
  light1.position.set( planeX*1.1, (planeX+planeZ)/1.6, planeZ*1.3 );
  light2.position.set( -planeX*0.9, (planeX+planeZ)/1.6, -planeZ*0.8 );
  light3.position.set( 0, -planeZ, 0);

  scene.add(light1);
  scene.add(light2);
  scene.add(light3);
  
  // Renderer
  renderer = new THREE.WebGLRenderer( { precision: 'mediump',
                                        // alpha: true,
                                        antialias: true,
                                        // preserveDrawingBuffer: true
                                      } );
  // renderer = new THREE.CanvasRenderer( { antialias: true } );
  renderer.setSize( window.innerWidth, window.innerHeight );

  // Meshs
  initMeshs();
  initGUI();
  
  container.appendChild( renderer.domElement );
  
  // Controls
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  // Projector
  projector = new THREE.Projector();
  // Ray Caster
  rayCaster = new THREE.Raycaster( camera.position,
                                   new THREE.Vector3() );

  // listeners
  renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
  renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
  renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
  renderer.domElement.addEventListener( 'mousewheel', onDocumentMouseWheel, false );

  window.addEventListener( 'keydown', onDocumentKeyDown, false );
  window.addEventListener( 'keyup', onDocumentKeyUp, false );
  window.addEventListener( 'resize', onWindowResize, false );
}


function createVoxel( coordinate ) {
  var voxel = new THREE.Mesh( cubeGeometry,
                              new THREE.MeshPhongMaterial( { color: colors[ (coordinate.x+coordinate.y+coordinate.z+73)%7+1 ] } ) );
  voxel.coordinate = coordinate;
  var p = coordinateToPosition( voxel.coordinate );
  voxel.position.set( p.x, p.y, p.z );
  
  voxel.overdraw = true;
  
  voxel.isMoving = false;

  return voxel;
}

function initMeshs() {
  // Cubes
  cubeGeometry = new THREE.CubeGeometry( cubeX-0.6, cubeY-fixY, cubeZ-3 );
  
  brush = new THREE.Mesh( cubeGeometry,
                          new THREE.MeshPhongMaterial( { color: 0x000000,
                                                         wireframe: true,
                                                         opacity: 0.4 } ) );
  brush.coordinate = { x: 6, y: 1, z: 3 };
  var p = coordinateToPosition( brush.coordinate );
  brush.position.set( p.x, p.y, p.z );
  scene.add(brush);

  var sx = 2, sz = 2, sy = 6;
  for ( var i=-sx; i<=sx; i++) {
    for (var j=-sz; j<=sz; j++) {
      var MK = parseInt(Math.random() * sy / 2 + sy / 2);
      for ( var k=1; k<=MK; k++) {
        if ( i != 0 && j != 0 ) {
          var voxel = createVoxel( { x: i, y: k, z: j } );
          scene.add(voxel);
          
          allVoxels.push(voxel);
          if ( k == MK ) {
            topVoxels.push(voxel);
          }
        }
      }
    }
  }

  // Lines (Grid)
  var lineMaterial = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.1 } );
  var geometry1 = new THREE.Geometry();
  geometry1.vertices.push( new THREE.Vector3( 0, 0.1, -planeZ/2 ) );
  geometry1.vertices.push( new THREE.Vector3( 0, 0.1, planeZ/2 ) );
  var geometry2 = new THREE.Geometry();
  geometry2.vertices.push( new THREE.Vector3( 0, 0.1, -planeX/2 ) );
  geometry2.vertices.push( new THREE.Vector3( 0, 0.1, planeX/2 ) );


  // Coordinates ( Z: blue, X: red )
  var coordinateLineMaterialZ = new THREE.LineBasicMaterial( { color: 0x0000cc, opacity: 0.5 } );  
  var coordinateLineMaterialX = new THREE.LineBasicMaterial( { color: 0xcc0000, opacity: 0.5 } );  
  var line1 = new THREE.Line( geometry1, coordinateLineMaterialZ );  // Grow to +z
  var line2 = new THREE.Line( geometry2, coordinateLineMaterialX );  // Grow to +x
  
  line2.rotation.set( 0, Math.PI/2, 0 );
  
  line1.position.x = 0.1;
  line1.position.y = 0.1;
  line2.position.z = 0.1;
  line2.position.y = 0.1;
  
  scene.add(line1);
  scene.add(line2);

  // The gray lines
  for ( var i = -gridSize/2; i <= gridSize/2; i++) {
    var line1 = new THREE.Line( geometry1, lineMaterial );  // Grow to +z
    var line2 = new THREE.Line( geometry2, lineMaterial );  // Grow to +x
    line2.rotation.set( 0, Math.PI/2, 0 );
    
    line1.position.x = cubeX * i;
    // line1.position.y = cubeY * h;
    line2.position.z = cubeZ * i;
    // line2.position.y = cubeY * h;
    scene.add(line1);
    scene.add(line2);
  } 

  
  // Plane
  var planeGeometry = new THREE.PlaneGeometry( planeX, planeZ );
  var planeMaterial = new THREE.MeshLambertMaterial( { color: 0x000000, opacity: 0.0 });
  plane = new THREE.Mesh( planeGeometry, planeMaterial );
  plane.rotation.set( -Math.PI/2, 0, 0 );
  plane.receiveShadow = true;
  scene.add(plane);

  console.log('initMeshs DONE!');
}



/* Dependencies:
   =============
   1. lockedDestinations
 */
function lockDestination( coordinate ) {
  lockedDestinations.push ( coordinate );
}


/* Dependencies:
   =============
   1. lockedDestinations
 */
function unlockDestination( coordinate ) {
  var i = findLockedDestination( coordinate );
  if ( i != null ) {
    
    lockedDestinations.splice( i, 1 );
    
  } else {
    console.warn( 'Unlock destination ERROR: coordinate not in the list!',
                 coordinate, lockedDestinations);
  }
}


/* Dependencies:
   =============
   1. lockedDestinations
 */
function findLockedDestination( coordinate ) {
  var c;
  for ( var i = 0; i < lockedDestinations.length; i++ ) {
    c = lockedDestinations[ i ];
    if ( c.x == coordinate.x
         && c.y == coordinate.y
         && c.z == coordinate.z ) {
      return i;
    }
  }
  return null;
}


function getVoxelIndexByCoordinate(  meshs, coordinate ) {
  var mesh;
  for ( var i = 0; i < meshs.length; i++ ) {
    mesh = meshs[i];
    if ( mesh.coordinate.x == coordinate.x &&
         mesh.coordinate.y == coordinate.y &&
         mesh.coordinate.z == coordinate.z &&
         mesh.isMoving == false) {
      return i;
    }
  }
  return null;
}


function addVoxel( coordinate ) {
  var coordinateBelow =  { x: coordinate.x, y: coordinate.y-1, z: coordinate.z }
  var idxBelow = getVoxelIndexByCoordinate( topVoxels, coordinateBelow );

  // Error handlers
  if ( idxBelow == null && coordinate.y != 1 ) {
    console.warn( 'Add mesh ERROR: Mesh can only be added above a top mesh or plane!' );
    return false;
  }
  
  var idxLocked = findLockedDestination( coordinateBelow );
  if ( idxLocked != null ) {
    console.warn( 'Add mesh ERROR: Mesh below locked as destination!' );
    return false;
  }


  // Adding...
  if ( coordinate.y != 1 ) {
    topVoxels.splice( idxBelow, 1 );
  }

  var voxel = createVoxel( coordinate );
  scene.add( voxel );
  topVoxels.push( voxel );
  allVoxels.push( voxel );

  console.log( 'Mesh added:', voxel.coordinate);
  return true;
}


/* Dependencies:
   =============
   1. topVoxels
   2. lockedDestinations
 */
function removeVoxel( coordinate ) {
  var idxTop = getVoxelIndexByCoordinate( topVoxels, coordinate );
  if ( idxTop == null ) {
    console.warn( 'Remove ERROR: Can not remove mesh not on the top!', coordinate );
    return false;
  }
  
  var idxLocked = findLockedDestination( coordinate );
  if ( idxLocked != null ) {
    console.warn( 'Remove ERROR: Mesh locked as destination!' );
    return false;
  }
  
  var coordinateBelow =  { x: coordinate.x, y: coordinate.y-1, z: coordinate.z }
  var idxBelow = getVoxelIndexByCoordinate( allVoxels, coordinateBelow );
  if ( idxBelow == null && coordinate.y != 1 ) {
    console.warn( 'Remove ERROR: The mesh below is incorrect, something must be wrong!' );
    return false;
  }

  var idxAll = getVoxelIndexByCoordinate( allVoxels, coordinate );
  var voxel = topVoxels[ idxTop ];
  allVoxels.splice( idxAll, 1 );
  topVoxels.splice( idxTop, 1 );
  scene.remove( voxel );

  if ( coordinate.y != 1 ) {
    topVoxels.push( allVoxels[ idxBelow ] );
  }

  console.log( 'Mesh removed:', voxel.coordinate);
  return true;
}



/* Dependencies:
   =============
   1. topVoxels
   2. lockedDestinations
 */
function moveVoxelByCoordinates( original, destination, callback ) {  // By coordinates
  console.log( 'To be move: ', original, destination );

  if ( original.x == destination.x && original.z == destination.z ) {
    console.warn( 'Move ERROR: Can not move vertical!' );
    return false;
  }
  
  if ( findLockedDestination( destination ) != null ) {
    console.warn( 'Move ERROR: Destination locked', destination, lockedDestinations );
    return false;
  }
  
  var meshIdx0 = getVoxelIndexByCoordinate( topVoxels, original );
  var meshIdx1 = getVoxelIndexByCoordinate( topVoxels, { x: destination.x,
                                                       y: destination.y-1,
                                                       z: destination.z } );
  // Error handlers
  if ( meshIdx0 == null ) {
    console.warn( 'Move ERROR: Original not on the top!', original);
    topVoxels.forEach( function(mesh) {
      var c = mesh.coordinate;
      console.log(c.x, c.y, c.z)
    });
    return false;
  }

  if ( meshIdx1 == null && destination.y != 1 ) {
    console.warn( 'Move ERROR: Destination not above a top mesh or plane!' );
    return false;
  }
  
  if ( getVoxelIndexByCoordinate( allVoxels, destination ) != null ) {
    console.warn( 'Move ERROR: Destination has a mesh!' );
    return false;
  }

  
  // >>>  Well done! Let's start moving!!! <<<

  lockDestination( destination );
  var mesh0 = topVoxels[ meshIdx0 ];
  
  // Add mesh under original position(not the <plane>) to `topVoxels`
  if ( original.y != 1 ) {
    var coordinateUnderOriginal = { x: original.x , y: original.y-1 , z: original.z }
    var meshIdxUnderOriginal = getVoxelIndexByCoordinate( allVoxels, coordinateUnderOriginal );
    topVoxels.push( allVoxels[ meshIdxUnderOriginal ] );
  }
  
  if ( destination.y != 1 ) { // If move to the place above other mesh.
    // Remove mesh under destination position from `topVoxels`
    topVoxels.splice( meshIdx1, 1 );
  }

  var maxY = getMaxYOnRoad( original, destination ), extHeight = 0.3;
  
  moveVoxelToCoordinate( mesh0, destination, (maxY + extHeight), function() {
    unlockDestination( destination );
    if ( callback ) {
      callback();
    }
  } );
  
  return true;
}

function moveVoxelToCoordinate( target, destination, top, callback) {
  var original = positionToCoordinate(target.position);
  var coordA1 = { x: original.x, y: top, z: original.z };
  var coordB1 = { x: destination.x, y: top, z: destination.z };
  
  var coords = [ original, coordA1, coordB1, destination ];
  // console.log('coords:', coords);
  var positions = [];
  for ( var i = 0; i < coords.length; i++) {
    positions.push( coordinateToPosition(coords[i]) );
  }
  
  // console.log('positions', positions);
  moveVoxel( target, positions, 1, true, callback);
}

function getMaxYOnRoad( original, destination ) {
  var coordinate;
  var maxY = 0;
  for ( var i = 0; i < topVoxels.length; i++ ) {
    coordinate = topVoxels[ i ].coordinate;
    if ( (destination.x - coordinate.x) * (coordinate.x - original.x) >= 0 &&
         (destination.z - coordinate.z) * (coordinate.z - original.z) >= 0 &&
         coordinate.y > maxY ) {
      maxY = coordinate.y;
    }
  }
  return maxY;
}

function moveVoxel( target, positions, i, isForward, callback) {
  var counter = 0, steps, spend;
  var toPos = positions[i], curPos = target.position;
  var frmPos = curPos.clone();
  var x0 = curPos.x, y0 = curPos.y, z0 = curPos.z;
  var DX = frmPos.x - toPos.x, DY = frmPos.y - toPos.y, DZ = frmPos.z - toPos.z;
  spend = Math.sqrt(DX*DX + DY*DY+ DZ*DZ) * 10; // 移动一次花费的时间 (单位: 毫秒)
  steps = spend / 12;
  var dx = DX/steps, dy = DY/steps, dz = DZ/steps;

  target.isMoving = true;
  
  var myInterval = setInterval(function() {
    counter += 1;
    curPos.x = x0 - dx*counter;
    curPos.y = y0 - dy*counter;
    curPos.z = z0 - dz*counter;
    render();

    // Stop or trun around
    if (counter >= steps) {
      clearInterval(myInterval);
      if ( i == positions.length-1 ) {
        isForward = false;
      } else if ( i == 0 ) {
        isForward = true;
      }
      i += ( isForward ? 1 : -1 );
      
      target.coordinate = positionToCoordinate(target.position);
      
      if ( isForward ) {
        moveVoxel(target, positions, i, isForward, callback);
      } else {
        target.isMoving = false;
        var p = coordinateToPosition(target.coordinate);
        target.position.set( p.x, p.y, p.z ); // 弥补计算误差
        target.material.opacity = 1;
        callback();
        render();
        return;
      }
    }
  }, 12);
}

function render() {
  controls.update();
  if ( hoveredMesh != null ){
    
    if ( isShiftDown ) {
      hoveredMesh.material.opacity = moveOpacity;
    } else if ( isAltDown ) {
      hoveredMesh.material.opacity = removeOpacity;
    }
    
  }
  
  if ( selectedMesh != null ) {
    if ( selectedMesh == hoveredMesh ) {
      selectedMesh.material.opacity = moveSelectedOpacity;
    } else {
      selectedMesh.material.opacity = selectedOpacity;
    }
  }
  renderer.render(scene, camera);
}


function interact() {

  if ( hoveredMesh != null ) { // Leave the hovered mesh
    hoveredMesh.material.opacity = 1;
    hoveredMesh = null;
  }
  
  // Intersect meshs
  var intersects = rayCaster.intersectObjects( allVoxels );
  if ( intersects.length == 0 ) {
    intersects = rayCaster.intersectObject( plane );
  }
  if ( intersects.length > 0 ) {
    var intersect = intersects[ 0 ];

    if ( isShiftDown || isAltDown ) {

      if ( intersect.object != plane ) {
        hoveredMesh = intersect.object;
        hoveredMesh.material.opacity = 0.5;
      }
      
    } else {
      var point = intersect.point;
      point.y += fixY/2 + 0.2;  // Force fix y point
      
      brush.position.x = Math.floor( point.x / cubeX ) * cubeX + cubeX/2;
      brush.position.y = Math.floor( point.y / cubeY ) * cubeY + cubeY/2; 
      brush.position.z = Math.floor( point.z / cubeZ ) * cubeZ + cubeZ/2;
      brush.coordinate = positionToCoordinate( brush.position );
      updateTouchedCoordinateGUI ( brush.coordinate );
      return;
    }
  }
  brush.position.y = brushHideHeight; // Hide brush
}



////////////////////////////////////////////////////////////////////////////////
//////////////////// Event handlers ////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function onDocumentKeyDown( event ) {
  console.log( event.keyCode );
  
  switch ( event.keyCode ) {
    
  case 16:  // Shift
    isShiftDown = true;
    brush.material.color.setHex( 0x0000cc );
    interact();
    render();
    break;

  case 17: // Control
    isControlDown = true;
    brush.material.color.setHex( 0x00cc00 );
    interact();
    break;
    
  case 18: // Alt
    isAltDown = true;
    brush.material.color.setHex( 0xcc0000 );
    interact();
    break;
  }
}

function onDocumentKeyUp( event ) {

  switch ( event.keyCode ) {

  case 16:
    isShiftDown = false;
    brush.material.color.setHex( 0x000000 );
    interact();
    render();
    break;
    
  case 17: // Control
    isControlDown = false;
    brush.material.color.setHex( 0x000000 );
    interact();
    break;
    
  case 18: // Alt
    isAltDown = false;
    brush.material.color.setHex( 0x000000 );
    interact();
    break;
    
  }
}

function onDocumentMouseDown( event ) {
  if ( isControlDown ) {
    addVoxel( brush.coordinate );
    render();
    return;
  }

  if ( isAltDown ) {
    removeVoxel( hoveredMesh.coordinate );
    render();
    return;
  }
  
  //console.log('down');
  if ( selectedMesh != null ) {
    
    if ( selectedMesh == hoveredMesh ) {
      
      selectedMesh = null;
      
    } else if ( brush.position.y < brushHideHeight ) { // Beacuse brush is the destination
      
      var successed = moveVoxelByCoordinates( selectedMesh.coordinate,
                                             brush.coordinate);
      if ( successed ) {
        selectedMesh = null; // Unset original mesh.
      }
    }
  } else if ( hoveredMesh != null) { // Set original mesh
    
    selectedMesh = hoveredMesh;
  }

  render();
}


function onDocumentMouseUp( event ) {
  //console.log('up');
  render();
}

function onDocumentMouseMove( event ) {
  //console.log('move');
  mouse3D = projector.unprojectVector( new THREE.Vector3(  event.clientX / renderer.domElement.width * 2 - 1,
                                                           - event.clientY / renderer.domElement.height * 2 + 1,
                                                           0.5),
                                       camera);
  rayCaster.ray.direction = mouse3D.sub( camera.position ).normalize();
  
  interact();
  render();
}

function onDocumentMouseWheel( event ) {
  //console.log('wheel');
  render();
}

function onWindowResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////// GUI Stuffs //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function selectTestCoordinates( meshs ) {
  var i0 = parseInt(Math.random()*100) % meshs.length, i1 = parseInt(Math.random()*100) % meshs.length;
  var mesh0 = meshs[ i0 ], mesh1 = meshs[ i1 ];
  
  for ( var i = 0; i < 128; i++ ) {
    if ( mesh0.isMoving || mesh1.isMoving
         || findLockedDestination( mesh0.coordinate ) != null
         || findLockedDestination( mesh1.coordinate ) != null) {
      i0 = parseInt(Math.random()*100) % meshs.length;
      i1 = parseInt(Math.random()*100) % meshs.length;
      
      mesh0 = meshs[ i0 ];
      mesh1 = meshs[ i1 ];
      
    } else {
      break;
    }
  }

  
  if ( mesh0.isMoving || mesh1.isMoving
       || findLockedDestination( mesh0.coordinate ) != null
       || findLockedDestination( mesh1.coordinate ) != null ) {
    alert("Select failed, Please retry!");
    return;
  }
  
  var p0 = mesh0.position;
  var p1 = mesh1.position;
  coordinate0 = positionToCoordinate( p0 );
  coordinate1 = positionToCoordinate( p1 );
  coordinate1.y += 1; // Destination is the voxel above an exists top voxel.
}


function exchangeCoordinate() {
  var _x = coordinate0.x;
  coordinate0.x = coordinate1.x;
  coordinate1.x = _x;

  var _y = coordinate0.y;
  coordinate0.y = coordinate1.y;
  coordinate1.y = _y;
  
  var _z = coordinate0.z;
  coordinate0.z = coordinate1.z;
  coordinate1.z = _z;

  updateTestCoordinatesGUI();
  console.log('exchanged');
}

// Dependent by `moveVoxelByCoordinates`
function updateTouchedCoordinateGUI( touchedCoordinate ) {
  paramX.setValue( touchedCoordinate.x );
  paramY.setValue( touchedCoordinate.y );
  paramZ.setValue( touchedCoordinate.z );
}


function updateTestCoordinatesGUI() {
  paramX0.setValue( coordinate0.x );
  paramX1.setValue( coordinate1.x );
  
  paramY0.setValue( coordinate0.y );
  paramY1.setValue( coordinate1.y );
  
  paramZ0.setValue( coordinate0.z );
  paramZ1.setValue( coordinate1.z );
}


function initGUI() {
  gui = new dat.GUI();
  
  selectTestCoordinates( topVoxels );
  var parameters = 
    {
      x: 0, y: 0, z: 0,
      x0: coordinate0.x, y0: coordinate0.y, z0: coordinate0.z,
      x1: coordinate1.x, y1: coordinate1.y, z1: coordinate1.z,
      move: function() {
        moveVoxelByCoordinates( coordinate0,
                               { x: coordinate1.x,
                                 y: coordinate1.y,
                                 z: coordinate1.z } );
      },
      exchange: exchangeCoordinate,
      _selectTestCoordinates: function() {
        // Callback 里的for循环如果写成 `for ( i = 0; i < 64; i++ )`
        // 会出诡异的毛病
        for ( var i = 0; i < 64; i++ ) {
          selectTestCoordinates( topVoxels );
          var dy = coordinate1.y - coordinate0.y;
          if ( Math.abs( dy ) >= 2 ) {
            if ( dy > 0 ) {
              exchangeCoordinate();
            }
            break;
          }
        }
        updateTestCoordinatesGUI();
      },
    };
  
  var folder = gui.addFolder('Touched coordinate:');
  paramX = folder.add( parameters, 'x' );
  paramY = folder.add( parameters, 'y' );
  paramZ = folder.add( parameters, 'z' );
  folder.open();
  
  var folder0 = gui.addFolder('Original coordinate:');
  paramX0 = folder0.add( parameters, 'x0' );
  paramY0 = folder0.add( parameters, 'y0' );
  paramZ0 = folder0.add( parameters, 'z0' );
  folder0.open();
  
  paramX0.onFinishChange( function (value) {
    coordinate0.x = value;
  });
  paramY0.onFinishChange( function (value) {
    coordinate0.y = value;
  });
  paramZ0.onFinishChange( function (value) {
    coordinate0.z = value;
  });

  var folder1 = gui.addFolder('Destination coordinate:');
  paramX1 = folder1.add( parameters, 'x1' );
  paramY1 = folder1.add( parameters, 'y1' );
  paramZ1 = folder1.add( parameters, 'z1' );
  folder1.open();

  paramX1.onFinishChange( function (value) {
    coordinate1.x = value;
  });
  paramY1.onFinishChange( function (value) {
    coordinate1.y = value;
  });
  paramZ1.onFinishChange( function (value) {
    coordinate1.z = value;
  });

  gui.add( parameters, 'exchange').name("Exchange");
  gui.add( parameters, '_selectTestCoordinates').name("Select top2");
  gui.add( parameters, 'move').name("Move!");
  
  gui.open();
  // gui.close();
}
