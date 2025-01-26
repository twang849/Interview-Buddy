import React from 'react'
import './LoginPage.css'

function LoginPage() {
  return (
    <>
    <h1 className="text">Sign Up</h1>
    <form className="login" action="/login" method="POST">
        <div class="username">  
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" placeholder="Enter your username" required />
        </div>
        <div class="password">
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" placeholder="Enter your password" required />
        </div>
        <button type="submit" class="login-btn">Login</button>
    </form>
    </>


  )
}

export default LoginPage