import React from 'react'
import { Link } from 'react-router-dom'
import CalendarHeatmap from 'react-calendar-heatmap'
import ReactTooltip from 'react-tooltip'
import { DateTime } from 'luxon';
import {Helmet} from 'react-helmet'
import 'react-calendar-heatmap/dist/styles.css'
import LazyLoad from 'vanilla-lazyload'
import {printTime, printPace} from '../utils/drawHelpers'

const urls = ['new', 'map', 'sign-up', 'password-reset', 'verify-email', 'password-reset-confirmation', 'settings']

const UserView = ({match}) => {
    const [found, setFound] = React.useState(null)
    const [data, setData] = React.useState(null)

    React.useEffect(()=> {
        if (urls.includes(match.params.username)) {
            return 
        }
        (async ()=> {
            const res = await fetch(process.env.REACT_APP_API_URL + '/v1/user/' + match.params.username)
            if(res.status === 200){
                const rawData = await res.json()
                setData(rawData)
                setFound(true)
                if (!document.lazyLoadInstance) {
                    document.lazyLoadInstance = new LazyLoad();
                }
              document.lazyLoadInstance.update();
            } else if(res.status === 404){
                setFound(false)
            }
        })()
    }, [match])

    function shiftDate(date, numDays) {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + numDays);
        return newDate;
    }

    const getCalValues = () => {
        const val = [];
        let yesterday = new Date();
        for(let i=0; i < 365; i++) {
            // eslint-disable-next-line
            const count = data.routes.filter(r => DateTime.fromISO(r.start_time, {zone: r.tz}).toFormat('yyyyMMdd') === DateTime.fromMillis(+yesterday).toFormat('yyyyMMdd')).length
            val.push({date: new Date(+yesterday).toISOString(), count})
            yesterday = shiftDate(yesterday, -1)
        }
        return val
    }

    const getCountryStats = () => {
        const val = {}
        data.routes.forEach(r=>{
        if(val[r.country]) {
            val[r.country] += 1 
        } else {
            val[r.country] = 1 
        }
        })
        const res = []
        for (let [key, value] of Object.entries(val)) {
        res.push({country: key, count: value})
        }
        return res.sort((a,b) => a.count < b.count ? 1 : -1)
    }

    if (urls.includes(match.params.username)) {
        return null
    }
    return (
        <div className="container main-container">
        { found && data &&   
            <>
            <Helmet>
                <title>{"Karttamuovi.com | " + data.first_name + " " + data.last_name + " profile"}</title>
                <meta name="description" content={ data.first_name + " " + data.last_name + " profile on Karttamuovi.com"} />
                <link rel="alternate" type="application/rss+xml" title="RSS Feed" href={process.env.REACT_APP_API_URL + '/v1/user/' + match.params.username + '/feed/'} />
            </Helmet>
            <h2>{data.first_name + ' ' + data.last_name} <a href={process.env.REACT_APP_API_URL + '/v1/user/' + match.params.username + '/feed/'}><i className="fa fa-rss" title="RSS"></i></a></h2>
            <h5>@{data.username}</h5>
            <CalendarHeatmap
                startDate={shiftDate(new Date(), -365)}
                endDate={new Date()}
                values={getCalValues()}
                classForValue={value => {
                if (!value) {
                    return "color-empty";
                }
                return `color-github-${value.count}`;
                }}
                tooltipDataAttrs={value => {
                return {
                    "data-tip": `${value.date.slice(0, 10)} has ${value.count} route` + (value.count !== 1 ? 's' : '')
                };
                }}
                showWeekdayLabels={true}
            />
            <ReactTooltip />
            {
                getCountryStats().map(c => 
                <span key={c.country}><span className={("flag-icon flag-icon-"+c.country.toLowerCase())}></span> {c.count}</span>
                ).reduce((accu, elem, idx) => {
                return accu === null ? [elem] : [...accu, <> | </>, elem]
                }, null)
            }
            <hr/>
            <h3 data-testid="routeCount">{data.routes.length} Route{data.routes.length===1 ? '' : 's'}</h3>
            <div className="container">
                <div className="row">
                {data.routes.map(r=>(
                <div key={r.id} className="col-12 col-md-4"><div className="card">
                    <Link to={'/routes/'+r.id}><img className="card-img-top lazyload" src="/placeholder-image.png" data-src={r.map_thumbnail_url} alt="map thumbnail"></img></Link>
                    <div className="card-body">
                    <h5 className="card-title"><span className={("flag-icon flag-icon-"+r.country.toLowerCase())}></span> {r.name}</h5>
                    <p className="card-text">{DateTime.fromISO(r.start_time, {zone: r.tz}).toFormat('DDDD, T')}<br/>{(r.distance/1000).toFixed(1) + 'km'}{r.duration? ' - ' + printTime(r.duration*1000) : ''}{r.duration? ' - ' + printPace(r.duration/r.distance*1000) : ''}</p>                    </div>
                </div>
                </div>))}
                </div>
                </div>
            </>
        }
        { found === false && <h2>Not found</h2> }
        </div>
        );
    }

export default UserView