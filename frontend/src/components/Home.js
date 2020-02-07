
import React from 'react'
import { Link } from 'react-router-dom'
import useGlobalState from '../utils/useGlobalState'
import LatestRoutes from './LatestRoutes'

const Home = () => {
    const globalState = useGlobalState()
    const { username } = globalState.user
    return (
    <div style={{textAlign:'center'}} >
      <Link to="/new"><button className="btn btn-primary"><i className="fas fa-plus"></i> Create New Route</button></Link>
      {username && <><hr/>
      <Link to={'/'+username}><button className="btn btn-primary"><i className="fas fa-link"></i> Your routes</button></Link>
      </>}
      <hr/>
      <LatestRoutes/>
    </div>
    )
}

export default Home