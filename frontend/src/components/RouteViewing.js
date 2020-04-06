import React, { useEffect, useState } from 'react'
import { drawRoute, getCorners } from '../utils/drawHelpers'
import { saveAs } from 'file-saver'
import RouteHeader from './RouteHeader'
import ShareModal from './ShareModal'
import { Link } from 'react-router-dom'


const RouteViewing = (props) => {
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeRoute, setIncludeRoute] = useState(true);
  const [name, setName] = useState();
  const [togglingRoute, setTogglingRoute] = useState();
  const [togglingHeader, setTogglingHeader] = useState();
  const [imgData, setImgData] = useState()
  const [imgHR, setImgHR] = useState()
  const [imghR, setImghR] = useState()
  const [imgHr, setImgHr] = useState()
  const [imghr, setImghr] = useState()
  const [imgDataOut, setImgDataOut] = useState(null)
  let finalImage = React.createRef();


  React.useEffect(() => {
    if (!imgData) {
      return
    }
    const endToggling = () => {
      if (togglingHeader) {
        setTogglingHeader(false)
      }
      if (togglingRoute) {
        setTogglingRoute(false)
      }
    }
    if (includeHeader && includeRoute && imgHR) {
      setImgDataOut(imgHR)
      endToggling()
      return
    } else if (includeHeader && !includeRoute && imgHr) {
      setImgDataOut(imgHr)
      endToggling()
      return
    } else if (!includeHeader && includeRoute && imghR) {
      setImgDataOut(imghR)
      endToggling()
      return
    } else if (!includeHeader && !includeRoute && imghr) {
      setImgDataOut(imghr)
      endToggling()
      return
    }
    const canvas = drawRoute(
      imgData,
      props.mapCornersCoords,
      props.route,
      includeHeader,
      includeRoute
    );
    const url = canvas.toDataURL()
    setImgDataOut(url);
    if (includeHeader && includeRoute) {
      setImgHR(url)
    } else if (includeHeader && !includeRoute) {
      setImgHr(url)
    } else if (!includeHeader && includeRoute) {
      setImghR(url)
    } else if (!includeHeader && !includeRoute) {
      setImghr(url)
    }
  }, [imgData, imgHR, imghR, imgHr, imghr, includeHeader, includeRoute, props.mapCornersCoords, props.route, togglingHeader, togglingRoute])

  useEffect(() => {
    setName(props.name); 
  }, [props.name])

  useEffect(() => {   
    var img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function(){
        setImgData(this);
    };
    img.src = props.mapDataURL
  }, [props.mapDataURL])

  const round5 = v => {
    return Math.round(v*1e5)/1e5;
  }

  const printCornersCoords = (corners_coords, separator) => {
    return '' + round5(corners_coords.top_left.lat) + separator + round5(corners_coords.top_left.lon) +
      separator + round5(corners_coords.top_right.lat) + separator + round5(corners_coords.top_right.lon) +
      separator + round5(corners_coords.bottom_right.lat) + separator + round5(corners_coords.bottom_right.lon) +
      separator + round5(corners_coords.bottom_left.lat) + separator + round5(corners_coords.bottom_left.lon);
  }

  const downloadMapWithRoute = (e) => {
    const newCorners = getCorners(imgData, props.mapCornersCoords, props.route, includeHeader, includeRoute);
    const canvas = drawRoute(
      imgData,
      props.mapCornersCoords,
      props.route,
      includeHeader,
      includeRoute,
    )
    canvas.toBlob(function(blob) {
      saveAs(blob, name + '_' + (includeRoute ? '' : 'blank_') + printCornersCoords(newCorners, '_')+ '_.jpg');
    }, 'image/jpeg', 0.4)
  }

  const downloadGPX = (e) => {
    saveAs(props.gpx, name + '.gpx');
  }

  const onClickImg = (ev) => {
    finalImage.current.classList.toggle('final-image');
  }

  const toggleHeader = (ev) => {
    if (togglingHeader) {
      return
    }
    setImgDataOut(null)
    setIncludeHeader(!includeHeader);
    setTogglingHeader(true)
  }
  const toggleRoute = (ev) => {
    if (togglingRoute) {
      return
    }
    setImgDataOut(null)
    setIncludeRoute(!includeRoute);
    setTogglingRoute(true)
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
      {hasRouteTime() && <Link to={'/routes/' + props.id + '/player'}><button className="btn btn-sm btn-primary float-right" ><i className="fas fa-play"></i> Switch to Player View</button></Link>}
      <div>
        <button style={{marginBottom: '5px'}} className="btn btn-sm btn-warning" onClick={share}><i className="fas fa-share"></i> Share</button><br/>
        <button style={{marginBottom: '5px'}} className="btn btn-sm btn-success" onClick={downloadMapWithRoute}><i className="fas fa-download"></i> Download Map</button>&nbsp;
        <button style={{marginBottom: '5px'}} className="btn btn-sm btn-success" onClick={downloadGPX}><i className="fas fa-download"></i> Download GPX</button>
      </div>
      <button className="btn btn-sm btn-default" onClick={toggleHeader}><i className={togglingHeader ? "fa fa-spinner fa-spin" : ("fa fa-toggle-"+(includeHeader ? 'on': 'off'))}></i> Header</button>&nbsp;
      <button className="btn btn-sm btn-default" onClick={toggleRoute}><i className={togglingRoute ? "fa fa-spinner fa-spin":("fa fa-toggle-"+(includeRoute ? 'on': 'off'))}></i> Route</button>&nbsp;
      <div>
        {imgDataOut && <img ref={finalImage} className="final-image" src={imgDataOut} alt="route" onClick={onClickImg} style={{marginTop:'5px'}}/>}
        {!imgDataOut && <h3><i className="fa fa-spin fa-spinner"></i> Loading</h3>}
      </div>
      {shareModalOpen && <ShareModal url={document.location.href} onClose={()=>setShareModalOpen(false)}/> }
    </div>
  )
}

export default RouteViewing;
