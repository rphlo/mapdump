import React, { useEffect, useState } from 'react'
import { LatLon, cornerCalTransform } from '../utils/Utils'
import * as L from 'leaflet';
import Slider from 'react-input-slider';
import { Position, PositionArchive } from '../utils/positions'
import { Link } from 'react-router-dom'
import RouteHeader from './RouteHeader';
import ShareModal from './ShareModal'

const RouteReplay = (props) => {
  const [playing, setPlaying] = useState(false)
  const [route, setRoute] = useState(false)
  
  const [mapImage, setMapImage] = useState(false)
  const [speed, setSpeed] = useState(8)
  const [progress, setProgress] = useState(0)
  const [leafletMap, setLeafletMap] = useState(null)
  const [leafletTail, setLeafletTail] = useState(null)
  const [leafletMarker, setLeafletMarker] = useState(null)
  const [playInterval, setPlayInterval] = useState(null)

  const FPS = 15
  const tailLength = 60
  

  function resetOrientation(src, callback) {
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function() {
        var width = img.width,
            height = img.height,
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0);

        // export base64
        callback(canvas.toDataURL('image/jpeg', 0.4));
    }
    img.src = src;
  }

  useEffect(() => {
    const arch = new PositionArchive()
    props.route.forEach(p => arch.add(new Position({timestamp: p.time, coords: {latitude: p.latLon[0], longitude: p.latLon[1]}})))
    setRoute(arch);
  }, [props.route])

  useEffect(() => {   
    resetOrientation(props.mapDataURL, function(imgDataURI){
      var img = new Image();
      img.onload = function () {
        setMapImage(this)
        const map = L.map('raster_map', {crs: L.CRS.Simple, minZoom: -5, maxZoom:2});
        setLeafletMap(map)
        const bounds = [map.unproject([0,0]), map.unproject([this.width, this.height])];
        new L.imageOverlay(this.src, bounds).addTo(map);
        map.fitBounds(bounds);
        map.invalidateSize()
      }
      img.src = imgDataURI
    })
  }, [props.mapDataURL])

  useEffect(() => {
    const getCurrentTime = () => {
      const lastT = route.getByIndex(route.getPositionsCount() - 1).timestamp
      const firstT = route.getByIndex(0).timestamp
      return firstT + (lastT - firstT) * progress / 100
    }
    if(!route) {return}
    const transform = cornerCalTransform(
      mapImage.width,
      mapImage.height,
      props.mapCornersCoords.top_left,
      props.mapCornersCoords.top_right,
      props.mapCornersCoords.bottom_right,
      props.mapCornersCoords.bottom_left
    )
    const currentPos = route.getByTime(getCurrentTime())
    const hasPointLast30sec = route.hasPointInInterval(getCurrentTime() - 30 * 1e3, getCurrentTime());
    if(!hasPointLast30sec){
        if(leafletMarker) {
          leafletMap.removeLayer(leafletMarker);
        }
        setLeafletMarker(null);
    } else if(currentPos && !isNaN(currentPos.coords.latitude)){
      const pt = transform(new LatLon(currentPos.coords.latitude, currentPos.coords.longitude))
      if(!leafletMarker){
        const m = new L.circleMarker(
          [-pt.y, pt.x],
          {weight:5, radius: 7, color: 'red', fill: false, fillOpacity:0, opacity: 0.75}
        )
        m.addTo(leafletMap);
        setLeafletMarker(m)
      } else {
        leafletMarker.setLatLng([-pt.y, pt.x]);
      }
    }
    const tailPts = route.extractInterval(getCurrentTime() - tailLength * 1e3, getCurrentTime());
    const hasPointInTail = route.hasPointInInterval(getCurrentTime() - tailLength * 1e3, getCurrentTime());
    if(!hasPointInTail){
      if(leafletTail) {
        leafletMap.removeLayer(leafletTail);
      }
      setLeafletTail(null)
    } else {
      var tailLatLng = [];
      tailPts.getArray().forEach(function (pos) {
        if (!isNaN(pos.coords.latitude)) {
          const pt = transform(new LatLon(pos.coords.latitude, pos.coords.longitude));
          tailLatLng.push([-pt.y, pt.x])
        }
      })
      if (!leafletTail) {
        const t = L.polyline(tailLatLng, {
          color: 'red',
          opacity: 0.75,
          weight: 5
        });
        t.addTo(leafletMap)
        setLeafletTail(t)
      } else {
        leafletTail.setLatLngs(tailLatLng);
      }
    }
  }, [route, progress, props.mapCornersCoords, leafletMap, leafletTail, leafletMarker, mapImage, tailLength])

  const getTimeProgress = (t) => {
    const lastT = props.route[props.route.length - 1].time
    const firstT = props.route[0].time
    return (t - firstT) / (lastT - firstT) * 100
  }

  const increaseTime = (pr, sp, pi) => {
    const lastT = route.getByIndex(route.getPositionsCount() -1).timestamp
    const firstT = route.getByIndex(0).timestamp
    const newTime = firstT + (lastT - firstT) * pr / 100 + sp / FPS * 1000
    const p = Math.min(100, getTimeProgress(newTime))
    if(p === 100) {
      clearInterval(pi);
      onPause()
    }
    return p
  }

  const onPlay = () => {
    setPlaying(true)
    const interval = setInterval(() => {
      setPlayInterval(pi=>{
        setSpeed(s => {
          setProgress(progress => increaseTime(progress, s, pi))
          return s
        })
        return pi
      })}, 1000 / FPS)
    setPlayInterval(interval)
  }
  const onPause = () => {
    clearInterval(playInterval)
    setPlayInterval(null)
    setPlaying(false)
  }
  const onChangeProgress = ({x}) => {
    setProgress(x)
  }
  const onSlower = () => {
    setSpeed(Math.max(1, speed/2))
  }
  const onFaster = () => {
    setSpeed(speed * 2)
  }

  const getFormattedTimeSinceStart = () => {
    if(!route) {return ''}
    const lastT = route.getByIndex(route.getPositionsCount() -1).timestamp
    const firstT = route.getByIndex(0).timestamp
    const t = (lastT - firstT) * progress / 100;
    const date = new Date(null);
    date.setSeconds(t/1e3);
    return date.toISOString().substr(11, 8);
  }

  const hasRouteTime = () => {
    return !!props.route[0].time
  }

  let webShareApiAvailable = false
  if (navigator.share) {
    webShareApiAvailable = true
  }

  const [shareModalOpen, setShareModalOpen] = useState(false)
  const share = () => {
    if(webShareApiAvailable) {
      try {
        navigator.share({url: document.location.href})
      } catch (e) {}
    } else {
      setShareModalOpen(true)
    }
  }

  return (
    <div>
      <RouteHeader {...props} />
    { hasRouteTime() ? (
    <>
      <Link to={'/routes/'+props.id}><button className="btn btn-sm btn-primary float-right" style={{marginBottom:'5px'}}><i className="fas fa-search"></i> Full route view</button></Link>
      <div>
        <button style={{marginBottom: '5px'}} className="btn btn-sm btn-warning" onClick={share}><i className="fas fa-share"></i> Share</button>
      </div>
      <div id="raster_map" style={{marginBottom:'5px', height: '500px', width: '100%'}}></div>
      <div style={{marginBottom:'5px'}}>
      { !playing ? (
        <button className="btn btn-light" onClick={onPlay}><i className="fa fa-play"></i></button>
      ) : (
        <button className="btn btn-light" onClick={onPause}><i className="fa fa-pause"></i></button>
      )}
      <span style={{paddingLeft: '15px'}}><Slider style={{width:'calc(100% - 65px)'}} axis='x' onChange={onChangeProgress} xmin="0" xmax="100" xstep=".1" x={progress}/></span></div>
      <div><span className="badge badge-secondary" style={{fontSize: '1em',fontVariantNumeric: 'tabular-nums'}}>{ getFormattedTimeSinceStart() }</span><span className="badge badge-secondary" style={{fontSize: '1em', marginLeft: '5px'}}>{'x' + speed }</span> <button className="btn btn-sm btn-light" onClick={onSlower}>Slower</button> <button onClick={onFaster} className="btn btn-sm btn-light">Faster</button></div>
    </>) : (
    <>
      <div className="alert alert-warning"><i className="fas fa-exclamation-triangle"></i> Can not display player as route does not contain time information.</div>
      <div id="raster_map"></div>
    </>)}
    {shareModalOpen && <ShareModal url={document.location.href} onClose={()=>setShareModalOpen(false)}/> }
  </div>)
}

export default RouteReplay;
