import React from 'react'
import PasswordChange from './PasswordChange'
import UserSettings from './UserSettings'
import useGlobalState from '../utils/useGlobalState'

const Settings = ({history}) => {
    const globalState = useGlobalState()
    const { username } = globalState.user
    
    React.useEffect(()=>{
        if (!username) {
            history.push('/')
        }
    }, [username, history])

    return (
        <>
         <h1><i className="fas fa-user-cog"></i> Settings</h1>
         <hr/>
         <UserSettings/>
         <hr/>
         <PasswordChange/>
        </>
    )
}

export default Settings