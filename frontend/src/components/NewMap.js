import React from 'react'
import GPXDropzone from './GPXDrop'
import ImageDropzone from './ImgDrop'
import RouteDrawing from './RouteDrawing'
import PathDrawing from './PathDrawing'
import CornerCoordsInput from './CornerCoordsInput'
import { parseGpx, extractCornersCoordsFromFilename, validateCornersCoords } from '../utils/fileHelpers'
import { LatLon } from '../utils/Utils'
import { parseTCXString } from '../utils/tcxParser'
const pkg = require('../../package.json')

function NewMap() {
    const [route, _setRoute] = React.useState();
    const [drawRoute, setDrawRoute] = React.useState(false)
    const [mapCornersCoords, setMapCornersCoords] = React.useState();
    const [mapDataURL, _setMapDataURL] = React.useState();
    const [name, setName] = React.useState();
  
    const setRoute = (newRoute) =>{
      window.drawmyroute.route = newRoute;
      _setRoute(newRoute);
    } 
    const setMapDataURL = (newMapDataURL) =>{
      window.drawmyroute.mapDataURL = newMapDataURL;
      _setMapDataURL(newMapDataURL);
    } 
  
    const acceptedFormats = {
      "image/jpeg":true,
      "image/gif":true,
      "image/png":true
    };
  
    const onRouteLoaded = (newRoute) => {
      setRoute(newRoute)
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
      const newRoute = [];
      if (parsedGpx.segments.length === 0) {
        onRouteLoaded(newRoute)
        return;
      }
      for (let i = 0; i < parsedGpx.segments[0].length; i++) {
        const pos = parsedGpx.segments[0][i];
        newRoute.push({time: pos.time, latLon: [pos.loc[0], pos.loc[1]]});
      }
      onRouteLoaded(newRoute)
    }

    const onTCXParsed = (error, workout) => {
      if (error) {
        window.alert('Error parsing your TCX file!');
        return
      }
      const newRoute = [];
      workout.laps.forEach(lap => {
        lap.track.forEach(pos=>{
          newRoute.push({time: +pos.datetime, latLon: [pos.latitude, pos.longitude]})
        })
      })
      onRouteLoaded(newRoute)
    }

    const onTCXLoaded = e => {
      const xml = e.target.result;
      try {
        parseTCXString(xml, onTCXParsed);
      } catch(e) {
        console.log(e)
        window.alert('Error parsing your TCX file!');
      }
    }
  
    const onDropGPX = acceptedFiles => {
      if(!acceptedFiles.length) {
        return
      }
      const gpxFile = acceptedFiles[0];
      const filename = gpxFile.name;
      setName(filename.slice(0, -4))
      const fr = new FileReader();
      if (filename.toLowerCase().endsWith('.tcx')) {
        fr.onload = onTCXLoaded;
      } else {
        fr.onload = onGPXLoaded;
      }
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
        { (!route && !drawRoute ) && <>
          <h1>GPX File</h1><GPXDropzone onDrop={onDropGPX} />
          <hr/>
          or <button className="btn btn-primary" onClick={()=>{setDrawRoute(true);setName('Untitled Run')}}><i className="fas fa-pen"></i> Draw route manually</button>
        </>}
        { (drawRoute || route) && !mapDataURL && <>
          <h1>Map Image File</h1>
          <ImageDropzone onDrop={onDropImg}/>
          <button className="btn btn-danger" onClick={onRestart}><i className="fas fa-undo"></i> Back</button>
      </>}
        { (drawRoute || route) && mapDataURL && !mapCornersCoords &&(
          <>
            <h1>Calibration</h1>
            <CornerCoordsInput
              onSet={onSetCornerCoords}
              onUndo={onRemoveMap}
              coordsCallback={onSetCornerCoords}
            />
          </>
        )}
        { drawRoute && !route && mapDataURL && mapCornersCoords && (
          <PathDrawing
            mapCornersCoords={mapCornersCoords}
            mapDataURL={mapDataURL}
            onRoute={setRoute}
          />
        )}
        { route && mapDataURL && mapCornersCoords && (
          <RouteDrawing
            route={route}
            mapCornersCoords={mapCornersCoords}
            mapDataURL={mapDataURL}
            name={name}
          />
        )}
        <span style={{color:'white'}}>v{pkg.version}</span>
      </div>
    );
  }

  export default NewMap