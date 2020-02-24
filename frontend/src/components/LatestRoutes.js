import React from 'react'
import { Link } from 'react-router-dom'
import moment from 'moment';

const LatestRoute = () => {
    const [routes, setRoutes] = React.useState([])

    React.useEffect(() => {
        (async () => {
            const res = await fetch(process.env.REACT_APP_API_URL + '/v1/latest-routes/')
            setRoutes(await res.json())
        })()
    }, [])
    
    return (
      <>
        <h3>Latest Routes</h3>
        <div className="container" style={{textAlign: 'left'}}>
            {!routes.length ? 
               (
                  <div style={{textAlign: 'center'}}><span>No routes have been yet uploaded...</span></div>
                ) : (
                  <div className="row">
                    {routes.map(r=>(
                    <div key={r.id} className="col-12 col-md-4">
                      <div className="card">
                        <Link to={'/routes/'+r.id}><img className="card-img" src={r.map_thumbnail_url} alt="map thumbnail"></img></Link>
                        <div className="card-body">
                          <h5 className="card-title"><span className={("flag-icon flag-icon-"+r.country.toLowerCase())}></span> {r.name}</h5>
                          <p className="card-text">By <Link to={'/athletes/'+r.athlete.username}>{r.athlete.first_name} {r.athlete.last_name}</Link></p>
                          <p className="card-text">{moment(r.start_time).utcOffset(r.tz).format('dddd, MMMM Do YYYY, HH:mm')}</p>
                        </div>
                      </div>
                    </div>))}
                  </div>
                )   
            }
        </div>
      </>
    ) 
}

export default LatestRoute