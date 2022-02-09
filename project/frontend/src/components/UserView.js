import React from 'react'
import {Helmet} from 'react-helmet'
import { Link } from 'react-router-dom'
import CalendarHeatmap from 'react-calendar-heatmap'
import ReactTooltip from 'react-tooltip'
import { DateTime } from 'luxon';
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import 'react-calendar-heatmap/dist/styles.css'
import LazyLoad from 'vanilla-lazyload'
import NotFound from './NotFound'
import {printTime, printPace} from '../utils/drawHelpers'
import {capitalizeFirstLetter} from '../utils/Utils'
import useGlobalState from '../utils/useGlobalState'
import { getCorners } from '../utils/drawHelpers'
import { getKMZ } from '../utils/fileHelpers'

const urls = ['new', 'map', 'sign-up', 'password-reset', 'verify-email', 'password-reset-confirmation', 'settings', 'account-deletion-confirmation']

const UserView = ({match, history}) => {
    const [found, setFound] = React.useState(null)
    const [data, setData] = React.useState(null)
    const [routes, setRoutes] = React.useState([])
    const [dl, setDl] = React.useState(null)

    const globalState = useGlobalState()
    const { username } = globalState.user

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


    React.useEffect(()=> {
        if(data?.routes) {
            if (match.params.date) {
                setRoutes(data.routes.filter((r) => DateTime.fromISO(r.start_time, {zone: r.tz}).toFormat('yyyy-MM-dd') === match.params.date))
            } else {
                setRoutes(data.routes)
            }
        }
    }, [match.params.date, data?.routes])

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
        routes.forEach(r=>{
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
    const transformMapBounds = (v) => {
        return {
            top_left: {lat: parseFloat(v.top_left[0]), lon: parseFloat(v.top_left[1])},
            top_right: {lat: parseFloat(v.top_right[0]), lon: parseFloat(v.top_right[1])},
            bottom_right: {lat: parseFloat(v.bottom_right[0]), lon: parseFloat(v.bottom_right[1])},
            bottom_left: {lat: parseFloat(v.bottom_left[0]), lon: parseFloat(v.bottom_left[1])}
        }
    }
    const downloadOwnData = async () => {
        const z = new JSZip()
        setDl(0)
        await Promise.all(routes.map(async (r)=>{
            const jsonData = await fetch(r.url).then(r => r.json())
            const gpx = await fetch(jsonData.gpx_url).then(r => r.blob())
            setDl(prevCount => prevCount + 1/3)
            const kmz = await fetch(jsonData.map_url).then(r => r.blob()).then(blob => {
                const newCorners = getCorners(jsonData.map_size, transformMapBounds(jsonData.map_bounds), [], false, false);
                const kmz_raw = getKMZ(jsonData.name, newCorners, blob);
                return kmz_raw.generateAsync({type:"blob", mimeType: 'application/vnd.google-earth.kmz'})
            });
            setDl(prevCount => prevCount + 1/3)
            const img = await fetch(jsonData.map_url + '?show_route=1&show_header=1').then(r => r.blob())
            setDl(prevCount => prevCount + 1/3)
            const folderName = r.name + ' ' + r.id
            z.folder(folderName)
            z.file(folderName + '/route.gpx', gpx)
            z.file(folderName + '/map.kmz', kmz)
            z.file(folderName + '/map+route.jpg', img)
            z.file(folderName + '/data.json', JSON.stringify(jsonData, null, '    '))
            
        }))
        z.generateAsync({type:"blob"})
        .then(function (blob) {
            saveAs(blob, `mapdump_${username}.zip`);
        });
        setDl(null)
    }

    if (urls.includes(match.params.username)) {
        return null
    }

    return (
        <>
        { found && data &&
        <div className="container main-container">
            <Helmet>
                <title>{capitalizeFirstLetter(data.first_name) + " " + capitalizeFirstLetter(data.last_name) +  " Maps on "+ DateTime.fromISO(match.params.date, { setZone: false }).toFormat('DDDD') +" | Mapdump.com"}</title>
            </Helmet>
            <h2><Link to={`/athletes/${data.username}`} >{capitalizeFirstLetter(data.first_name) + " " + capitalizeFirstLetter(data.last_name)}</Link> <a href={process.env.REACT_APP_API_URL + '/v1/user/' + match.params.username + '/feed/'}><i className="fa fa-rss" title="RSS"></i></a></h2>
            <h5>@{data.username}</h5>
            { username === data.username && (<div>
                { dl === null && <button class="btn btn-primary" onClick={downloadOwnData}><i class="fa fa-download"></i> Download All Routes</button>}
                { dl !== null &&  <span class="badge bg-info text-light">Preparing archive {Math.min(100, Math.round(dl/routes.length * 100))}%</span>}
            </div>)}
            {<>
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
                onClick={(v)=>{if (v.count) {history.push(`/athletes/${data.username}/${v.date.substring(0, 10)}`)}}}
            />
            <ReactTooltip /></>
            }
            { match.params.date ? <h3>Routes on {DateTime.fromISO(match.params.date, { setZone: false }).toFormat('DDDD')}</h3> : <h3>All Routes</h3>}
            {
                getCountryStats().map(c => 
                <span key={c.country}><span className={("flag-icon flag-icon-"+c.country.toLowerCase())}></span> {c.count}</span>
                ).reduce((accu, elem, idx) => {
                return accu === null ? [elem] : [...accu, <> | </>, elem]
                }, null)
            }
            <hr/>
            <h3 data-testid="routeCount">{routes.length} Route{routes.length===1 ? '' : 's'}</h3>
            <div className="container">
                <div className="row">
                {routes.map(r=>(
                <div key={r.id} className="col-12 col-md-4"><div className="card">
                    <Link to={'/routes/'+r.id}><img className="card-img-top lazyload" src="/static/placeholder-image.png" data-src={r.map_thumbnail_url} alt="map thumbnail"></img></Link>
                    <div className="card-body">
                    <h5 className="card-title"><span className={("flag-icon flag-icon-"+r.country.toLowerCase())}></span> {r.name}</h5>
                    <p className="card-text">{DateTime.fromISO(r.start_time, {zone: r.tz}).toFormat('DDDD, T')}<br/>{(r.distance/1000).toFixed(1) + 'km'}{r.duration? ' - ' + printTime(r.duration*1000) : ''}{r.duration? ' - ' + printPace(r.duration/r.distance*1000) : ''}</p>                    </div>
                </div>
                </div>))}
                </div>
            </div>
        </div>
        }
        { found === false && <NotFound/> }
        </>
        );
    }

export default UserView