import React, { useState } from 'react';
import ForgotPassword from '../components/auth/ForgotPassword';
import ResetPassword from '../components/auth/ResetPassword';

export default function PasswordResetFlow() {
  const [email, setEmail] = useState(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {!email ? (
        <ForgotPassword onOtpSent={(email) => setEmail(email)} />
      ) : (
        <ResetPassword email={email} onResetComplete={() => setEmail(null)} />
      )}
    </div>
  );
}
