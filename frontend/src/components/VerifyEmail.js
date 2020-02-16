import React from 'react'

const VerifyEmail = ({match, history}) => {
    const [verified, setVerified] = React.useState(false)
    const [errors, setErrors] = React.useState({})
    React.useEffect(()=>{
        (async () => {
            const res = await fetch(process.env.REACT_APP_API_URL + '/v1/auth/registration/verify-email/', {
                method: 'POST',headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({key: match.params.key})
            })
            if (res.status === 200) {
                setVerified(true)
            } else if (res.status === 400) {
                setErrors(await res.json())
            } else if (res.status === 404) {
                setErrors({key: 'Could not find key.'})
            }
        })()
    }, [match, history])

    return (
        <>
        {errors.key && (
            <div className="alert alert-danger" role="alert">
                {errors.key}
            </div>)}
        {verified && (
        <div className="alert alert-success" role="alert">
            Success! you can now login!
        </div>)}
        </>
    )
}

export default VerifyEmail