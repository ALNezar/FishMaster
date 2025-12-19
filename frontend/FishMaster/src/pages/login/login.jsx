import React from 'react';
import Button from './../../components/common/button/button.jsx';
import './Login.scss';

export default function Login() {
  return (
    <div className="login-container">
      <h1>Login</h1>
      <form>
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />
        <Button type="submit">Login</Button>
      </form>
    </div>
  );
}
