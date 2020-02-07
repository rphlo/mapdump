import React from 'react'
import { Link } from 'react-router-dom'
import moment from 'moment';

const pkg = require('../../package.json');

const LatestRoute = () => {
    const [routes, setRoutes] = React.useState([])

    React.useEffect(() => {
        (async () => {
            const res = await fetch(pkg.api_url + '/v1/latest-routes/')
            setRoutes(await res.json())
        })()
    }, [])
    
    return (
        <>
        <h3>Latest Routes</h3>
        <div className="container" style={{textAlign: 'left'}}>
            <div className="row">
                {routes.map(r=>(
                    <div key={r.id} className="col-12 col-md-4"><div className="card">
                        <Link to={'/map/'+r.id}><img className="card-img" src={r.map_thumbnail_url} alt="map thumbnail"></img></Link>
                        <div className="card-body">
                        <h5 className="card-title"><span className={("flag-icon flag-icon-"+r.country.toLowerCase())}></span> {r.name}</h5>
                        <p className="card-text">By <Link to={'/'+r.athlete.username}>{r.athlete.first_name} {r.athlete.last_name}</Link></p>
                        <p className="card-text">{moment(r.start_time).utcOffset(r.tz).format('dddd, MMMM Do YYYY, HH:mm')}</p>
                        </div>
                    </div>
                </div>))}
            </div>
        </div>
        </>
    ) 
}

export default LatestRoute