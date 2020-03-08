import React, { useEffect, useState } from 'react'
import {Helmet} from 'react-helmet'
import { Link } from 'react-router-dom'
import moment from 'moment';
import useGlobalState from '../utils/useGlobalState'
import {printTime} from '../utils/drawHelpers'

const RouteHeader = (props) => {  
  const [name, setName] = useState()
  const [nameEditing, setNameEditing] = useState(false);
  const [saving, setSaving] = useState(false)
  const inputRef = React.useRef(null)
  const globalState = useGlobalState()
  const { username, api_token } = globalState.user
  
  useEffect(() => {
    setName(props.name); 
  }, [props.name])

  const enableNameEditing = (ev) => {
    ev.preventDefault()
    if (canEdit()) {
      setNameEditing(true);
    }
  }

  useEffect(() => {
    if (nameEditing) {
      inputRef.current.focus();
    }
  }, [nameEditing]);


  const save = async (newName) => {
    if(saving || !username) {
      return
    }
    setName(newName)
    const tkn = api_token
    setSaving(true)
    try {
      const response = await fetch(process.env.REACT_APP_API_URL+'/v1/route/'+props.id, {
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

  const canEdit = () => {
    return username === props.athlete.username
  }
  const saveName = async (e) => {
    setNameEditing(false);
    if(e.target.value !== name) {
      await save(e.target.value);
    }
  }

  const deleteMap = async (e) => {
    e.preventDefault()
    const conf = window.confirm('Are you sure?')
    if (conf) {
      await fetch(process.env.REACT_APP_API_URL+'/v1/route/'+props.id, {
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
          <title>{"DrawMyRoute.com | " + props.name  + " by " + props.athlete.first_name + " " + props.athlete.last_name}</title>
          <meta name="description" content={"Map \""  + props.name + "\" by " + props.athlete.first_name + " " + props.athlete.last_name + " on DrawMyRoute.com"} />
      </Helmet>
      <h2><span className={("flag-icon flag-icon-"+props.country.toLowerCase())}></span>&nbsp;
      { (!canEdit() || !nameEditing) && <>{name}</>}
      { canEdit() && nameEditing && <input ref={inputRef} type="text" maxLength={52} defaultValue={name} onBlur={saveName}/>}
      { canEdit() && <div className="btn-group float-right">
        <button type="button" className="btn btn-light" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i className="fas fa-ellipsis-v"></i>
        </button>
        <div className="dropdown-menu dropdown-menu-right">
          <a className={"dropdown-item" + (nameEditing ? ' disabled': '')} href="/#" onClick={enableNameEditing}><i className="fa fa-pen"></i> Edit</a>
          <div className="dropdown-divider"></div>
          <a className="dropdown-item" href="/#" onClick={deleteMap}><i className="fa fa-trash"></i> Delete</a>
        </div>
      </div>
      }
      </h2>
      <h4>by <Link to={'/athletes/'+props.athlete.username}>{props.athlete.first_name} {props.athlete.last_name}</Link> <small>{moment(props.startTime).utcOffset(props.tz).format('dddd, MMMM Do YYYY, HH:mm')}<br/>{(props.distance/1000).toFixed(1) + 'km'} {props.duration? printTime(props.duration*1000) : ''}</small></h4>
    </div>
  )
}

export default RouteHeader;
