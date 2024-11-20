import React from 'react'

const RegisterPage = () => {
  return (
    <div className='register'>
        <div className='register_content'>
            <form>
                <input 
                    placeholder='First Name'
                    name="firstname"
                    required
                />
                <input 
                    placeholder='Last Name'
                    name="lastname"
                    required
                />
                <input 
                    placeholder='Email'
                    name="email"
                    type='email'
                    required
                />
                <input 
                    placeholder='Password'
                    name='password'
                    type='password'
                    required
                />
                <input 
                    placeholder='Confirm Password'
                    name='comfirmPassword'
                    type='password'
                    required
                />
                <input
                    id='image'
                    type='file'
                    name='profileImage'
                    accept='Image/*'
                    style={{display: 'none'}}
                    required
                />
                <label htmlFor='image'>
                    <img src='/assets/addImage.png' alt='lets see your buity'/>
                    <p>Upload your profile photo</p>
                </label>
                <button type='submit'>REGISTER</button>
            </form>
            <a href='/login'>Already have an account? Log in here</a>
        </div>
    </div>
  )
}

export default RegisterPage