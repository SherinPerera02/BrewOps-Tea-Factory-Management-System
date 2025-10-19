import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const PaymentResult = () => {
  const { type } = useParams(); // 'success' or 'cancel'
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const paymentId = urlParams.get('payment_id');
    const status = urlParams.get('status');

    if (sessionId) {
      checkPaymentStatus(sessionId, paymentId, status);
    } else {
      setLoading(false);
    }
  }, []);

  const checkPaymentStatus = async (sessionId, paymentId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/payment/status/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setPaymentDetails({
          sessionId,
          paymentId,
          status: status || result.status,
          ...result
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/supply-records');
  };

  const handleRetryPayment = () => {
    navigate(-1); // Go back to payment page
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Verifying payment status...</p>
        </div>
      </div>
    );
  }

  const isSuccess = type === 'success';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {isSuccess ? (
          <>
            <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your payment has been processed successfully. The supplier will be notified about the payment.
            </p>
          </>
        ) : (
          <>
            <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment {type === 'cancel' ? 'Cancelled' : 'Failed'}</h1>
            <p className="text-gray-600 mb-6">
              {type === 'cancel' 
                ? 'You have cancelled the payment process. No charges were made.'
                : 'There was an issue processing your payment. Please try again.'
              }
            </p>
          </>
        )}

        {paymentDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-2">Payment Details</h3>
            <div className="space-y-1 text-sm text-gray-600">
              {paymentDetails.sessionId && (
                <p><span className="font-medium">Session ID:</span> {paymentDetails.sessionId}</p>
              )}
              {paymentDetails.paymentId && (
                <p><span className="font-medium">Payment ID:</span> {paymentDetails.paymentId}</p>
              )}
              {paymentDetails.status && (
                <p><span className="font-medium">Status:</span> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                    paymentDetails.status === 'completed' ? 'bg-green-100 text-green-800' :
                    paymentDetails.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {paymentDetails.status}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {isSuccess ? (
            <button
              onClick={handleContinue}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Continue to Supply Records
            </button>
          ) : (
            <>
              <button
                onClick={handleRetryPayment}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Retry Payment
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Back to Records
              </button>
            </>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If you have any questions about this payment, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;