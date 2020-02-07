import React, { useEffect, useState } from 'react'
import { drawRoute, drawOriginalMap, getCorners } from '../utils/drawHelpers'
import { saveAs } from 'file-saver';
import useGlobalState from '../utils/useGlobalState'
const pkg = require('../../package.json');


const RouteDrawing = (props) => {
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeRoute, setIncludeRoute] = useState(true);
  const [nameEditing, setNameEditing] = useState(false);
  const [name, setName] = useState();
  const [togglingRoute, setTogglingRoute] = useState();
  const [togglingHeader, setTogglingHeader] = useState();
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false);
  const [imgData, setImgData] = useState()
  const [imgHR, setImgHR] = useState()
  const [imghR, setImghR] = useState()
  const [imgHr, setImgHr] = useState()
  const [imghr, setImghr] = useState()
  const [imgDataOut, setImgDataOut] = useState('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')
  let finalImage = React.createRef();


  const globalState = useGlobalState()
  const { username, api_token } = globalState.user

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
  const onExport = async (e) => {
    if(saving || !username) {
      return
    }
    const tkn = api_token
    setSaving(true)
    const canvas = drawOriginalMap(
      imgData,
      false
    )
    canvas.toBlob(async (blob) => {
      var fd = new FormData();
      fd.append('map_image', blob, name + '.jpg') 
      fd.append('map_bounds', formatMapBounds(props.mapCornersCoords));
      fd.append('route_data', formatRoute(props.route));
      fd.append('name', name);
      try {
        const response = await fetch(pkg.api_url+'/v1/routes/new', {
          method: 'POST',
          headers: {
            'Authorization': 'Token ' + tkn
          },
          body: fd
        });
        setSaving(false)
        if (response.status===200 || response.status===201) {
          const res = await response.json(); // parses JSON response into native JavaScript objects
          setSaved(res.id)
          window.location = '/map/'+res.id
        } else {
          window.alert('Something went wrong')
        }
      } catch (e) {
        setSaving(false)
        window.alert('Something went wrong')
      }
    }, 'image/jpeg', 0.4)
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

  const onClickImg = (ev) => {
    finalImage.current.classList.toggle('final-image');
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
  const enableNameEditing = (ev) => {
    if (props.editMode) {
      setNameEditing(true);
    }
  }
  const disableNameEditing = (ev) => {
    setName(ev.target.value);
    setNameEditing(false);
  }
  return (
    <div>
      { !nameEditing && <h2 onClick={enableNameEditing}>{name}{props.editMode && <> <i className="fas fa-pen"></i></>}</h2>}
      { nameEditing && <h2 ><input onBlur={disableNameEditing} type="text" maxLength={52} defaultValue={name} onChange={setName}/></h2>}

      <button className="btn btn-sm btn-default" onClick={toggleHeader}><i className={togglingHeader ? "fa fa-spinner fa-spin" : ("fa fa-toggle-"+(includeHeader ? 'on': 'off'))}></i> Header</button>&nbsp;
      <button className="btn btn-sm btn-default" onClick={toggleRoute}><i className={togglingRoute ? "fa fa-spinner fa-spin":("fa fa-toggle-"+(includeRoute ? 'on': 'off'))}></i> Route</button>&nbsp;
      <button className="btn btn-sm btn-primary" onClick={downloadMapWithRoute}><i className="fas fa-download"></i> Download</button>&nbsp;
      {props.editMode && !saved && username && <><button style={{float:'right'}} className="btn btn-sm btn-success" onClick={onExport}><i className={saving ? "fa fa-spinner fa-spin" : "fas fa-save"}></i> Save</button>&nbsp;</>}
      <div>
        <img ref={finalImage} className="final-image" src={imgDataOut} alt="route" onClick={onClickImg} style={{marginTop:'5px'}}/>
      </div>
    </div>
  )
}

export default RouteDrawing;
