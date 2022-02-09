import React from 'react'
import useGlobalState from '../utils/useGlobalState'

const Register = (props) => {
    const globalState = useGlobalState()
    const { username } = globalState.user
    const [sent, setSent] = React.useState(false)
    const [errors, setErrors] = React.useState({})
  
    React.useEffect(()=>{
        if (!username) {
            props.history.push('/')
        }
    }, [username, props])
  
    const onSubmit = async (e) => {
      e.preventDefault()
      const confirmationKey = props.match.params.key
      const res = await fetch(process.env.REACT_APP_API_URL+'/v1/auth/user/', {
        method: 'DELETE',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({confirmation_key: confirmationKey})
      })
      if(res.status === 400) {
        const data = await res.json()
        setErrors(data)
      } else if (res.status === 200) {
        setSent(true)
        globalState.setUser({})
      }
    }
    return (
      <div className="container main-container">
        { !sent && <>
          <h1><i className="fas fa-key"></i> Delete Account</h1><hr/>
            {errors.token && (
                <div className="alert alert-danger" role="alert">
                    Invalid token.
                </div>
            )}
            <form onSubmit={onSubmit}>
            <button type="submit" className="btn btn-primary"><i className="fas fa-paper-plane"></i> Delete Account</button>
        </form>
        </>}
        {sent && (
            <div className="alert alert-success" role="alert">
            Success! Account deleted!
            </div>)
        }
      </div>
    )
  }
  
  export default Register