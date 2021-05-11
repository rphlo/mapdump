import React from 'react';
import strava from 'strava-v3';
import { DateTime } from 'luxon';

import { printTime } from '../utils/drawHelpers';
import useGlobalState from '../utils/useGlobalState';
import logo from '../strava.png';


const Settings = (props) => {
    const globalState = useGlobalState()
    const { api_token } = globalState.user;
    const [stravaToken, setStravaToken] = React.useState();
    const [act, setAct] = React.useState([]);
    const [client, setClient] = React.useState();
    
    React.useEffect(() => {
        (async () => {
            if (api_token) {
                try {
                    const res = await fetch(process.env.REACT_APP_API_URL + '/v1/strava/token', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Token ' + api_token,
                        }
                    })
                    if (res.status === 401) {
                        throw new Error('not logged in')
                    }
                    const data = await res.json()
                    setStravaToken(data.strava_access_token)
                } catch (e) {
                    globalState.setUser({})
                }
            }
        })()
    }, [globalState, api_token])

    React.useEffect(() => {
        if (stravaToken) {
            setClient(new strava.client(stravaToken));
        }
    }, [stravaToken])

    const disconnect = async () => {
        await fetch(process.env.REACT_APP_API_URL + '/v1/strava/deauthorize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + api_token,
            }
        });
        setStravaToken(null);
    }

    React.useEffect(() => {
        (async () => {
            if(client) {
                try {
                    const routes = await client.athlete.listActivities({per_page: 10});
                    setAct(routes);
                } catch (e) {
                    disconnect()
                }
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client])

    if (!stravaToken) {
        const url = "https://www.strava.com/oauth/authorize";
        const qp = new URLSearchParams();
        qp.set('client_id', process.env.REACT_APP_STRAVA_CLIENT_ID);
        qp.set('redirect_uri', process.env.REACT_APP_API_URL + '/v1/strava/authorization?auth_token=' + api_token);
        qp.set('response_type', 'code');
        qp.set('approval_prompt', 'auto');
        qp.set('scope', 'activity:read,read');
        return (
            <a href={`${url}?${qp.toString()}`}>
              <img height="50px" src={logo} alt="With strava" />
            </a>
        )
    }

    const downloadGPX = async (a) => {
        const data = await client.streams.activity({id: a.id, types: ['time', 'latlng'], key_by_type: true});
        let times = null;
        let latlngs = null;
        for (let i = 0; i < data.length; i++) {
            if (data[i].type === 'time') {
             times = data[i].data
            }
            if (data[i].type === 'latlng') {
             latlngs = data[i].data
            }
        }
        if (latlngs.length === 0) {
            window.alert('This Strava activity does not contain a route.');
            return;
        }
        const startTime = +(new Date(a.start_date));
        const route = [];
        latlngs.forEach((pos, i)=>{
          route.push({time: startTime + ~~times[i]*1e3, latLon: pos})
        });
        props.onRouteDownloaded(a.id, a.name, route);
    }


    return (
        <>
            <img height="50px" src={logo} alt="With strava" /> <button className="btn btn-danger" onClick={disconnect}>disconnect</button>
            <table className="table table-striped table-hover">
                <thead className="thead-dark">
                    <tr>
                        <th scope="col">Start Date</th>
                        <th scope="col">Name</th>
                        <th scope="col">Duration</th>
                        <th scope="col">Distance</th>
                    </tr>
                </thead>
                <tbody style={{cursor:'pointer'}}>
                {act.map((a) => (
                    <tr key={a.id} onClick={() => downloadGPX(a)}>
                        <td>{DateTime.fromISO(a.start_date).toFormat('DDDD, T')}</td>
                        <td>{a.name}</td>
                        <td>{printTime(a.elapsed_time * 1e3)}{}</td>
                        <td>{(a.distance/1000).toFixed(1)}km</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </>
    )
}

export default Settings