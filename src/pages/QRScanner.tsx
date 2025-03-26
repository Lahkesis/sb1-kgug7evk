import React, { useState } from 'react';
import QrReader from 'react-qr-scanner';
import { useNavigate } from 'react-router-dom';

function QRScanner() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleScan = (data: any) => {
    if (data) {
      try {
        const url = new URL(data.text);
        if (url.pathname.startsWith('/menu/')) {
          navigate(url.pathname);
        }
      } catch (e) {
        setError('Invalid QR code');
      }
    }
  };

  const handleError = (err: any) => {
    setError('Error accessing camera');
    console.error(err);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8">Scan Table QR Code</h1>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <QrReader
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: '100%' }}
          />
        </div>
        {error && (
          <p className="mt-4 text-red-600 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}

export default QRScanner;