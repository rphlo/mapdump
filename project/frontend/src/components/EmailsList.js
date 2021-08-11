
import React from 'react'
import useGlobalState from '../utils/useGlobalState'
import Swal from 'sweetalert2'

const EmailItem = (props) => {
  const [resent, setResent] = React.useState(false);
  const globalState = useGlobalState();
  const { api_token } = globalState.user;
  const {email, primary, verified, onUpdate} = props;

  const makePrimary = async (e) => {
    e.preventDefault();
    const res = await fetch(process.env.REACT_APP_API_URL + '/v1/auth/emails/' + email, {
      method: 'PATCH',
      credentials: 'omit',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + api_token,
      },
      body: JSON.stringify({primary: true})
    })
    if (res.status === 200) {
      await onUpdate()
    }
  }
  
  const onDelete = async (e) => {
    e.preventDefault();
    const {isConfirmed} = await Swal.fire({
      title: 'Confirm',
      icon: 'warning',
      text: 'Are you sure you want to remove email address "' + email + '"',
      showCancelButton: true,
      confirmButtonText: 'Remove',
    })
    if (!isConfirmed) {
      return
    }
    await fetch(process.env.REACT_APP_API_URL + '/v1/auth/emails/' + email, {
      method: 'DELETE',
      credentials: 'omit',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + api_token,
      }
    })
    await onUpdate()
  }

  const onResend = async (e) => {
    e.preventDefault();
    const res = await fetch(process.env.REACT_APP_API_URL + '/v1/auth/registration/resend-verification/', {
      method: 'POST',
      credentials: 'omit',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + api_token,
      },
      body: JSON.stringify({email})
    })
    if (res.status === 200) {
      setResent(true)
      setTimeout(() => setResent(false), 10e3);
    }
  }

  return (
  <div className="row" style={{marginBottom: '1em'}}>
    <div className="col-sm">
      <h4><span className="badge badge-secondary">{email}</span>{primary && <> <span className="badge badge-success">Primary</span></>}{verified && <> <span className="badge badge-primary">Verified</span></>}{resent && <> <span className="badge badge-warning">Verification resent</span></>}</h4>
    </div>
    <div className="col-sm">
      { !primary && verified && <><button onClick={makePrimary} className="btn btn-info"><i className="fas fa-star"></i> Make primary</button> </>}
      { !verified && !resent && <><button  onClick={onResend} className="btn btn-warning"><i className="fas fa-paper-plane"></i> Resend Verification</button> </>}
      { !primary && <button onClick={onDelete} className="btn btn-danger"><i className="fa fa-trash"></i> Delete</button>}
    </div>
      {verified}
  </div>);
}

const EmailsList = () => {
  const [emails, setEmails] = React.useState([]);
  const [newEmail, setNewEmail] = React.useState('');
  const [errorsAdding, setErrorsAdding] = React.useState({})

  const globalState = useGlobalState()
  const { api_token } = globalState.user
  
  const fetchEmails = async () => {
    const res = await fetch(process.env.REACT_APP_API_URL + '/v1/auth/emails/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Token ' + api_token,
        }
    })
    const data = await res.json()
    setEmails(data)
  }

  React.useEffect(() => {
    if (api_token) {
      fetchEmails()
    }
  // eslint-disable-next-line
  }, [api_token])

  const addEmail = async (e) => {
    e.preventDefault();
    const res = await fetch(process.env.REACT_APP_API_URL + '/v1/auth/emails/', {
      method: 'POST',
      credentials: 'omit',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + api_token,
      },
      body: JSON.stringify({email: newEmail})
    })
    if (res.status === 201) {
      await fetchEmails();
      setNewEmail('');
    } else if (res.status === 400) {
      setErrorsAdding(await res.json())
    }
  }

  return (
    <>
    <h3><i className="fa fa-at"></i> Emails</h3>
    <hr/>
    <div>
      {emails.map(
        (e) => (
          <EmailItem  key={e.email} email={e.email} verified={e.verified} primary={e.primary} onUpdate={fetchEmails}/>
        )
      )}
      <hr/>
      <h4>Register new email address</h4>
      <div>
        <div>
          <form className="form-group" onSubmit={addEmail}>
            <div className="form-group">
              <label htmlFor="staticEmail" className="sr-only">Email</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={"form-control" + (errorsAdding.email ? ' is-invalid' : '')} id="staticEmail" placeholder="email@example.com" required />
              {errorsAdding.email && (<span className="invalid-feedback">
                    {errorsAdding.email.join('')}
                </span>)}
            </div>
            <button type="submit" className="btn btn-primary"><i className="fa fa-plus"></i> Add</button>
          </form>
        </div>
      </div>
    </div>
    </>
    )
}

export default EmailsList