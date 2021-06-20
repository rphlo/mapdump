import React from 'react'
import { Link } from 'react-router-dom'
import { DateTime } from 'luxon';
import LazyLoad from 'vanilla-lazyload'
import {printPace, printTime} from '../utils/drawHelpers'
import {capitalizeFirstLetter} from '../utils/Utils'

const LatestRoute = () => {
    const [routes, setRoutes] = React.useState(false)


    React.useEffect(() => {
        (async () => {
            const res = await fetch(process.env.REACT_APP_API_URL + '/v1/latest-routes/')
            setRoutes(await res.json())
            if (!document.lazyLoadInstance) {
              document.lazyLoadInstance = new LazyLoad();
            }
            document.lazyLoadInstance.update();
        })()
    }, [])
    
    return (
      <>
        <h3>Latest Routes <a href={process.env.REACT_APP_API_URL + '/v1/latest-routes/feed/'}><i className="fa fa-rss" title="RSS"></i></a></h3>
        <div className="container" style={{textAlign: 'left'}}>
            { routes === false && <div style={{textAlign: 'center'}}><span><i className="fa fa-spinner fa-spin"></i> Loading</span></div>}
            { routes && (!routes.length ? 
               (
                  <div style={{textAlign: 'center'}}><span>No routes have been yet uploaded...</span></div>
                ) : (
                  <div className="row">
                    {routes.map(r=>(
                    <div key={r.id} className="col-12 col-md-4">
                      <div className="card">
                        <Link to={'/routes/'+r.id}><img className="card-img-top lazyload" src="/static/placeholder-image.png" data-src={r.map_thumbnail_url} alt="map thumbnail" width="500" height="auto"></img></Link>
                        <div className="card-body">
                          <h5 className="card-title"><span className={("flag-icon flag-icon-"+r.country.toLowerCase())}></span> {r.name}</h5>
                          <p className="card-text">{DateTime.fromISO(r.start_time, {zone: r.tz}).toFormat('DDDD, T')}<br/>{(r.distance/1000).toFixed(1) + 'km'}{r.duration? ' - ' + printTime(r.duration*1000) : ''}{r.duration? ' - ' + printPace(r.duration/r.distance*1000) : ''}</p>
                          <p className="card-text">By <Link to={'/athletes/'+r.athlete.username}>{capitalizeFirstLetter(r.athlete.first_name)} {capitalizeFirstLetter(r.athlete.last_name)}</Link></p>
                        </div>
                      </div>
                    </div>))}
                  </div>
                )   
            )}
        </div>
      </>
    ) 
}

export default LatestRoute