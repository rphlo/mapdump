import React, { useEffect, useState } from 'react'
import { getCorners } from '../utils/drawHelpers'
import { saveAs } from 'file-saver'
import RouteHeader from './RouteHeader'
import ShareModal from './ShareModal'

const RouteViewing = (props) => {
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeRoute, setIncludeRoute] = useState(true);
  const [name, setName] = useState();
  const [togglingRoute, setTogglingRoute] = useState();
  const [togglingHeader, setTogglingHeader] = useState();
  const [imgData, setImgData] = useState()
  const [zoom, setZoom] = useState(200)
  const [imgDataOut, setImgDataOut] = useState(null)
  let finalImage = React.createRef();

  useEffect(() => {
    const qp = new URLSearchParams();
    qp.set('show_header', '1');
    qp.set('show_route', '1');
    const url = props.mapDataURL + '?' + qp.toString();
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function(){
        setImgData(this);
    };
    img.src = url

    const qp2 = new URLSearchParams();
    qp.set('show_header', '1');
    const url2 = props.mapDataURL + '?' + qp.toString();
    const img2 = new Image();
    img2.crossOrigin = "Anonymous";
    img2.src = url2
  }, [props.mapDataURL])

  React.useEffect(() => {
    const qp = new URLSearchParams();
    if (includeHeader) {
      qp.set('show_header', '1');
    }
    if (includeRoute) {
      qp.set('show_route', '1');
    }
    const url = props.mapDataURL + '?' + qp.toString();
    setImgDataOut(url);
    
    if (togglingHeader) {
      setTogglingHeader(false)
    }
    if (togglingRoute) {
      setTogglingRoute(false)
    }
  }, [includeHeader, includeRoute, props.mapDataURL, togglingHeader, togglingRoute])

  useEffect(() => {
    setName(props.name); 
  }, [props.name])

  const round5 = v => {
    return Math.round(v*1e5)/1e5;
  }

  const printCornersCoords = (corners_coords, separator) => {
    return '' + round5(corners_coords.top_left.lat) + separator + round5(corners_coords.top_left.lon) +
      separator + round5(corners_coords.top_right.lat) + separator + round5(corners_coords.top_right.lon) +
      separator + round5(corners_coords.bottom_right.lat) + separator + round5(corners_coords.bottom_right.lon) +
      separator + round5(corners_coords.bottom_left.lat) + separator + round5(corners_coords.bottom_left.lon);
  }

  const downloadMap = (e) => {
    const newCorners = getCorners(imgData, props.mapCornersCoords, props.route, includeHeader, includeRoute);
    const qp = new URLSearchParams();
    if (includeHeader) {
      qp.set('show_header', '1');
    }
    if (includeRoute) {
      qp.set('show_route', '1');
    }
    const url = props.mapDataURL + '?' + qp.toString();
    saveAs(url, name + '_' + (includeRoute ? '' : 'blank_') + printCornersCoords(newCorners, '_')+ '_.jpg');
  }

  const downloadGPX = (ev) => {
    saveAs(props.gpx, name + '.gpx');
  }

  const toggleHeader = (ev) => {
    if (togglingHeader) {
      return
    }
    setIncludeHeader(!includeHeader);
    setTogglingHeader(true)
  }
  const toggleRoute = (ev) => {
    if (togglingRoute) {
      return
    }
    setIncludeRoute(!includeRoute);
    setTogglingRoute(true)
  }

  const hasRouteTime = () => {
    return !!props.route[0].time
  }

  const zoomOut = () => {
    setZoom(Math.max(10, zoom - 10))
  }

  const zoomIn = () => {
    setZoom(zoom + 10)
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
      <div>
        <button style={{marginBottom: '5px'}} className="btn btn-sm btn-warning" onClick={share}><i className="fas fa-share"></i> Share</button><br/>
        <button style={{marginBottom: '5px'}} className="btn btn-sm btn-success" onClick={downloadMap}><i className="fas fa-download"></i> Download Map</button>&nbsp;
        <button style={{marginBottom: '5px'}} className="btn btn-sm btn-success" onClick={downloadGPX}><i className="fas fa-download"></i> Download GPX</button>
        { hasRouteTime() && <button style={{marginBottom: '5px'}} className="btn btn-sm btn-primary float-right" onClick={props.togglePlayer}><i className="fas fa-play"></i> View animation</button> }
      </div>
      <button className="btn btn-sm btn-default" onClick={zoomIn} aria-label="Zoom in"><i className={"fa fa-plus"}></i></button>&nbsp;
      <button className="btn btn-sm btn-default" onClick={zoomOut} aria-label="Zoom out"><i className={"fa fa-minus"}></i></button>&nbsp;
      <button className="btn btn-sm btn-default" onClick={toggleHeader}><i className={togglingHeader ? "fa fa-spinner fa-spin" : ("fa fa-toggle-"+(includeHeader ? 'on': 'off'))}></i> Header</button>&nbsp;
      <button className="btn btn-sm btn-default" onClick={toggleRoute}><i className={togglingRoute ? "fa fa-spinner fa-spin":("fa fa-toggle-"+(includeRoute ? 'on': 'off'))}></i> Route</button>&nbsp;
      <div>
        {imgDataOut && imgData && <center><img ref={finalImage} className="final-image" src={imgDataOut} alt="route" onClick={toggleRoute} style={{marginTop:'5px', width: zoom + '%'}}/></center>}
        {!imgDataOut && (
          <div>
            <h3><i className="fa fa-spin fa-spinner"></i> Loading</h3>
          </div>)}
      </div>
      {shareModalOpen && <ShareModal url={document.location.href} onClose={()=>setShareModalOpen(false)}/> }
    </div>
  )
}

export default RouteViewing;
