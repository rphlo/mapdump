
import React from 'react'
import useGlobalState from '../utils/useGlobalState'
import Swal from 'sweetalert2'

const UserDeletion = () => {
  const [resent, setResent] = React.useState(false);
  const globalState = useGlobalState();
  const { api_token } = globalState.user;
  
  const onDelete = async (e) => {
    e.preventDefault();
    const {isConfirmed} = await Swal.fire({
      title: 'Confirm',
      icon: 'warning',
      text: 'Are you sure you want to delete your account? This is permanent!',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    })
    if (!isConfirmed) {
      return
    }
    await fetch(process.env.REACT_APP_API_URL + '/v1/auth/user/', {
      method: 'DELETE',
      credentials: 'omit',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + api_token,
      }
    })
    Swal.fire({
      title: 'One more thing!',
      text: 'An email has been sent to you to confirm your action!',
      icon: 'success',
      confirmButtonText: 'OK'
    });
  }

  return (
  <><h3><i className="fa fa-trash"></i> Account Deletion</h3>
  <hr/>
  <div className="row" style={{marginBottom: '1em'}}>
    <div className="col-sm">
      <button onClick={onDelete} className="btn btn-danger"><i className="fa fa-trash"></i> Delete Account</button>
    </div>
  </div></>);
}

export default UserDeletion