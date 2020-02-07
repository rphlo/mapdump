import React from 'react'
import { Link } from 'react-router-dom'
import CalendarHeatmap from 'react-calendar-heatmap'
import ReactTooltip from "react-tooltip"
import moment from 'moment';
import {Helmet} from "react-helmet";
import 'react-calendar-heatmap/dist/styles.css'
const pkg = require('../../package.json');

const urls = ['new', 'map', 'sign-up', 'password-reset', 'verify-email', 'password-reset-confirmation', 'settings']

const UserView = ({match}) => {
    const [found, setFound] = React.useState(null)
    const [data, setData] = React.useState(null)

    React.useEffect(()=> {
        if (urls.includes(match.params.username)) {
            return 
        }
        (async ()=> {
            const res = await fetch(pkg.api_url + '/v1/user/' + match.params.username)
            if(res.status === 200){
                const rawData = await res.json()
                setData(rawData)
                setFound(true)
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
        const count = data.routes.filter(r=>moment(r.start_time).zone(r.tz).format('YYYYMMDD') === moment(+yesterday).format('YYYYMMDD')).length
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
        <div>
        { found && data &&   
            <>
            <Helmet>
                <title>{"DrawMyRoute.com | " + data.first_name + " " + data.last_name + " profile"}</title>
                <meta name="description" content={ data.first_name + " " + data.last_name + " profile on DrawMyRoute.com"} />
            </Helmet>
            <h2>{data.first_name + ' ' + data.last_name}</h2>
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
            <h3>{data.routes.length} Route{data.routes.length===1?'':'s'}</h3>
            <div className="container">
                <div className="row">
                {data.routes.map(r=>(
                <div key={r.id} className="col-12 col-md-4"><div className="card">
                    <Link to={'/map/'+r.id}><img className="card-img" src={r.map_thumbnail_url} alt="map thumbnail"></img></Link>
                    <div className="card-body">
                    <h5 className="card-title"><span className={("flag-icon flag-icon-"+r.country.toLowerCase())}></span> {r.name}</h5>
                    <p className="card-text">{moment(r.start_time).utcOffset(r.tz).format('dddd, MMMM Do YYYY, HH:mm')}</p>
                    </div>
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