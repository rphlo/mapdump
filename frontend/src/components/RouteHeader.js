import React, { useEffect, useState } from 'react'
import {Helmet} from 'react-helmet'
import { Link } from 'react-router-dom'
import moment from 'moment';
import useGlobalState from '../utils/useGlobalState'

const RouteHeader = (props) => {  
  const [name, setName] = useState();
  const [nameEditing, setNameEditing] = useState(false);
  const [saving, setSaving] = useState(false)

  const globalState = useGlobalState()
  const { username, api_token } = globalState.user
  
  useEffect(() => {
    setName(props.name); 
  }, [props.name])

  const enableNameEditing = (ev) => {
    if (canEdit()) {
      setNameEditing(true);
    }
  }


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

  const deleteMap = async () => {
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
      { (!canEdit() || !nameEditing) && <h2 onClick={enableNameEditing}><span className={("flag-icon flag-icon-"+props.country.toLowerCase())}></span> {name}{canEdit() && <> <i className="fas fa-pen"></i></>}</h2>}
      { canEdit() && nameEditing && <h2><span className={("flag-icon flag-icon-"+props.country.toLowerCase())}></span> <input type="text" maxLength={52} defaultValue={name} onBlur={saveName}/> <i className="fas fa-pen"></i></h2>}
      <h4>by <Link to={'/athletes/'+props.athlete.username}>{props.athlete.first_name} {props.athlete.last_name}</Link> <small>{moment(props.startTime).utcOffset(props.tz).format('dddd, MMMM Do YYYY, HH:mm')}</small>{ canEdit() && <button style={{float:'right'}} className="btn btn-sm btn-danger" onClick={deleteMap}><i className="fas fa-times"></i> Delete Route</button>}</h4>
    </div>
  )
}

export default RouteHeader;
