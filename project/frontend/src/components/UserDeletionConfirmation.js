import React from 'react'
import useGlobalState from '../utils/useGlobalState'
import Swal from 'sweetalert2'

const Register = (props) => {
    const globalState = useGlobalState()
    const { username, api_token} = globalState.user
    const [sent, setSent] = React.useState(false)
    const [errors, setErrors] = React.useState({})
  
    React.useEffect(()=>{
        if (!username) {
          (async ()=>{
            await Swal.fire({
              title: 'Please login!',
              text: 'You need to be login to perform this action!',
              icon: 'error',
              confirmButtonText: 'OK'
            });
            props.history.push('/')
          })()
        }
    }, [username, props])
  
    const onSubmit = async (e) => {
      e.preventDefault()
      const confirmationKey = props.match.params.key
      const res = await fetch(process.env.REACT_APP_API_URL+'/v1/auth/user/', {
        method: 'DELETE',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + api_token,
        },
        body: JSON.stringify({confirmation_key: confirmationKey})
      })
      if(res.status === 400) {
        const data = await res.json()
        setErrors(data)
      } else if (res.status === 200) {
        setSent(true)
        await Swal.fire({
          title: 'Account deleted!',
          text: 'Your account has been deleted!',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        globalState.setUser({})
      }
    }
    return (
      <div className="container main-container">
        { !sent && <>
          <h1><i className="fas fa-trash"></i> Delete Account</h1><hr/>
            {errors.token && (
                <div className="alert alert-danger" role="alert">
                    Invalid token.
                </div>
            )}
            <form onSubmit={onSubmit}>
            <button type="submit" className="btn btn-danger"><i className="fas fa-trash"></i> Delete Account</button>
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