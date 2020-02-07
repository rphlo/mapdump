import React from 'react'
import GPXDropzone from './GPXDrop'
import ImageDropzone from './ImgDrop'
import RouteDrawing from './RouteDrawing'
import CornerCoordsInput from './CornerCoordsInput';
import { parseGpx, extractCornersCoordsFromFilename, validateCornersCoords } from '../utils/fileHelpers'
import { LatLon } from '../utils/Utils';

const pkg = require('../../package.json');

function NewMap() {
    const [route, _setRoute] = React.useState();
    const [mapCornersCoords, setMapCornersCoords] = React.useState();
    const [mapDataURL, _setMapDataURL] = React.useState();
    const [name, setName] = React.useState();
  
    const setRoute = (route) =>{
      window.drawmyroute.route = route;
      _setRoute(route);
    } 
    const setMapDataURL = (mapDataURL) =>{
      window.drawmyroute.mapDataURL = mapDataURL;
      _setMapDataURL(mapDataURL);
    } 
  
    const acceptedFormats = {
      "image/jpeg":true,
      "image/gif":true,
      "image/png":true
    };
  
    const onRouteLoaded = (route) => {
      setRoute(route)
    }
  
    const onGPXLoaded = e => {
      const xml = e.target.result;
      let parsedGpx;
      try {
        parsedGpx = parseGpx(xml);
      } catch(e) {
        window.alert('Error parsing your GPX file!');
        return;
      }
      const route = [];
      if (parsedGpx.segments.length === 0) {
        onRouteLoaded(route);
        return;
      }
      for (let i = 0; i < parsedGpx.segments[0].length; i++) {
        const pos = parsedGpx.segments[0][i];
        route.push({time: pos.time, latLon: [pos.loc[0], pos.loc[1]]});
      }
      onRouteLoaded(route)
    }
  
    const onDropGPX = acceptedFiles => {
      if(!acceptedFiles.length) {
        return
      }
      const gpxFile = acceptedFiles[0];
      const filename = gpxFile.name;
      setName(filename.slice(0, -4))
      const fr = new FileReader();
      fr.onload = onGPXLoaded;
      fr.readAsText(gpxFile);
    }
    const onImgLoaded = (e) => {
      var imageUri = e.target.result;
      setMapDataURL(imageUri);
    }
    const onDropImg = acceptedFiles => {
      if(!acceptedFiles.length) {
        return
      }
      const file = acceptedFiles[0];
      if(acceptedFormats[file.type]){
        const reader = new FileReader();
        reader.onload = onImgLoaded;
        reader.readAsDataURL(file);
        const foundCornersCoords = extractCornersCoordsFromFilename(file.name);
        if (foundCornersCoords && validateCornersCoords(foundCornersCoords)) {
          var c = foundCornersCoords.split(',').map(function(c){return parseFloat(c);});
          setMapCornersCoords({
            top_left: new LatLon(c[0], c[1]),
            top_right: new LatLon(c[2], c[3]),
            bottom_right: new LatLon(c[4], c[5]),
            bottom_left: new LatLon(c[6], c[7])
          })
        }
      } else {
        window.alert("Invalid image format");
      }
    }
    const onSetCornerCoords = (foundCornersCoords) =>{
      if (foundCornersCoords && validateCornersCoords(foundCornersCoords)) {
        var c = foundCornersCoords.split(',').map(function(c){return parseFloat(c);});
        setMapCornersCoords({
          top_left: new LatLon(c[0], c[1]),
          top_right: new LatLon(c[2], c[3]),
          bottom_right: new LatLon(c[4], c[5]),
          bottom_left: new LatLon(c[6], c[7])
        })
      }
    }
    const onRemoveMap = () => {
      setMapDataURL(null);
      setMapCornersCoords(null);
    }
    const onRestart = () => {
      setRoute(null);
      setMapDataURL('');
      setMapCornersCoords(null);
    }
    return (
      <div className="App">
        { !route && <><h1>GPX File</h1><GPXDropzone onDrop={onDropGPX} /></>}
        { route && !mapDataURL && <>
          <h1>Map Image File</h1>
          <ImageDropzone onDrop={onDropImg}/>
          <button className="btn btn-danger" onClick={onRestart}><i className="fas fa-undo"></i> Back</button>
      </>}
        { route && mapDataURL && !mapCornersCoords &&(
          <>
            <h1>Calibration</h1>
            <CornerCoordsInput
              onSet={onSetCornerCoords}
              onUndo={onRemoveMap}
              coordsCallback={onSetCornerCoords}
            />
          </>
        )}
        { route && mapDataURL && mapCornersCoords && (
          <RouteDrawing
            route={route}
            mapCornersCoords={mapCornersCoords}
            mapDataURL={mapDataURL}
            onReset={onRestart}
            name={name}
            editMode={true}
          />
        )}
        <span style={{color:'white'}}>v{pkg.version}</span>
      </div>
    );
  }

  export default NewMap