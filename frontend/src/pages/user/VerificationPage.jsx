import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VerificationPage = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);

  const handleChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      document.getElementById(`code-${index + 1}`).focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    console.log('Verifying with code:', fullCode);
    // Simulate successful verification
    navigate('/admin');
  };

  return (
    <div style={{ padding: 'var(--spacing-xxl) 0' }}>
      <div className="container" style={{ maxWidth: '500px' }}>
        <div style={{
          backgroundColor: 'var(--surface)',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-2)',
          border: '1px solid var(--platinum)',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Verify Your Account</h2>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-xl)' }}>
            We've sent a 6-digit verification code to your registered device.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: 'var(--spacing-xl)' }}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  style={{
                    width: '50px',
                    height: '60px',
                    fontSize: '24px',
                    textAlign: 'center',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--platinum)',
                    fontWeight: '700'
                  }}
                />
              ))}
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Verify & Complete Setup
            </button>
          </form>
          
          <p style={{ marginTop: 'var(--spacing-lg)', fontSize: '14px' }}>
            Didn't receive a code? <button style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontWeight: '600' }}>Resend</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
