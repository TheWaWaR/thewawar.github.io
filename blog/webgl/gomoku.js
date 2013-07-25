

var container, gui;
var scene, camera, renderer ;
var controls, projector;
var colors = [ 0xDF1F1F, 0xDFAF1F, 0x80DF1F, 0x1FDF50, 0x1FDFDF, 0x1F4FDF, 0x7F1FDF, 0xDF1FAF, 0xEFEFEF, 0x303030 ];
var gridSize = 20;
var cubeX = 40, cubeY=20, cubeZ = 40, fixX = 4, fixZ = 4, fixY = 0;
var planeX = gridSize * cubeX, planeZ = gridSize * cubeZ, brushHideHeight = 4000;
var voxelGeometry;

var currColorIdx = 1, colorIdxs = [ 2, 7 ];
var ENDed = false;
var brush, brushColor = 0x666666, allVoxels = [];
var coordinateMinY, coordinateMaxY;
var paramX, paramY, paramZ;

var modeDict = {
  add: true,
  remove: false
};
// var isShiftDown = false, isControlDown = false, isAltDown = false;
var rayCaster, mouse3D, hoveredVoxel = null, selectedVoxel = null, destinationVoxel = null;
var removeOpacity = 0.3, selectedOpacity = 0.5;

/** <---- @weet [2013-07-21 11:39] ---->
   
   Bus:
   ====
   1. 移动一定次数后会卡死，怀疑是内存泄漏或死循环

   
   Features:
   =========
   . Hover 方块时显示方块的信息(比如坐标...)
   . 允许自行在空白的平面上添加方块


   Gomoku:
   =======
   . DONE:: 方块是方的
   . DONE:: 没有初始化方块
   . DONE:: 添加的方块 y 不可以大于 1
   . DONE:: 移动的目的地的 y 不可以大于 1
   . DONE:: GUI 里没有 TOP2, exchange, move, paramX0..., coordinate0, coordinate1 菜单, 
   . DONE:: 不对顶层方块进行特殊处理 (比如着色)
   . DONE:: 设置一个全局的颜色变量每次 添加/删除 方块时都改变方块的颜色
   . DONE:: 去掉坐标轴, 加深网格颜色
   . DONE:: 去掉移动功能
   . TODO:: 每次添加棋子时检查是否有五子连线，如果有就给予标记出来，并弹出窗口提示
   . 把方块换成扁的球体
   . 更新位置算法
   . 更新快捷键
   . 对二维坐标进行编码和解码
   
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
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 10000 );
  camera.position.set( 0, (planeX+planeZ)*0.667, 0);
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
  var voxel = new THREE.Mesh( voxelGeometry,
                              new THREE.MeshPhongMaterial( { color: colors[ colorIdxs[ currColorIdx ] ] } ) );
  voxel.coordinate = coordinate;
  var p = coordinateToPosition( voxel.coordinate );
  voxel.position.set( p.x, p.y, p.z );
  
  voxel.overdraw = true;
  
  voxel.isMoving = false;

  return voxel;
}



function initMeshs() {
  // Cubes
  voxelGeometry = new THREE.SphereGeometry( ( cubeX-fixX )/2, 40, 20 );
  
  brush = new THREE.Mesh( voxelGeometry,
                          new THREE.MeshPhongMaterial( { color: brushColor,
                                                         opacity: 0.5 } ) );
  brush.coordinate = { x: 6, y: 1, z: 3 };
  var p = coordinateToPosition( brush.coordinate );
  brush.position.set( p.x, p.y, p.z );
  scene.add(brush);


  // Lines (Grid)
  var lineMaterial = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.3 } );
  var geometry1 = new THREE.Geometry();
  geometry1.vertices.push( new THREE.Vector3( 0, 0.1, -planeZ/2 ) );
  geometry1.vertices.push( new THREE.Vector3( 0, 0.1, planeZ/2 ) );
  var geometry2 = new THREE.Geometry();
  geometry2.vertices.push( new THREE.Vector3( 0, 0.1, -planeX/2 ) );
  geometry2.vertices.push( new THREE.Vector3( 0, 0.1, planeX/2 ) );

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

function printAllCoordinates() {
  allVoxels.forEach(function(voxel) {
    console.log(voxel.coordinate);
  });
}

function checkGomoku( tx, tz ) {
  
  var dict = {}, keys = ['-1,-1', '-1,0', '-1,1', '0,-1', '0,1', '1,-1', '1,0', '1,1'];
  
  for ( ik in keys ) {
    dict[ keys[ ik ] ] = { n: 0, ended: false };
  }

  var idx, voxel, targetColor, currColor;
  
  idx = getVoxelIndexByCoordinate( allVoxels, { x: tx, y: 1, z: tz } );
  targetColor = allVoxels[ idx ].material.color.getHex();
  console.log( 'targetColor:', targetColor );

  for ( var i = 1; i <= 4; i++ ) {

    for ( ik in keys ) {
      var k = keys[ ik ];
      var slst = k.split(',');
      
      if ( dict[ k ].ended == false ) {
        var sx = parseInt( slst[ 0 ] ), sz = parseInt( slst[ 1 ] );
        var coordinate =  { x: tx + sx*i, y: 1, z: tz + sz*i };
        
        idx = getVoxelIndexByCoordinate( allVoxels, coordinate );
        currColor = idx != null ? allVoxels[ idx ].material.color.getHex() : null;
        
        // console.log( 'i, k, coordinate, currColor:', i, ' ( ', k, ' ) ', coordinate, currColor)

        if ( targetColor == currColor ) {
          dict[ k ].n += 1;
        } else {
          // dict[ k ].ended = true;
        }
      }
    }
  }

  var keyPairs = [
    ['-1,-1', '1,1'],
    ['-1,0', '1,0'],
    ['0,-1', '0,1'],
    ['-1,1', '1,-1'],
  ];
  
  var result = null;
  for ( ai in keyPairs ) {
    var pair = keyPairs[ ai ];
    var len = dict[ pair[0] ].n + dict[ pair[1] ].n;
    if ( len >= 4 ) {
      console.log('Match record:', pair, dict[ pair[0] ], dict[ pair[1] ] );
      result = { a: dict[ pair[0] ], b: dict[ pair[1] ] };
    }
  }
  return result;
}

function addVoxel( coordinate ) {
  console.log('To be added:', coordinate);


  // Error handlers: Check if can be added.
  if ( ENDed ) {
    console.warn( 'GAME OVER!' );
    return false;
  }
  
  if ( coordinate.y > 1 ) {
    console.warn( 'Add ERROR: This is gomoku game!!!' );
    return false;
  }

  var topIdx = getVoxelIndexByCoordinate( allVoxels, coordinate );
  if ( topIdx != null ) {
    console.warn( 'Add ERROR: Can not recover a voxel!', coordinate );
    return false;
  }


  // Adding...

  var voxel = createVoxel( coordinate );
  scene.add( voxel );
  allVoxels.push( voxel );

  console.log( 'Voxel added(to: [SCENE, ALL]):', voxel.coordinate);

  currColorIdx = ( currColorIdx + 1 )%2;
  
  var result = checkGomoku( coordinate.x, coordinate.z ) 
  console.log( 'Check gomoku:', result );
  if ( result != null ) {
    ENDed = true;
    var winMsg = currColorIdx == 1 ? 'Green is the winner!' : 'Red is the winner!';
    alert('THE END :  ' + winMsg);
  }
  
  return true;
}


function removeVoxel( coordinate ) {
  console.log('To be removed:', coordinate);
  
  // Error handlers: Check if can be removed.
  if ( ENDed ) {
    console.warn( 'GAME OVER!' );
    return false;
  }
  
  var allIdx = getVoxelIndexByCoordinate( allVoxels, coordinate );
  if ( allIdx == null ) {
    console.warn( 'Remove ERROR: Can not remove voxel not exists!', coordinate );
    return false;
  }

  var voxel = allVoxels[ allIdx ];
  if ( voxel.material.color.getHex() == colors[ colorIdxs[ currColorIdx ] ] ) {
    console.warn( 'Remove ERROR: Check color failed' );
    return false;
  }
  
  
  //  >>> Removing... <<<
  
  allVoxels.splice( allIdx, 1 );
  scene.remove( voxel );

  console.log( 'Voxel removed:', voxel.coordinate);

  currColorIdx = ( currColorIdx + 1 )%2;
  return true;
}



function render() {
  controls.update();

  if ( selectedVoxel != null ) {
    if ( selectedVoxel != hoveredVoxel ) {
      selectedVoxel.material.opacity = selectedOpacity;
    }
  }

  brush.material.color.setHex( colors[ colorIdxs[ currColorIdx ] ] );
  
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

    if ( modeDict.remove ) {
      if ( intersect.object != plane ) {
        hoveredVoxel = intersect.object;
        hoveredVoxel.material.opacity = 0.5;
      }
    } else {
      var point = intersect.point;
      point.y += fixY/2 + 0.2;  // Force fix y point
      
      brush.position.x = Math.floor( point.x / cubeX ) * cubeX + cubeX/2;
      brush.position.y = cubeX/2 * 0.8; 
      brush.position.z = Math.floor( point.z / cubeZ ) * cubeZ + cubeZ/2;
      brush.coordinate = positionToCoordinate( brush.position );
      brush.position = coordinateToPosition( brush.coordinate );
      
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
  var validModes = ['add', 'remove', 'none'];
  if ( validModes.indexOf( mode ) == -1 ) {
    console.error( 'Invalid mode name:', mode );
    return false;
  }
  
  if ( mode == 'add' || mode == 'none' ) {
    modeDict.add = true;
    modeDict.remove = false;
  } else if ( mode == 'remove' ) {
    modeDict.add = false;
    modeDict.remove = true;
  } else {
    console.error( 'Unexcepted mode:', mode);
  }
}


function onDocumentKeyDown( event ) {
  console.log( event.keyCode );
  
  switch ( event.keyCode ) {
    
  case 17: // Control
    setMode( 'add' );
    brush.material.color.setHex( colors[ colorIdxs[ currColorIdx ] ] );
    interact();
    render();
    break;
    
  case 18: // Alt
    setMode( 'remove' ); 
    brush.material.color.setHex( brushColor );
    interact();
    render();
    break;
    
  default:
    setMode ( 'add' );
    brush.material.color.setHex( colors[ colorIdxs[ currColorIdx ] ] );
    interact();
    render();
  }
}

function onDocumentKeyUp( event ) {

  switch ( event.keyCode ) {

  case 17: // Control
    setMode( 'none' );
    interact();
    render();
    break;
    
  case 18: // Alt
    setMode( 'none' );
    interact();
    render();
    break;
    
  default:
    setMode( 'none' );
    interact();
    render();
    
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
  render();
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////// GUI Stuffs //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


function initGUI() {
  gui = new dat.GUI();
  var parameters = 
    {
      newGame: function() {
        window.location.hash = '';
        window.location.reload();
      }
    };

  gui.add( parameters, 'newGame' ).name('New Game');
  gui.open();
}



////////////////////////////// Utils //////////////////////////////
function coordinateToPosition( coord ) {
  var pos = new THREE.Vector3();
  pos.x = ( coord.x + 0.5 ) * cubeX; //cubeX * (coord.x + (coord.x>0 ? -0.5 : 0.5));
  pos.y = cubeX/2 * 0.8;
  pos.z = ( coord.z + 0.5 ) * cubeZ; //cubeZ * (coord.z + (coord.z>0 ? -0.5 : 0.5));
  return pos;
}

function positionToCoordinate( pos ) {
  var coord = {};
  coord.x = Math.round( pos.x/cubeX - 0.5 ); //Math.round( pos.x/cubeX + ( pos.x > 0 ? 0.5 : -0.5 ) );
  coord.y = 1;
  coord.z = Math.round( pos.z/cubeZ - 0.5 ); //Math.round( pos.z/cubeZ + ( pos.z > 0 ? 0.5 : -0.5 ) );
  return coord;
}
