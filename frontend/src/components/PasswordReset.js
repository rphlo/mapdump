import React from 'react'
import useGlobalState from '../utils/useGlobalState'

const PasswordReset = (props) => {
    const globalState = useGlobalState()
    const { username } = globalState.user
    const [email, setEmail] = React.useState()
    const [sent, setSent] = React.useState()
    const [errors, setErrors] = React.useState({})
  
    React.useEffect(()=>{
        if (username) {
            props.history.push('/')
        }
    }, [props, username])
  
    const onSubmit = async (e) => {
      e.preventDefault()
      const res = await fetch(process.env.REACT_APP_API_URL+'/v1/auth/password/reset/', {
        method: 'POST',headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({email})
      })
      if(res.status === 400) {
        const data = await res.json()
        setErrors(data)
      } else if (res.status === 200) {
        setSent(true)
      }
    }
    return (
      <div>
        { !sent && <><h1><i className="fas fa-question"></i> Forgot Password</h1><hr/><form onSubmit={onSubmit}>
            {errors.non_field_errors && errors.non_field_errors.map(e=>
                <div className="alert alert-danger" role="alert">
                    {e}
                </div>
            )}
            <div className={"form-group"}>
                <label htmlFor="email"><i className="fas fa-at"></i> Email</label>
                <input onChange={(e)=>{setEmail(e.target.value)}} type="email" className={"form-control" + (errors.email ? ' is-invalid' : '')} id="email" name="email" placeholder="Email"/>
                {errors.email && (<div className="invalid-feedback">
                    {errors.email}
                </div>)}
            </div>
            <button type="submit" className="btn btn-primary btn-block"><i className="fas fa-paper-plane"></i> Send</button>
        </form></>}
        {sent && (
            <div className="alert alert-success" role="alert">
            Success! We send you an email!
            </div>)
        }
      </div>
    )
  }
  
  export default PasswordReset