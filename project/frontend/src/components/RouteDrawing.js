import React, { useEffect, useState, createRef } from 'react'
import Swal from 'sweetalert2'
import { saveAs } from 'file-saver';
import * as Panelbear from '@panelbear/panelbear-js'
import { drawRoute, drawOriginalMap, getCorners, scaleImage } from '../utils/drawHelpers'
import useGlobalState from '../utils/useGlobalState'
import { saveKMZ } from '../utils/fileHelpers'

const RouteDrawing = (props) => {
  const [name, setName] = useState();
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeRoute, setIncludeRoute] = useState(true);
  const [togglingRoute, setTogglingRoute] = useState();
  const [rotating, setRotating] = useState();
  const [togglingHeader, setTogglingHeader] = useState();
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false);
  const [imgData, setImgData] = useState()
  const [imgURL, setImgURL] = useState(null)
  const [zoom, setZoom] = useState(100)
  const [bounds, setBounds] = useState(props.mapCornersCoords) 
  const [redraw, setRedraw] = useState(true)

  let finalImage = createRef();

  const globalState = useGlobalState()
  const { username, api_token } = globalState.user

 useEffect(() => {
  Panelbear.track('map_generated');
 }, [])

 useEffect(() => {
    if (!imgData) {
      return
    }
    if (redraw) {
      const canvas = drawRoute(
        imgData,
        bounds,
        props.route,
        includeHeader,
        includeRoute
      );
      const imgURL = canvas.toDataURL()
      setImgURL(imgURL);
      setTogglingRoute(false);
      setTogglingHeader(false);
      setRotating(false);
      setRedraw(false);
    }
  }, [imgData, bounds, includeHeader, includeRoute, props.route, redraw])

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

  const formatMapBounds = (b) => {
    return JSON.stringify({
      top_left: [b.top_left.lat, b.top_left.lon],
      top_right: [b.top_right.lat, b.top_right.lon],
      bottom_right: [b.bottom_right.lat, b.bottom_right.lon],
      bottom_left: [b.bottom_left.lat, b.bottom_left.lon],
    })
  }
  const formatRoute = (r) => {
    return JSON.stringify(r.map(p=>{return {time: (+p.time)/1e3, latlon: p.latLon}}))
  }

  const printCornersCoords = (corners_coords, separator) => {
    return '' + round5(corners_coords.top_left.lat) + separator + round5(corners_coords.top_left.lon) +
      separator + round5(corners_coords.top_right.lat) + separator + round5(corners_coords.top_right.lon) +
      separator + round5(corners_coords.bottom_right.lat) + separator + round5(corners_coords.bottom_right.lon) +
      separator + round5(corners_coords.bottom_left.lat) + separator + round5(corners_coords.bottom_left.lon);
  }

  const rotate = () => {
    if (rotating) {
      return
    }
    setRotating(true)
    let imgOrig = imgData;
    const mWidth = imgOrig.width
    const mHeight = imgOrig.height
    const MAX = 3000
    
    if (mHeight > MAX || mWidth > MAX) {
      imgOrig = scaleImage(imgOrig, MAX / Math.max(mHeight, mWidth))
    }

    let canvas = document.createElement('canvas');
    canvas.width  = imgOrig.height;
    canvas.height = imgOrig.width;
    const ctx = canvas.getContext('2d');
    ctx.rotate(90 * Math.PI / 180);
    ctx.drawImage(imgOrig, 0, -imgOrig.height);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function(){
        setBounds({top_left: bounds.bottom_left, top_right: bounds.top_left, bottom_right: bounds.top_right, bottom_left: bounds.bottom_right});
        setImgData(this);
        setRedraw(true);
    };
    const dataURL = canvas.toDataURL('image/png');
    img.src = dataURL;
  }

  const onExport = async (e) => {
    if(saving || !username) {
      return
    }
    const tkn = api_token
    setSaving(true)

    const mWidth = imgData.width
    const mHeight = imgData.height
    const MAX = 3000
    let canvas = null;
    if (mHeight > MAX || mWidth > MAX) {
      canvas = scaleImage(imgData, MAX / Math.max(mHeight, mWidth))
    } else {
      canvas = drawOriginalMap(imgData)
    }
    const comment = `${
      props.stravaDetails.description || ''
    }${
      props.stravaDetails.description && props.stravaDetails.id ? '\r\n\r\n' : ''
    }${
      props.stravaDetails.id ? `https://www.strava.com/activities/${props.stravaDetails.id}` : ''
    }`
    
    fetch(canvas.toDataURL('image/jpeg', 0.8))
    .then(res => res.blob())
    .then(async blob => {
      const fd = new FormData();
      fd.append('map_image', blob, name + '.jpg') 
      fd.append('map_bounds', formatMapBounds(bounds));
      fd.append('route_data', formatRoute(props.route));
      fd.append('name', name);
      fd.append('comment', comment);
      try {
        const response = await fetch(process.env.REACT_APP_API_URL+'/v1/routes/new', {
          method: 'POST',
          credentials: 'omit',
          headers: {
            'Authorization': 'Token ' + tkn
          },
          body: fd
        });
        setSaving(false)
        if (response.status===200 || response.status===201) {
          const res = await response.json(); // parses JSON response into native JavaScript objects
          
          if (props.stravaDetails.client) {
            const description = `${
              props.stravaDetails.description || ''
            }${
              props.stravaDetails.description && res.id ? '\r\n\r\n' : ''
            }${
              res.id ? `https://karttamuovi.com/routes/${res.id}` : ''
            }`
            await props.stravaDetails.client.activities.update({id: props.stravaDetails.id, description})
          }
          setSaved(res.id)
          window.location = '/routes/'+res.id
        } else {
          throw new Error('not ok status')
        }
      } catch (e) {
        setSaving(false)
        Swal.fire({
          title: 'Error!',
          text: 'Something went wrong!',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    })
  }

  const downloadMapWithRoute = (e) => {
    const newCorners = getCorners(imgData, bounds, props.route, includeHeader, includeRoute);
    const canvas = drawRoute(
      imgData,
      bounds,
      props.route,
      includeHeader,
      includeRoute,
    )
    canvas.toBlob(function(blob) {
      saveAs(blob, name + '_' + (includeRoute ? '' : 'blank_') + printCornersCoords(newCorners, '_')+ '_.jpg');
    }, 'image/jpeg', 0.8)
  }

  const downloadKmz = (e) => {
    const newCorners = getCorners(imgData, bounds, [], false, false);
    const canvas = drawRoute(imgData, bounds, [], false, false)
    canvas.toBlob(function(blob) {
      saveKMZ(name + '_blank.kmz', name, newCorners, blob);
    }, 'image/jpeg', 0.8)
  }

  const toggleHeader = (ev) => {
    if (togglingHeader) {
      return
    }
    setIncludeHeader(!includeHeader);
    setTogglingHeader(true)
    setRedraw(true);
  }

  const toggleRoute = (ev) => {
    if (togglingRoute) {
      return
    }
    setIncludeRoute(!includeRoute);
    setTogglingRoute(true)
    setRedraw(true);
  }

  const zoomOut = () => {
    setZoom(zoom - 10)
  }

  const zoomIn = () => {
    setZoom(zoom + 10)
  }

  return (
    <>
    <div className="container main-container">
      <h2><input type="text" data-testid="nameInput" maxLength={52} defaultValue={name} onChange={(e)=>setName(e.target.value)}/></h2>
      <div>
        <button style={{marginBottom: '5px'}} className="btn btn-sm btn-success" onClick={downloadMapWithRoute}><i className="fas fa-download"></i> JPEG {`(Map${includeRoute ? ' w/ Route': ''})`}</button>&nbsp;
        <button style={{marginBottom: '5px'}} className="btn btn-sm btn-success" onClick={downloadKmz}><i className="fas fa-download"></i> KMZ (Map)</button>
      </div>
      <button className="btn btn-sm btn-default" onClick={zoomIn}><i className={"fa fa-plus"}></i></button>&nbsp;
      <button className="btn btn-sm btn-default" onClick={zoomOut}><i className={"fa fa-minus"}></i></button>&nbsp;
      <button className="btn btn-sm btn-default" onClick={toggleHeader}><i className={togglingHeader ? "fa fa-spinner fa-spin" : ("fa fa-toggle-"+(includeHeader ? 'on': 'off'))}></i> Header</button>&nbsp;
      <button className="btn btn-sm btn-default" onClick={toggleRoute}><i className={togglingRoute ? "fa fa-spinner fa-spin":("fa fa-toggle-"+(includeRoute ? 'on': 'off'))}></i> Route</button>&nbsp;
      <button className="btn btn-sm btn-default" onClick={rotate}><i className={rotating ? "fa fa-spinner fa-spin":"fa fa-sync"}></i> Rotate</button>&nbsp;

      {!saved && username && <><button data-testid="saveBtn" style={{float:'right'}} className="btn btn-sm btn-primary" onClick={onExport}><i className={saving ? "fa fa-spinner fa-spin" : "fas fa-save"}></i> Save</button>&nbsp;</>}
    </div>
    <div className="container-fluid">
      {imgURL && <center><img ref={finalImage} className="final-image" src={imgURL} alt="route" onClick={toggleRoute} style={{marginTop:'5px', width: zoom + '%'}}/></center>}
      {!imgURL && <h3><i className="fa fa-spin fa-spinner"></i> Loading</h3>}
    </div>
    </>
  )
}

export default RouteDrawing;
