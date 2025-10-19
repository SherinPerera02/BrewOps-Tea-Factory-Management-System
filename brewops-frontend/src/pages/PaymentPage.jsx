import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaUser, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaUniversity, 
  FaCreditCard, 
  FaMoneyBillWave, 
  FaCheckCircle, 
  FaSpinner
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import { getAuthToken } from '../utils/auth';

const PaymentPage = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [supplyRecord, setSupplyRecord] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [showGateway, setShowGateway] = useState(false);

  const fetchPaymentData = async () => {
    console.log('=== PAYMENT PAGE: Fetching Payment Data ===');
    console.log('Record ID:', recordId);
    
    try {
      setLoading(true);
      const token = getAuthToken();
      console.log('Auth token retrieved:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        console.error('ERROR: No authentication token found');
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      // Fetch supply record
      console.log('Fetching supply record from:', `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/staff/supply-records/${recordId}`);
      const supplyResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/staff/supply-records/${recordId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Supply record response status:', supplyResponse.status);
      
      if (!supplyResponse.ok) {
        const errorText = await supplyResponse.text();
        console.error('ERROR: Failed to fetch supply record');
        console.error('Status:', supplyResponse.status);
        console.error('Response:', errorText);
        throw new Error(`Failed to fetch supply record (Status: ${supplyResponse.status})`);
      }

      const supplyResult = await supplyResponse.json();
      console.log('Supply record result:', supplyResult);

      if (!supplyResult.success || !supplyResult.data) {
        console.error('ERROR: Invalid supply record data structure');
        console.error('Result:', supplyResult);
        throw new Error('Invalid supply record data');
      }

      // Destructure the nested response - backend returns {supply_record: {...}, supplier: {...}}
      const { supply_record, supplier } = supplyResult.data;
      
      console.log('✓ Supply record loaded successfully');
      console.log('Supply record data:', supply_record);
      console.log('Supplier data:', supplier);
      console.log('Supply record supplier_id:', supply_record.supplier_id);

      // Validate supplier_id exists
      if (!supply_record.supplier_id) {
        console.error('ERROR: Supply record has no supplier_id');
        throw new Error('This supply record does not have an associated supplier. Please contact administrator.');
      }

      // Validate supplier data exists
      if (!supplier || !supplier.id) {
        console.error('ERROR: Supplier data missing in response');
        throw new Error('Supplier information not found. Please contact administrator.');
      }

      // Set both states - supplier data is already included in the response!
      setSupplyRecord(supply_record);
      setSupplier(supplier);
      
      console.log('✓ Payment page data fetch complete (single request with full bank details)');

    } catch (error) {
      console.error('=== PAYMENT PAGE ERROR ===');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      toast.error(error.message || 'Failed to load payment data');
      setTimeout(() => navigate(-1), 2000);
    } finally {
      setLoading(false);
      console.log('=== PAYMENT PAGE: Data fetch finished ===');
    }
  };

  useEffect(() => {
    fetchPaymentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  const handleSpotPayment = async () => {
    console.log('=== SPOT PAYMENT: Starting ===');
    console.log('Supply record:', supplyRecord);
    console.log('Supplier:', supplier);
    
    if (!window.confirm('Confirm spot payment received? This will mark the supply record as paid.')) {
      console.log('Spot payment cancelled by user');
      return;
    }

    try {
      setProcessing(true);
      const token = getAuthToken();
      console.log('Token for payment:', token ? 'Token exists' : 'No token');

      const paymentData = {
        supply_record_id: recordId,
        supplier_id: supplier.id,
        amount: supplyRecord.total_payment,
        payment_method: 'cash',
        payment_notes: `Spot payment for supply ID: ${supplyRecord.supply_id}`
      };
      console.log('Payment data to send:', paymentData);

      // Create payment record
      console.log('Posting to:', `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/payment/direct`);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/payment/direct`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            supply_record_id: recordId,
            supplier_id: supplier.id,
            amount: supplyRecord.total_payment,
            payment_method: 'cash',
            payment_notes: `Spot payment for supply ID: ${supplyRecord.supply_id}`
          })
        }
      );

      console.log('Payment response status:', response.status);
      
      const data = await response.json();
      console.log('Payment response data:', data);
      console.log('Payment response message:', data.message);
      console.log('Payment response error:', data.error);

      if (data.success) {
        console.log('✓ Spot payment successful');
        toast.success('Payment processed successfully!', { duration: 4000, icon: '✅' });
        setTimeout(() => {
          console.log('Navigating to staff dashboard');
          navigate('/staff-dashboard');
        }, 1500);
      } else {
        console.error('ERROR: Payment failed');
        console.error('Response:', data);
        console.error('Error message:', data.message);
        console.error('Error code:', data.error);
        toast.error(data.message || 'Failed to process payment', { duration: 5000 });
      }
    } catch (error) {
      console.error('=== SPOT PAYMENT ERROR ===');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error:', error);
      toast.error('Failed to process payment');
    } finally {
      setProcessing(false);
      console.log('=== SPOT PAYMENT: Finished ===');
    }
  };

  const handleMonthlyPayment = () => {
    console.log('=== MONTHLY PAYMENT: Opening gateway ===');
    console.log('Supply record:', supplyRecord);
    console.log('Supplier:', supplier);
    setShowGateway(true);
  };

  const handleGatewayPayment = async () => {
    console.log('=== GATEWAY PAYMENT: Starting ===');
    
    try {
      setProcessing(true);
      const token = getAuthToken();
      console.log('Token for gateway payment:', token ? 'Token exists' : 'No token');

      const gatewayData = {
        supply_record_id: recordId,
        amount: supplyRecord.total_payment,
        currency: 'LKR',
        description: `Payment for Supply ID: ${supplyRecord.supply_id}`,
        supplier_name: supplier.name,
        supplier_email: supplier.email
      };
      console.log('Gateway payment data:', gatewayData);

      // Create payment session
      console.log('Posting to:', `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/payment/gateway`);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/payment/gateway`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            supply_record_id: recordId,
            amount: supplyRecord.total_payment,
            currency: 'LKR',
            description: `Payment for Supply ID: ${supplyRecord.supply_id}`,
            supplier_name: supplier.name,
            supplier_email: supplier.email
          })
        }
      );

      console.log('Gateway response status:', response.status);
      
      const data = await response.json();
      console.log('Gateway response data:', data);

      if (data.success) {
        console.log('✓ Gateway payment initiated');
        console.log('Session ID:', data.session_id);
        console.log('Payment ID:', data.payment_id);
        toast.success('Payment initiated! Processing...', { duration: 2000 });
        
        // Simulate gateway processing (2 seconds)
        setTimeout(async () => {
          console.log('Simulating gateway processing...');
          
          const callbackData = {
            session_id: data.session_id,
            payment_id: data.payment_id,
            status: 'completed',
            supply_record_id: recordId,
            gateway_payment_id: `GW_${Date.now()}`
          };
          console.log('Sending webhook callback:', callbackData);
          
          // Simulate webhook callback
          const callbackResponse = await fetch(
            `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/payment/callback/success`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(callbackData)
            }
          );

          console.log('Webhook callback response status:', callbackResponse.status);
          const callbackResult = await callbackResponse.json();
          console.log('Webhook callback result:', callbackResult);
          console.log('✓ Gateway payment completed');

          toast.success('Payment completed successfully!', { duration: 4000, icon: '✅' });
          setTimeout(() => {
            console.log('Navigating to staff dashboard');
            navigate('/staff-dashboard');
          }, 1500);
        }, 2000);
      } else {
        console.error('ERROR: Gateway payment initiation failed');
        console.error('Response:', data);
        toast.error(data.message || 'Failed to initiate payment');
        setProcessing(false);
      }
    } catch (error) {
      console.error('=== GATEWAY PAYMENT ERROR ===');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error:', error);
      toast.error('Failed to process payment');
      setProcessing(false);
    } finally {
      console.log('=== GATEWAY PAYMENT: Finished ===');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <Spinner />
      </div>
    );
  }

  if (!supplyRecord || !supplier) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        maxWidth: '600px',
        margin: '100px auto'
      }}>
        <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Data Not Found</h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Unable to load payment information for this record.
        </p>
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '20px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={() => navigate(-1)}
            disabled={processing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: processing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: '#374151',
              fontWeight: '500',
              opacity: processing ? 0.5 : 1
            }}
          >
            <FaArrowLeft size={14} />
            Back
          </button>
          <h1 style={{ 
            margin: '0 0 0 20px', 
            fontSize: '24px', 
            fontWeight: '700',
            color: '#111827' 
          }}>
            Payment Processing
          </h1>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* Left Column - Supply Record Details */}
          <div>
            {/* Supply Record Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ 
                margin: '0 0 20px 0', 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#111827',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '12px'
              }}>
                Supply Record Details
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Supply ID:</span>
                  <strong style={{ color: '#111827', fontSize: '14px' }}>
                    {supplyRecord.supply_id}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Quantity:</span>
                  <strong style={{ color: '#111827', fontSize: '14px' }}>
                    {supplyRecord.quantity_kg} kg
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Unit Price:</span>
                  <strong style={{ color: '#111827', fontSize: '14px' }}>
                    Rs. {parseFloat(supplyRecord.unit_price).toFixed(2)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Supply Date:</span>
                  <strong style={{ color: '#111827', fontSize: '14px' }}>
                    {new Date(supplyRecord.supply_date).toLocaleDateString()}
                  </strong>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  borderTop: '2px solid #e5e7eb',
                  paddingTop: '16px',
                  marginTop: '8px'
                }}>
                  <span style={{ color: '#6b7280', fontSize: '16px', fontWeight: '600' }}>
                    Total Amount:
                  </span>
                  <strong style={{ 
                    color: '#10b981', 
                    fontSize: '20px',
                    fontWeight: '700'
                  }}>
                    Rs. {parseFloat(supplyRecord.total_payment).toFixed(2)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Payment Method:</span>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: supplyRecord.payment_method === 'spot' ? '#10b98120' : '#f59e0b20',
                    color: supplyRecord.payment_method === 'spot' ? '#10b981' : '#f59e0b'
                  }}>
                    {supplyRecord.payment_method === 'spot' ? 'Spot Payment' : 'Monthly Payment'}
                  </span>
                </div>
              </div>
            </div>

            {/* Supplier Details Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ 
                margin: '0 0 20px 0', 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#111827',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '12px'
              }}>
                Supplier Information
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FaUser style={{ color: '#6b7280', fontSize: '16px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Name</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      {supplier.name}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FaEnvelope style={{ color: '#6b7280', fontSize: '16px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Email</div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                      {supplier.email || 'N/A'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FaPhone style={{ color: '#6b7280', fontSize: '16px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Phone</div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                      {supplier.phone || 'N/A'}
                    </div>
                  </div>
                </div>
                {supplier.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FaMapMarkerAlt style={{ color: '#6b7280', fontSize: '16px' }} />
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Address</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                        {supplier.address}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Payment Section */}
          <div>
            {!showGateway ? (
              // Payment Method Selection
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                height: 'fit-content'
              }}>
                <h2 style={{ 
                  margin: '0 0 24px 0', 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: '#111827',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '12px'
                }}>
                  Select Payment Method
                </h2>

                {supplyRecord.payment_method === 'spot' ? (
                  // Spot Payment Section
                  <div>
                    <div style={{
                      backgroundColor: '#f0fdf4',
                      border: '2px solid #86efac',
                      borderRadius: '8px',
                      padding: '20px',
                      marginBottom: '24px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <FaMoneyBillWave style={{ color: '#10b981', fontSize: '24px' }} />
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#166534' }}>
                          Spot Payment (Cash)
                        </h3>
                      </div>
                      <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#166534', lineHeight: '1.6' }}>
                        This is a spot payment transaction. Confirm that you have received the payment 
                        via cash before proceeding.
                      </p>
                      <div style={{
                        backgroundColor: 'white',
                        padding: '16px',
                        borderRadius: '6px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          Amount to be paid:
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                          Rs. {parseFloat(supplyRecord.total_payment).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {supplier.bank_name && (
                      <div style={{
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '24px'
                      }}>
                        <h3 style={{ 
                          margin: '0 0 16px 0', 
                          fontSize: '14px', 
                          fontWeight: '600',
                          color: '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <FaUniversity style={{ color: '#6b7280' }} />
                          Supplier Bank Details
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {supplier.bank_name && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                              <span style={{ color: '#6b7280' }}>Bank Name:</span>
                              <strong style={{ color: '#111827' }}>{supplier.bank_name}</strong>
                            </div>
                          )}
                          {supplier.account_holder_name && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                              <span style={{ color: '#6b7280' }}>Account Holder:</span>
                              <strong style={{ color: '#111827' }}>{supplier.account_holder_name}</strong>
                            </div>
                          )}
                          {supplier.account_number && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                              <span style={{ color: '#6b7280' }}>Account Number:</span>
                              <strong style={{ color: '#111827', fontFamily: 'monospace' }}>
                                {supplier.account_number}
                              </strong>
                            </div>
                          )}
                          {supplier.bank_branch && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                              <span style={{ color: '#6b7280' }}>Branch:</span>
                              <strong style={{ color: '#111827' }}>{supplier.bank_branch}</strong>
                            </div>
                          )}
                          {supplier.bank_code && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                              <span style={{ color: '#6b7280' }}>Bank Code:</span>
                              <strong style={{ color: '#111827', fontFamily: 'monospace' }}>
                                {supplier.bank_code}
                              </strong>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(supplyRecord.payment_status === 'paid') ? (
                      <div style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                      }}>
                        <FaCheckCircle style={{ marginRight: 8 }} /> Paid
                      </div>
                    ) : (
                      <button
                        onClick={handleSpotPayment}
                        disabled={processing}
                        style={{
                          width: '100%',
                          padding: '16px',
                          backgroundColor: processing ? '#9ca3af' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: processing ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => !processing && (e.target.style.backgroundColor = '#059669')}
                        onMouseLeave={(e) => !processing && (e.target.style.backgroundColor = '#10b981')}
                      >
                        {processing ? (
                          <>
                            <FaSpinner className="spin" />
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            <FaCheckCircle />
                            Confirm Payment
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  // Monthly Payment Section
                  <div>
                    <div style={{
                      backgroundColor: '#fef3c7',
                      border: '2px solid #fbbf24',
                      borderRadius: '8px',
                      padding: '20px',
                      marginBottom: '24px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <FaCreditCard style={{ color: '#f59e0b', fontSize: '24px' }} />
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
                          Monthly Payment (Payment Gateway)
                        </h3>
                      </div>
                      <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#92400e', lineHeight: '1.6' }}>
                        This is a monthly payment transaction. Click the button below to open the 
                        payment gateway for secure online payment processing.
                      </p>
                      <div style={{
                        backgroundColor: 'white',
                        padding: '16px',
                        borderRadius: '6px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          Amount to be paid:
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                          Rs. {parseFloat(supplyRecord.total_payment).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleMonthlyPayment}
                      disabled={processing}
                      style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: processing ? '#9ca3af' : '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: processing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => !processing && (e.target.style.backgroundColor = '#d97706')}
                      onMouseLeave={(e) => !processing && (e.target.style.backgroundColor = '#f59e0b')}
                    >
                      <FaCreditCard />
                      Open Payment Gateway
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Payment Gateway Modal
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '2px solid #f59e0b'
              }}>
                <div style={{
                  backgroundColor: '#fef3c7',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  textAlign: 'center'
                }}>
                  <FaCreditCard style={{ fontSize: '48px', color: '#f59e0b', marginBottom: '12px' }} />
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#92400e' }}>
                    Demo Payment Gateway
                  </h2>
                  <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
                    Secure Payment Processing
                  </p>
                </div>

                {/* Payment Summary */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    Payment Summary
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: '#6b7280' }}>Merchant:</span>
                      <strong style={{ color: '#111827' }}>Tea Processing System</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: '#6b7280' }}>Supplier:</span>
                      <strong style={{ color: '#111827' }}>{supplier.name}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: '#6b7280' }}>Supply ID:</span>
                      <strong style={{ color: '#111827' }}>{supplyRecord.supply_id}</strong>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      borderTop: '2px solid #e5e7eb',
                      paddingTop: '12px',
                      marginTop: '8px'
                    }}>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Total Amount:</span>
                      <strong style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>
                        Rs. {parseFloat(supplyRecord.total_payment).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Bank Details for Gateway Payment */}
                {supplier.bank_name && (
                  <div style={{
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <h3 style={{ 
                      margin: '0 0 12px 0', 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: '#0c4a6e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FaUniversity style={{ color: '#0369a1' }} />
                      Recipient Bank Details
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      {supplier.bank_name && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#0c4a6e' }}>Bank:</span>
                          <strong style={{ color: '#0c4a6e' }}>{supplier.bank_name}</strong>
                        </div>
                      )}
                      {supplier.account_holder_name && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#0c4a6e' }}>Account Holder:</span>
                          <strong style={{ color: '#0c4a6e' }}>{supplier.account_holder_name}</strong>
                        </div>
                      )}
                      {supplier.account_number && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#0c4a6e' }}>Account:</span>
                          <strong style={{ color: '#0c4a6e', fontFamily: 'monospace' }}>
                            {supplier.account_number}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowGateway(false)}
                    disabled={processing}
                    style={{
                      flex: 1,
                      padding: '14px',
                      backgroundColor: 'white',
                      color: '#6b7280',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      opacity: processing ? 0.5 : 1
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGatewayPayment}
                    disabled={processing}
                    style={{
                      flex: 2,
                      padding: '14px',
                      backgroundColor: processing ? '#9ca3af' : '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {processing ? (
                      <>
                        <FaSpinner className="spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle />
                        Complete Payment
                      </>
                    )}
                  </button>
                </div>

                <p style={{ 
                  margin: '16px 0 0 0', 
                  fontSize: '12px', 
                  color: '#6b7280',
                  textAlign: 'center',
                  lineHeight: '1.5'
                }}>
                  🔒 This is a demo payment gateway. In production, this would redirect to a secure payment processor.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS for spinner animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default PaymentPage;