import React, { useEffect, useState } from 'react'
import { drawRoute, getCorners } from '../utils/drawHelpers'
import { saveAs } from 'file-saver';
import useGlobalState from '../utils/useGlobalState'
import { Link } from 'react-router-dom'
import moment from 'moment';
import {Helmet} from "react-helmet";

const pkg = require('../../package.json');


const RouteViewing = (props) => {
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeRoute, setIncludeRoute] = useState(true);
  const [nameEditing, setNameEditing] = useState(false);
  const [name, setName] = useState();
  const [togglingRoute, setTogglingRoute] = useState();
  const [togglingHeader, setTogglingHeader] = useState();
  const [saving, setSaving] = useState(false)
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

  const printCornersCoords = (corners_coords, separator) => {
    return '' + round5(corners_coords.top_left.lat) + separator + round5(corners_coords.top_left.lon) +
      separator + round5(corners_coords.top_right.lat) + separator + round5(corners_coords.top_right.lon) +
      separator + round5(corners_coords.bottom_right.lat) + separator + round5(corners_coords.bottom_right.lon) +
      separator + round5(corners_coords.bottom_left.lat) + separator + round5(corners_coords.bottom_left.lon);
  }
  const save = async (newName) => {
    if(saving || !username) {
      return
    }
    setName(newName)
    const tkn = api_token
    setSaving(true)
    try {
      const response = await fetch(pkg.api_url+'/v1/route/'+props.id, {
        method: 'PATCH',
        headers: {
          'Authorization': 'Token ' + tkn,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({name: newName})
      });
      setSaving(false)
      if (response.status!==200) {
        window.alert('Something went wrong')
      }
    } catch (e) {
    }
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
    if (canEdit()) {
      setNameEditing(true);
    }
  }
  const canEdit = () => {
    return username === props.athlete.username
  }
  const saveName = async (e) => {
    setNameEditing(false);
    if(e.target.value !== name) {
      await save(e.target.value);
    }
  }
  const deleteMap = async () => {
    const conf = window.confirm('Are you sure?')
    if (conf) {
      await fetch(pkg.api_url+'/v1/route/'+props.id, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Token ' + api_token,
          'Content-Type': 'application/json'
        },
      });
      props.history.push("/");
    }
  }
  return (
    <div>
      <Helmet>
          <title>{"DrawMyRoute.com | " + name  + " by " + props.athlete.first_name + " " + props.athlete.last_name}</title>
          <meta name="description" content={"Map \""  + name + "\" by " + props.athlete.first_name + " " + props.athlete.last_name + " on DrawMyRoute.com"} />
      </Helmet>
      { (!canEdit() || !nameEditing) && <h2 onClick={enableNameEditing}><span className={("flag-icon flag-icon-"+props.country.toLowerCase())}></span> {name}{canEdit() && <> <i className="fas fa-pen"></i></>}</h2>}
      { canEdit() && nameEditing && <h2><span className={("flag-icon flag-icon-"+props.country.toLowerCase())}></span> <input type="text" maxLength={52} defaultValue={name} onBlur={saveName}/></h2>}
      <h4>by <Link to={'/athletes/'+props.athlete.username}>{props.athlete.first_name} {props.athlete.last_name}</Link> <small>{moment(props.startTime).utcOffset(props.tz).format('dddd, MMMM Do YYYY, HH:mm')}</small></h4>
      <button className="btn btn-sm btn-default" onClick={toggleHeader}><i className={togglingHeader ? "fa fa-spinner fa-spin" : ("fa fa-toggle-"+(includeHeader ? 'on': 'off'))}></i> Header</button>&nbsp;
      <button className="btn btn-sm btn-default" onClick={toggleRoute}><i className={togglingRoute ? "fa fa-spinner fa-spin":("fa fa-toggle-"+(includeRoute ? 'on': 'off'))}></i> Route</button>&nbsp;
      <button className="btn btn-sm btn-primary" onClick={downloadMapWithRoute}><i className="fas fa-download"></i> Download</button>&nbsp;
      {canEdit() && <button style={{float:'right'}}className="btn btn-sm btn-danger" onClick={deleteMap}><i className="fas fa-times"></i> Delete</button>}
      <div>
        <img ref={finalImage} className="final-image" src={imgDataOut} alt="route" onClick={onClickImg} style={{marginTop:'5px'}}/>
      </div>
    </div>
  )
}

export default RouteViewing;
