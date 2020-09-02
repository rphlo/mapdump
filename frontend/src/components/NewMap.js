import React from 'react'
import JSZip from 'jszip'
import useGlobalState from '../utils/useGlobalState'
import GPXDropzone from './GPXDrop'
import ImageDropzone from './ImgDrop'
import RouteDrawing from './RouteDrawing'
import PathDrawing from './PathDrawing'
import StravaPicker from './StravaPicker'
import CornerCoordsInput from './CornerCoordsInput'
import { parseGpx, extractCornersCoordsFromFilename, validateCornersCoords } from '../utils/fileHelpers'
import { LatLon } from '../utils/Utils'
import { parseTCXString } from '../utils/tcxParser'
const pkg = require('../../package.json')

function NewMap() {
    const globalState = useGlobalState()
    const { username } = globalState.user
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
    
    const deg2rad = (deg) => deg * Math.PI / 180;

    const computeBoundsFromLatLonBox = (n, e, s ,w, rot) => {
      const a = (e + w) / 2;
      const b = (n + s) / 2
      const squish = Math.cos(deg2rad(b))
      const x = squish * (e - w) / 2
      const y = (n - s) / 2
  
      const ne = [
          b + x * Math.sin(deg2rad(rot)) + y * Math.cos(deg2rad(rot)),
          a + (x * Math.cos(deg2rad(rot)) - y * Math.sin(deg2rad(rot))) / squish,
      ];
      const nw = [
          b - x * Math.sin(deg2rad(rot)) + y * Math.cos(deg2rad(rot)),
          a - (x * Math.cos(deg2rad(rot)) + y * Math.sin(deg2rad(rot))) / squish,
      ];
      const sw = [
          b - x * Math.sin(deg2rad(rot)) - y * Math.cos(deg2rad(rot)),
          a - (x * Math.cos(deg2rad(rot)) - y * Math.sin(deg2rad(rot))) / squish,
      ];
      const se = [
          b + x * Math.sin(deg2rad(rot)) - y * Math.cos(deg2rad(rot)),
          a + (x * Math.cos(deg2rad(rot)) + y * Math.sin(deg2rad(rot))) / squish,
      ];
      return [nw, ne, se, sw]
    }

    const extractKMZInfo = async (kmlText, kmz) => {
      const parser = new DOMParser();
      const parsedText = parser.parseFromString(kmlText, "text/xml");
      const go = parsedText.getElementsByTagName('GroundOverlay')[0];
      if (go) {
        try {
          const nameEl = go.getElementsByTagName('name')[0].innerHTML;
          const latLonboxEl = go.getElementsByTagName('LatLonBox')[0];
          const latLonQuadEl = go.getElementsByTagName('gx:LatLonQuad')[0];
          const filePath = go.getElementsByTagName('href')[0].innerHTML;
          const fileU8 = await kmz.file(filePath).async('uint8array');
          const filename = kmz.file(filePath).name;
          const extension = filename.slice(-3).toLowerCase();
          let mime = ''
          if(extension === 'jpg') {
            mime = 'image/jpeg;';
          } else if (['png, gif'].includes(extension)) {
            mime = 'image/' + extension + ';';
          }
          const imageDataURI = 'data:' + mime + 'base64,' + Buffer.from(fileU8).toString('base64');
          let bounds;
          if (latLonboxEl) {
            bounds = computeBoundsFromLatLonBox(
              parseFloat(latLonboxEl.getElementsByTagName('north')[0].innerHTML),
              parseFloat(latLonboxEl.getElementsByTagName('east')[0].innerHTML),
              parseFloat(latLonboxEl.getElementsByTagName('south')[0].innerHTML),
              parseFloat(latLonboxEl.getElementsByTagName('west')[0].innerHTML),
              parseFloat(latLonboxEl.getElementsByTagName('rotation')[0] ? latLonboxEl.getElementsByTagName('rotation')[0].innerHTML : 0)
            )
          } else {
            let [sw, se, ne, nw] = latLonQuadEl.getElementsByTagName('coordinates')[0].innerHTML.trim().split(' ');
            nw = nw.split(',');
            ne = ne.split(',');
            se = se.split(',');
            sw = sw.split(',');
            bounds = [
              [parseFloat(nw[1]), parseFloat(nw[0])],
              [parseFloat(ne[1]), parseFloat(ne[0])],
              [parseFloat(se[1]), parseFloat(se[0])],
              [parseFloat(sw[1]), parseFloat(sw[0])],
            ];
          }
          return {
            name: nameEl,
            bounds: {
              top_left: new LatLon(bounds[0][0], bounds[0][1]),
              top_right: new LatLon(bounds[1][0], bounds[1][1]),
              bottom_right: new LatLon(bounds[2][0], bounds[2][1]),
              bottom_left: new LatLon(bounds[3][0], bounds[3][1])
            },
            imageDataURI,
          };
        } catch (e) {
          console.log(e);
          window.alert('Could not parse this KMZ');
          return;
        }
      } else {
        window.alert('Could not find maps in this KMZ');
        return;
      }
    }
  
    const onKmzLoaded = async (file) => {
      const zip = await JSZip.loadAsync(file);
      if (zip.files && zip.files['doc.kml']) {
        const kml = await zip.file('doc.kml').async('string');
        const data = await extractKMZInfo(kml, zip);
        if (data) {
          setMapDataURL(data.imageDataURI)
          setName(data.name)
          setMapCornersCoords(data.bounds)
        }
      } else {
        window.alert('Invalid KMZ');
      }
    }
  
    const onDropImg = acceptedFiles => {
      if(!acceptedFiles.length) {
        return
      }
      const file = acceptedFiles[0];
      const filename = file.name;
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
      } else if (filename.toLowerCase().endsWith('.kmz')) {
        onKmzLoaded(file);
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
      setDrawRoute(false)
    }
    return (
      <div className="App">
        { (!route && !drawRoute ) && <>
          <h1>GPS File</h1><GPXDropzone onDrop={onDropGPX} />
          {username && <>
            <hr/>
            <StravaPicker onRouteDownloaded={(name, route) => {setName(name);onRouteLoaded(route)}} />
          </> }
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