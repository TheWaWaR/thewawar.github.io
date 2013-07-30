

var container;                // 画布容器 (一个容纳 <canvas> 的 <div>)
var gui;                      // 右侧的参数配置栏
var scene, camera, renderer;  // 必要的 WebGL 对象
var controls;                 // 用来自动处理旋转和缩放
var projector, rayCaster, mouse3D; // 用来计算鼠标下物体的坐标
var brush;                         // 虚拟的方块
var allVoxels = [], topVoxels = [], lockedDestinations = [];

var modeDict = {                // 用来记录当前的操作模式
  move: false,
  add: false,
  remove: false
};

var paramX, paramY, paramZ, paramX0, paramY0, paramZ0, paramX1, paramY1, paramZ1; // 一堆用来控制右侧参数栏坐标的变量
var coordinate0 , coordinate1; // 对应右侧参数栏的起点坐标和目的地坐标
var hoveredVoxel = null;       // 当前被触碰的方块对象
var selectedVoxel = null;      // 被选中的方块对象 (在移动方块时选择)

// Constants
var colors = [ 0xDF1F1F, 0xDFAF1F, 0x80DF1F, 0x1FDF50, 0x1FDFDF, 0x1F4FDF, 0x7F1FDF, 0xDF1FAF, 0xEFEFEF, 0x303030 ];
var gridSize = 40;
var cubeX = 30, cubeY=36, cubeZ = 40, fixY = 0;
var planeX = gridSize * cubeX, planeZ = gridSize * cubeZ, brushHideHeight = 4000;
var moveOpacity = 0.75, removeOpacity = 0.3, selectedOpacity = 0.5, moveSelectedOpacity = 0.3, topOpacity = 0.82;
var cubeGeometry, lineMaterial, coordinateLineMaterialZ, coordinateLineMaterialX;

/** <---- @weet [2013-07-21 11:39] ---->
   
   Features:
   =========
   . Hover 方块时显示方块的信息(比如坐标...)
   . 允许自行在空白的平面上添加方块


   Tasks:
   ======
   1. 路径搜索算法，考虑方块的势能，以及翻箱次数
   2. 解决无法在侧面添加方块的问题
   
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

function getColor( coordinate ) {
  return colors[ ( coordinate.x + coordinate.y + coordinate.z + 73 )%7+1 ];
}

function createVoxel( coordinate, colorIdx ) {
  var color = colorIdx ? colors[ colorIdx ] : getColor( coordinate );
  var voxel = new THREE.Mesh( cubeGeometry,
                              new THREE.MeshPhongMaterial( { color: color } ) );
  voxel.coordinate = coordinate;
  var p = coordinateToPosition( voxel.coordinate );
  voxel.position.set( p.x, p.y, p.z );
  
  voxel.overdraw = true;
  
  voxel.isMoving = false;

  return voxel;
}

function initMeshs() {
  // Cubes
  cubeGeometry = new THREE.CubeGeometry( cubeX-0.6, cubeY-fixY, cubeZ-1.2 );
  
  brush = new THREE.Mesh( new THREE.CubeGeometry( cubeX-0.4, cubeY, cubeZ-0.8 ),
                          new THREE.MeshPhongMaterial( { color: 0x000000,
                                                         wireframe: true,
                                                         opacity: 0.4 } ) );
  brush.coordinate = { x: 6, y: 1, z: 3 };
  var p = coordinateToPosition( brush.coordinate );
  brush.position.set( p.x, p.y, p.z );
  scene.add(brush);

  /*
  var sx = 2, sz = 2, sy = 4;
  for ( var i=-sx; i<sx; i++) {
    for (var j=-sz; j<sz; j++) {

      var MK = sy+i;
      for ( var k=0; k<MK; k++) {
        
        var voxel = createVoxel( { x: i, y: k, z: j } );
        scene.add(voxel);
        allVoxels.push(voxel);

        if ( k == MK-1 ) {
          voxel.material.color.setHex( colors[ 9 ] );
          topVoxels.push(voxel);
        }
      }
    }
  }
  */
  if ( window.location.hash ) {
    buildFromHash();
  }

  // Lines (Grid)
  lineMaterial = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.1 } );
  var geometry1 = new THREE.Geometry();
  geometry1.vertices.push( new THREE.Vector3( 0, 0.1, -planeZ/2 ) );
  geometry1.vertices.push( new THREE.Vector3( 0, 0.1, planeZ/2 ) );
  var geometry2 = new THREE.Geometry();
  geometry2.vertices.push( new THREE.Vector3( 0, 0.1, -planeX/2 ) );
  geometry2.vertices.push( new THREE.Vector3( 0, 0.1, planeX/2 ) );


  // Coordinates ( Z: blue, X: red )
  coordinateLineMaterialZ = new THREE.LineBasicMaterial( { color: 0x0000cc, opacity: 0.5 } );  
  coordinateLineMaterialX = new THREE.LineBasicMaterial( { color: 0xcc0000, opacity: 0.5 } );  
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


function getVoxelIndexByCoordinate(  voxels, coordinate ) {
  var voxel;
  for ( var i = 0; i < voxels.length; i++ ) {
    voxel = voxels[i];
    if ( voxel.coordinate.x == coordinate.x &&
         voxel.coordinate.y == coordinate.y &&
         voxel.coordinate.z == coordinate.z &&
         voxel.isMoving == false) {
      return i;
    }
  }
  return null;
}


function findTopCoordinateByX( x ) {
  var results = [];
  
  topVoxels.forEach( function( voxel ) {
    if ( voxel.coordinate.x == x ) {
      results.push( voxel.coordinate );
    }
  });
  
  return results;
}

function findTopCoordinateByXZ( x, z ) {
  var results = [];
  var tmpResults = findTopCoordinateByX( x );

  tmpResults.forEach( function( coordinate ) {
    if ( coordinate.z == z ) {
      results.push( coordinate );
    }
  });

  return results;
}

function printTopCoordinates() {
  topVoxels.forEach(function(voxel) {
    console.log(voxel.coordinate);
  });
}

function printAllCoordinates() {
  allVoxels.forEach(function(voxel) {
    console.log(voxel.coordinate);
  });
}

function sortAllVoxels() {
  allVoxels.sort( function( va, vb ) {
    var ca = va.coordinate, cb = vb.coordinate;
    return ( ca.x - cb.x ) * 320 + ( ca.z - cb.z ) * 32 + ( ca.y - cb.y );
  });
}


function addVoxel( coordinate ) {
  console.log('To be added:', coordinate);

  
  // >>> Error handlers: Check if can be added.
  var allIdx = getVoxelIndexByCoordinate( allVoxels, coordinate );
  if ( allIdx != null ) {
    console.warn( 'Add ERROR: Target position already have a voxel!' );
    return false;
  }
  
  var coordinateBelow =  { x: coordinate.x, y: coordinate.y-1, z: coordinate.z }
  var topIdxBelow = getVoxelIndexByCoordinate( topVoxels, coordinateBelow );

  /* Looks like not necessary... 
  if ( topIdxBelow == null && coordinate.y != 0 ) {
    console.warn( 'Add ERROR: Voxel can only be added above a top voxel or plane!', coordinate );
    return false;
  }
  */
  
  var idxLocked = findLockedDestination( coordinateBelow );
  if ( idxLocked != null ) {
    console.warn( 'Add ERROR: Voxel below locked as destination!', coordinate );
    return false;
  }


  // >>> Adding... <<<
  if ( coordinate.y != 0 ) {
    var voxelBelow = topVoxels[ topIdxBelow ];
    console.log( 'Remove from TOP:', voxelBelow.coordinate);
    voxelBelow.material.color.setHex( getColor( voxelBelow.coordinate ) );
    topVoxels.splice( topIdxBelow, 1 );
  }

  var voxel = createVoxel( coordinate );
  scene.add( voxel );
  voxel.material.color.setHex( colors[ 9 ] );
  topVoxels.push( voxel );
  allVoxels.push( voxel );

  console.log( 'Add to TOP:', voxel.coordinate);
  console.log( 'Voxel added(to: [SCENE, TOP, ALL]):', voxel.coordinate);
  
  updateHash();
  return true;
}


/* Dependencies:
   =============
   1. topVoxels
   2. lockedDestinations
 */
function removeVoxel( coordinate ) {
  console.log('To be removed:', coordinate);
  
  // >>> Error handlers: Check if can be removed.
  var topIdx = getVoxelIndexByCoordinate( topVoxels, coordinate );
  if ( topIdx == null ) {
    console.warn( 'Remove ERROR: Can not remove voxel not on the top!', coordinate );
    return false;
  }
  
  var idxLocked = findLockedDestination( coordinate );
  if ( idxLocked != null ) {
    console.warn( 'Remove ERROR: Voxel locked as destination!', coordinate );
    return false;
  }
  
  var coordinateBelow =  { x: coordinate.x, y: coordinate.y-1, z: coordinate.z }
  var allIdxBelow = getVoxelIndexByCoordinate( allVoxels, coordinateBelow );
  if ( allIdxBelow == null && coordinate.y != 0 ) {
    console.error( 'Remove ERROR: The voxel below is incorrect, something must be wrong!', coordinate );
    return false;
  }

  
  //  >>> Removing... <<<
  
  // This step's order is very important, 因为当前得到索引会因数组的变动而失效。
  var voxelBelow;
  if ( coordinate.y != 0 ) { 
    voxelBelow = allVoxels[ allIdxBelow ];
  }
  
  var allIdx = getVoxelIndexByCoordinate( allVoxels, coordinate );
  var voxel = topVoxels[ topIdx ];
  allVoxels.splice( allIdx, 1 );
  topVoxels.splice( topIdx, 1 );
  scene.remove( voxel );

  if ( coordinate.y != 0 ) { // If target voxel not on the plane.
    console.log( 'Add to TOP:', voxelBelow.coordinate );
    voxelBelow.material.color.setHex( colors[ 9 ] );
    topVoxels.push( voxelBelow );
  }

  console.log( 'Voxel removed:', voxel.coordinate);

  updateHash();
  return true;
}



/* Dependencies:
   =============
   1. topVoxels
   2. lockedDestinations
 */
function moveVoxelByCoordinates( origin, destination, callback ) {  // By coordinates
  console.log( 'To be move: ', origin, destination );

  // >>> Error handlers: Check if origin can move and the destination is valid.
  if ( origin.x == destination.x && origin.z == destination.z ) {
    console.warn( 'Move ERROR: Can not move vertical!', origin, destination );
    return false;
  }
  
  if ( findLockedDestination( destination ) != null ) {
    console.warn( 'Move ERROR: Destination locked', origin, destination, lockedDestinations );
    return false;
  }

  var topIdxOrigin = getVoxelIndexByCoordinate( topVoxels, origin ); 
  var topIdxUnderDest = getVoxelIndexByCoordinate( topVoxels, { x: destination.x,
                                                       y: destination.y-1,
                                                       z: destination.z } );
  if ( topIdxOrigin == null ) {
    console.warn( 'Move ERROR: Origin not on the top!', origin, destination );
    topVoxels.forEach( function(voxel) {
      console.log( voxel.coordinate );
    });
    return false;
  }

  if ( topIdxUnderDest == null && destination.y != 0 ) {
    console.warn( 'Move ERROR: Destination not above a top voxel or plane!', origin, destination );
    return false;
  }
  
  if ( getVoxelIndexByCoordinate( allVoxels, destination ) != null ) {
    console.warn( 'Move ERROR: Destination has a voxel!', origin, destination );
    return false;
  }


  /* Status control:
     ===============
     1. Add voxel which under orign to `topVoxels` if it's not `plane`
     2. Remove voxel which under destination from `topVoxels` if it's not `plane`
   */
  
  // >>>  Well done! Let's start moving process!!! <<<

  lockDestination( destination );
  var voxelOrigin = topVoxels[ topIdxOrigin ];

  // 1. Add voxel which under orign to `topVoxels` if it's not `plane`
  if ( origin.y != 0 ) {
    var coordinateUnderOrigin = { x: origin.x , y: origin.y-1 , z: origin.z }
    var allIdxUnderOrigin = getVoxelIndexByCoordinate( allVoxels, coordinateUnderOrigin );
    
    console.log( 'Add to TOP:', allVoxels[ allIdxUnderOrigin ].coordinate );    
    allVoxels[ allIdxUnderOrigin ].material.color.setHex( colors[ 9 ] );
    topVoxels.push( allVoxels[ allIdxUnderOrigin ] );
  }
  
  // 2. Remove voxel which under destination from `topVoxels` if it's not `plane`
  if ( destination.y != 0 ) {
    var voxelUnderDest = topVoxels[ topIdxUnderDest ];
    console.log( 'Remove from TOP:', voxelUnderDest.coordinate);
    voxelUnderDest.material.color.setHex( getColor( voxelUnderDest.coordinate ) );
    topVoxels.splice( topIdxUnderDest, 1 );
  }

  var maxY = getMaxYOnRoad( origin, destination ), extHeight = 0.3;
  
  moveVoxelToCoordinate( voxelOrigin, destination, (maxY + extHeight), function() {
    
    if ( callback ) {
      callback();
    }
    
    unlockDestination( destination );
    updateHash();
    
  } );
  
  return true;
}

function moveVoxelToCoordinate( target, destination, top, callback) {
  var origin = positionToCoordinate(target.position);
  var coordA1 = { x: origin.x, y: top, z: origin.z };
  var coordB1 = { x: destination.x, y: top, z: destination.z };
  
  var coords = [ origin, coordA1, coordB1, destination ];
  var positions = [];
  for ( var i = 0; i < coords.length; i++) {
    positions.push( coordinateToPosition(coords[i]) );
  }
  
  moveVoxel( target, positions, 1, callback);
}

function getMaxYOnRoad( origin, destination ) {
  var coordinate;
  var maxY = 0;
  for ( var i = 0; i < topVoxels.length; i++ ) {
    coordinate = topVoxels[ i ].coordinate;
    if ( (destination.x - coordinate.x) * (coordinate.x - origin.x) >= 0 &&
         (destination.z - coordinate.z) * (coordinate.z - origin.z) >= 0 &&
         coordinate.y > maxY ) {
      maxY = coordinate.y;
    }
  }
  return maxY;
}

function moveVoxel( target, positions, i, callback) {
  
  var counter = 0, steps, spend;
  var toPos = positions[i], curPos = target.position;
  var frmPos = curPos.clone();
  var x0 = curPos.x, y0 = curPos.y, z0 = curPos.z;
  var DX = frmPos.x - toPos.x, DY = frmPos.y - toPos.y, DZ = frmPos.z - toPos.z;
  
  spend = Math.sqrt(DX*DX + DY*DY+ DZ*DZ) * 10; // 移动一次花费的时间 (单位: 毫秒)
  steps = spend / 12;
  var dx = DX/steps, dy = DY/steps, dz = DZ/steps;
  
  console.log( new Date(), counter );
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
      i += 1;
      target.coordinate = positionToCoordinate(target.position);
      
      if ( i < positions.length ) {
        
        moveVoxel(target, positions, i, callback);
        
      } else {
        
        target.isMoving = false;
        var p = coordinateToPosition(target.coordinate);
        target.position.set( p.x, p.y, p.z ); // 弥补计算误差
        target.material.opacity = 1;
        
        callback();
        console.log( new Date(), counter );
        render();
        return;
        
      }
    }
  }, 12);
}

function render() {
  controls.update();

  // Just set opacity
  if ( hoveredVoxel != null ){
    
    if ( modeDict.move ) {
      hoveredVoxel.material.opacity = moveOpacity;
    } else if ( modeDict.remove ) {
      hoveredVoxel.material.opacity = removeOpacity;
    }
    
  }
  
  if ( selectedVoxel != null ) {
    if ( selectedVoxel == hoveredVoxel ) {
      selectedVoxel.material.opacity = moveSelectedOpacity;
    } else {
      selectedVoxel.material.opacity = selectedOpacity;
    }
  }

  renderer.render(scene, camera);
}


function interact() {

  if ( hoveredVoxel != null ) { // Leave the hovered voxel
    hoveredVoxel.material.opacity = 1;
    hoveredVoxel = null;
  }
  
  // Intersect meshs (include voxels and plane).
  var intersects = rayCaster.intersectObjects( allVoxels );
  if ( intersects.length == 0 ) {
    intersects = rayCaster.intersectObject( plane );
  }
  if ( intersects.length > 0 ) {
    var intersect = intersects[ 0 ];

    if ( modeDict.move || modeDict.remove ) {
      if ( intersect.object != plane ) {
        hoveredVoxel = intersect.object;
        hoveredVoxel.material.opacity = 0.5;
      }
      
    } else {
      var point = intersect.point;
      point.y += fixY/2 + 0.2;  // Force fix y point
      
      brush.position.x = Math.floor( point.x / cubeX ) * cubeX + cubeX/2;
      brush.position.y = Math.floor( point.y / cubeY ) * cubeY + cubeY/2; 
      brush.position.z = Math.floor( point.z / cubeZ ) * cubeZ + cubeZ/2;
      brush.coordinate = positionToCoordinate( brush.position );
      updateHoveredCoordinateGUI ( brush.coordinate );
      return;
    }
  }
  brush.position.y = brushHideHeight; // Hide brush
}



////////////////////////////////////////////////////////////////////////////////
//////////////////// Event handlers ////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
function setMode( mode ) {
  // Error handler
  var validModes = ['move', 'add', 'remove', 'none'];
  if ( validModes.indexOf( mode ) == -1 ) {
    console.error( 'Invalid mode name:', mode );
    return false;
  }
  
  for ( var k in modeDict ) {
    if ( k == mode ) {
      modeDict[ k ] = true;
    } else {
      modeDict[ k ] = false;
    }
  }
  if ( mode != 'move' && mode != 'none' ) {
    selectedVoxel = null;
    render();
  }
}


function onDocumentKeyDown( event ) {
  
  switch ( event.keyCode ) {
    
  case 16:  // Shift
    setMode( 'move' );
    brush.material.color.setHex( 0x0000cc );
    interact();
    render();
    break;

  case 17: // Control
    setMode( 'add' );
    brush.material.color.setHex( 0x00cc00 );
    interact();
    render();
    break;
    
  case 18: // Alt
    setMode( 'remove' ); 
    brush.material.color.setHex( 0xcc0000 );
    interact();
    render();
    break;
    
  default:
    setMode ( 'none' );
  }
}

function onDocumentKeyUp( event ) {

  switch ( event.keyCode ) {

  case 16:
    setMode( 'none' );
    brush.material.color.setHex( 0x000000 );
    interact();
    render();
    break;
    
  case 17: // Control
    setMode( 'none' );
    brush.material.color.setHex( 0x000000 );
    interact();
    render();
    break;
    
  case 18: // Alt
    setMode( 'none' );
    brush.material.color.setHex( 0x000000 );
    interact();
    render();
    break;
    
  }
}

function onDocumentMouseDown( event ) {
  
  if ( modeDict.add ) {
    addVoxel( brush.coordinate );
    render();
    return;
  }

  if ( modeDict.remove && hoveredVoxel != null ) {
    removeVoxel( hoveredVoxel.coordinate );
    render();
    return;
  }

  if ( modeDict.move && hoveredVoxel && selectedVoxel != hoveredVoxel ) {
    if ( selectedVoxel ) {
      selectedVoxel.material.opacity = 1;
    }
    selectedVoxel = hoveredVoxel;
    render();
    return;
  }
  
  if ( selectedVoxel != null ) {
    
    if ( selectedVoxel == hoveredVoxel ) {
      
      selectedVoxel = null;
      
    } else if ( brush.position.y < brushHideHeight ) { // Beacuse brush is the destination

      var successed = moveVoxelByCoordinates( selectedVoxel.coordinate,
                                              brush.coordinate);
      if ( successed ) {
        selectedVoxel = null; // Unset origin voxel.
      }
      
    }
  } else if ( hoveredVoxel != null) { // Set origin voxel
    
    selectedVoxel = hoveredVoxel;
  }

  render();
}


function onDocumentMouseUp( event ) {
  render();
}

function onDocumentMouseMove( event ) {
  mouse3D = projector.unprojectVector( new THREE.Vector3(  event.clientX / renderer.domElement.width * 2 - 1,
                                                           - event.clientY / renderer.domElement.height * 2 + 1,
                                                           0.5),
                                       camera);
  rayCaster.ray.direction = mouse3D.sub( camera.position ).normalize();
  
  interact();
  render();
}

function onDocumentMouseWheel( event ) {
  render();
}

function onWindowResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  render();
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////// GUI Stuffs //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function selectTestCoordinates( voxels ) {
  if ( voxels.length == 0 ) {
    console.warn( 'No top voxels ???' );
    return false;
  }

  var i0 = parseInt(Math.random()*100) % voxels.length;
  var i1 = parseInt(Math.random()*100) % voxels.length;
  var voxel0 = voxels[ i0 ], voxel1 = voxels[ i1 ];
  
  for ( var i = 0; i < 128; i++ ) {
    if ( voxel0.isMoving || voxel1.isMoving
         || findLockedDestination( voxel0.coordinate ) != null
         || findLockedDestination( voxel1.coordinate ) != null) {
      i0 = parseInt(Math.random()*100) % voxels.length;
      i1 = parseInt(Math.random()*100) % voxels.length;
      
      voxel0 = voxels[ i0 ];
      voxel1 = voxels[ i1 ];
      
    } else {
      break;
    }
  }

  
  if ( voxel0.isMoving || voxel1.isMoving
       || findLockedDestination( voxel0.coordinate ) != null
       || findLockedDestination( voxel1.coordinate ) != null ) {
    alert("Select failed, Please retry!");
    return;
  }
  
  var p0 = voxel0.position;
  var p1 = voxel1.position;
  coordinate0 = positionToCoordinate( p0 );
  coordinate1 = positionToCoordinate( p1 );
  coordinate1.y += 1; // Destination is the voxel above an exists top voxel.
}


function exchangeCoordinate() {
  var _x = coordinate0.x;
  coordinate0.x = coordinate1.x;
  coordinate1.x = _x;

  // Because: Destination is the voxel above an exists top voxel.
  var _y = coordinate0.y + 1;
  coordinate0.y = coordinate1.y - 1;
  coordinate1.y = _y;
  
  var _z = coordinate0.z;
  coordinate0.z = coordinate1.z;
  coordinate1.z = _z;

  updateTestCoordinatesGUI();
  console.log('exchanged');
}

// Dependent by `moveVoxelByCoordinates`
function updateHoveredCoordinateGUI( hoveredCoordinate ) {
  paramX.setValue( hoveredCoordinate.x );
  paramY.setValue( hoveredCoordinate.y );
  paramZ.setValue( hoveredCoordinate.z );
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

  coordinate0 = { x: 0, y: 0, z: 0 };
  coordinate1 = { x: 0, y: 0, z: 0 };
  
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
  
  var folder = gui.addFolder('Hovered coordinate:');
  paramX = folder.add( parameters, 'x' );
  paramY = folder.add( parameters, 'y' );
  paramZ = folder.add( parameters, 'z' );
  folder.open();
  
  var folder0 = gui.addFolder('Origin coordinate:');
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
  gui.add( parameters, '_selectTestCoordinates').name("Select TOP2");
  gui.add( parameters, 'move').name("Move!");
  
  //gui.open();
  gui.close();
}

function save() {
  brush.position.y = brushHideHeight;
  
  var _opacityZ  = coordinateLineMaterialZ.opacity;
  var _opacityX  = coordinateLineMaterialX.opacity;
  coordinateLineMaterialZ.opacity = 0.15;
  coordinateLineMaterialX.opacity = 0.15;
  lineMaterial.opacity = 0.05;
  
  render();
  
  window.open( renderer.domElement.toDataURL('image/png'), 'mywindow' ); // 将Canvas转换成图片

  coordinateLineMaterialZ.opacity = _opacityZ;
  coordinateLineMaterialX.opacity = _opacityX;
  lineMaterial.opacity = 0.1;
  
  render();
}

function clear() {
  if ( !confirm( 'Are you sure?' ) ) {
    return
  }

  var voxel;
  for ( var i in allVoxels ) {
    voxel = allVoxels[ i ];
    scene.remove( voxel );
  }
  topVoxels = [];
  allVoxels = [];
  
  updateHash();
  render();
}


////////////////////////////// Utils //////////////////////////////
function coordinateToPosition( coord ) {
  var pos = new THREE.Vector3();
  pos.x = ( coord.x + 0.5 ) * cubeX; //cubeX * (coord.x + (coord.x>0 ? -0.5 : 0.5));
  pos.y = ( coord.y + 0.5) * cubeY;
  pos.z = ( coord.z + 0.5 ) * cubeZ; //cubeZ * (coord.z + (coord.z>0 ? -0.5 : 0.5));
  return pos;
}

function positionToCoordinate( pos ) {
  var coord = {};
  coord.x = Math.round( pos.x/cubeX - 0.5 ); // Math.round( pos.x/cubeX + ( pos.x > 0 ? 0.5 : -0.5 ) );
  coord.y = Math.round( pos.y/cubeY - 0.5 );
  coord.z = Math.round( pos.z/cubeZ - 0.5 ); // Math.round( pos.z/cubeZ + ( pos.z > 0 ? 0.5 : -0.5 ) );
  return coord;
}


////////////////////////////// Encode & Decode //////////////////////////////

function buildFromHash( ) {
  
  var current = { x: 0, y: 0, z: 0, c: 0 }
  var data = decode( window.location.hash.substr( 1 ) );
  var i = 0, l = data.length;

  while ( i < l ) {

    var code = data[ i++ ].toString( 2 );

    if ( code.charAt( 1 ) == "1" ) current.x += data[ i++ ] - 32;
    if ( code.charAt( 2 ) == "1" ) current.y += data[ i++ ] - 32;
    if ( code.charAt( 3 ) == "1" ) current.z += data[ i++ ] - 32;
    if ( code.charAt( 4 ) == "1" ) current.c += data[ i++ ] - 32;
    if ( code.charAt( 0 ) == "1" ) {

      var coordinate = { x: current.x, y: current.y, z: current.z };
      var voxel = createVoxel( coordinate, current.c );
      scene.add( voxel );
      allVoxels.push( voxel );

      if ( current.c == 9 ) { // Black
        topVoxels.push( voxel );
      }
    }
  }
  updateHash();
}

function updateHash() { // 更新当前Hash编码

  var data = [],
  current = { x: 0, y: 0, z: 0, c: 0 },
  last = { x: 0, y: 0, z: 0, c: 0 }, // 上一个
  coordinate, code;

  sortAllVoxels();
  
  for ( var i in allVoxels ) {

    object = allVoxels[ i ];

    coordinate = positionToCoordinate( object.position );
    current.x = coordinate.x;
    current.y = coordinate.y;
    current.z = coordinate.z;
    current.c = colors.indexOf( object.material.color.getHex() );

    code = 0;

    if ( current.x != last.x ) code += 1000; 
    if ( current.y != last.y ) code += 100;
    if ( current.z != last.z ) code += 10;
    if ( current.c != last.c ) code += 1;

    code += 10000;

    data.push( parseInt( code, 2 ) ); // 在哪些维度上有偏移

    // >>> 如果在某一维度上有偏移，则添加其偏移量
    
    if ( current.x != last.x ) {

      // 32 是可选字符串长度的一半, 所以如果有两个方块某个维度的坐标
      // 差值大于31或小于-32就要悲剧了！
      data.push( current.x - last.x + 32 );
      last.x = current.x;

    }

    if ( current.y != last.y ) {

      data.push( current.y - last.y + 32 );
      last.y = current.y;

    }

    if ( current.z != last.z ) {

      data.push( current.z - last.z + 32 );
      last.z = current.z;

    }

    if ( current.c != last.c ) {

      data.push( current.c - last.c + 32 );
      last.c = current.c;

    }
  }

  data = encode( data );
  window.location.hash =  data;
  document.getElementById( 'link').href = "http://thewawar.github.io/blog/webgl/my-voxels.html#" + data;
}

// https://gist.github.com/665235
function decode( string ) { // *** 解码Hash字符串生成一个数组

  var output = [];
  string.split('').forEach( function ( v ) { output.push( "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf( v ) ); } );
  return output;

}

function encode( array ) {  // *** 编码数组(什么数组?)生成Hash字符串

  var output = "";
  array.forEach( function ( v ) { output += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt( v ); } );
  return output;

}

