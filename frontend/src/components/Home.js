import React from 'react'
import { Link } from 'react-router-dom'
import useGlobalState from '../utils/useGlobalState'
import LatestRoutes from './LatestRoutes'

const Home = () => {
    const globalState = useGlobalState()
    const { username } = globalState.user
    return (
    <div style={{textAlign:'center'}} >
      <div class="alert alert-warning">
        <p><i class="fa fa-warning"></i> DrawMyRoute is a open source project, available to all for free, and hosted by vonlunteer.</p>
        <p>You can help contribute to the payment of the cost of hosting this solution through monthly donations.</p>
        <p>Follow this link if you want to contribute <a href="https://github.com/sponsors/rphlo"><i class="fa fa-heart"></i> Github Sponsor</a></p>
      </div>
      <hr/>
      <Link to="/new"><button className="btn btn-primary"><i className="fas fa-plus"></i> Create New Route</button></Link>
      {username && <><hr/>
      <Link to={'/athletes/'+username}><button className="btn btn-primary"><i className="fas fa-link"></i> Your routes</button></Link>
      </>}
      <hr/>
      <LatestRoutes/>
    </div>
    )
}

export default Home