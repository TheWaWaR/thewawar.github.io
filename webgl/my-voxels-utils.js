

////////////////////////////// Utils //////////////////////////////
function coordinateToPosition( coord ) {
  var pos = new THREE.Vector3();
  pos.x = cubeX * (coord.x + (coord.x>0 ? -0.5 : 0.5));
  pos.y = cubeY * (coord.y-0.5);
  pos.z = cubeZ * (coord.z + (coord.z>0 ? -0.5 : 0.5));
  return pos;
}

function positionToCoordinate( pos ) {
  var coord = {};
  coord.x = Math.round( pos.x/cubeX + ( pos.x > 0 ? 0.5 : -0.5 ) );
  coord.y = Math.round( pos.y/cubeY + 0.5 );
  coord.z = Math.round( pos.z/cubeZ + ( pos.z > 0 ? 0.5 : -0.5 ) );
  return coord;
}



