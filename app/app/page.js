'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default function HOAManagement() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('owners')
  const [owners, setOwners] = useState([])
  const [fines, setFines] = useState([])
  const [waitlist, setWaitlist] = useState([])
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)

  // Authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load data when user logs in
  useEffect(() => {
    if (user) {
      loadAllData()
    }
  }, [user])

  const loadAllData = async () => {
    const [ownersData, finesData, waitlistData, rentalsData] = await Promise.all([
      supabase.from('owners').select('*'),
      supabase.from('fines').select('*'),
      supabase.from('rental_waitlist').select('*').order('request_date'),
      supabase.from('current_rentals').select('*')
    ])

    setOwners(ownersData.data || [])
    setFines(finesData.data || [])
    setWaitlist(waitlistData.data || [])
    setRentals(rentalsData.data || [])
  }

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
  }

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else alert('Check your email for verification link!')
  }

  const signOut = () => supabase.auth.signOut()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' }}>
        Loading...
      </div>
    )
  }

  // If not logged in, show login form
  if (!user) {
    return <LoginForm onSignIn={signIn} onSignUp={signUp} />
  }

  // Main HOA management interface
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '0', padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: '#2563eb', margin: 0 }}>🏠 HOA Management System</h1>
          <div>
            <span style={{ marginRight: '15px', color: '#666' }}>{user.email}</span>
            <button 
              onClick={signOut} 
              style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {[
          { key: 'owners', label: '👥 Owners' },
          { key: 'fines', label: '⚠️ Fines' },
          { key: 'payments', label: '💳 Payments' },
          { key: 'waitlist', label: '📋 Rental Waitlist' },
          { key: 'rentals', label: '🏠 Current Rentals' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: activeTab === tab.key ? '#2563eb' : 'white',
              color: activeTab === tab.key ? 'white' : '#2563eb',
              border: '2px solid #2563eb',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {activeTab === 'owners' && <OwnersTab owners={owners} onUpdate={loadAllData} />}
        {activeTab === 'fines' && <FinesTab owners={owners} fines={fines} onUpdate={loadAllData} />}
        {activeTab === 'payments' && <PaymentsTab owners={owners} />}
        {activeTab === 'waitlist' && <WaitlistTab owners={owners} waitlist={waitlist} onUpdate={loadAllData} />}
        {activeTab === 'rentals' && <RentalsTab owners={owners} rentals={rentals} onUpdate={loadAllData} />}
      </div>
    </div>
  )
}

// Login Component
function LoginForm({ onSignIn, onSignUp }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isSignUp) {
      onSignUp(email, password)
    } else {
      onSignIn(email, password)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '15px', 
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{ textAlign: 'center', color: '#2563eb', marginBottom: '30px', fontSize: '28px' }}>
          {isSignUp ? 'Create Admin Account' : 'HOA Admin Login'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              Email Address:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e5e7eb', 
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="admin@yourhoa.com"
              required
            />
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e5e7eb', 
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="Enter secure password"
              required
            />
          </div>
          
          <button
            type="submit"
            style={{ 
              width: '100%', 
              background: '#2563eb', 
              color: 'white', 
              padding: '14px', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '16px', 
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <span style={{ color: '#6b7280' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#2563eb', 
              textDecoration: 'underline', 
              cursor: 'pointer', 
              marginLeft: '8px',
              fontWeight: 'bold'
            }}
          >
            {isSignUp ? 'Sign In' : 'Create One'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Owners Tab Component
function OwnersTab({ owners, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', unit_number: '', tax_number: '',
    phone_number: '', email: '', alternate_address: '', alternate_email: '', dependants: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('owners').insert([formData])
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Owner added successfully!')
      setFormData({
        first_name: '', last_name: '', unit_number: '', tax_number: '',
        phone_number: '', email: '', alternate_address: '', alternate_email: '', dependants: ''
      })
      setShowForm(false)
      onUpdate()
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ color: '#2563eb', margin: 0 }}>👥 Condo Owners</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ 
            background: '#10b981', 
            color: 'white', 
            padding: '12px 20px', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {showForm ? 'Cancel' : '+ Add New Owner'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#f9fafb', padding: '25px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginTop: 0, color: '#374151' }}>Add New Condo Owner</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>First Name *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Last Name *</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Unit Number *</label>
                <input
                  type="text"
                  value={formData.unit_number}
                  onChange={(e) => setFormData({...formData, unit_number: e.target.value})}
                  style={inputStyle}
                  placeholder="e.g., 101, 2A, etc."
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tax Number</label>
                <input
                  type="text"
                  value={formData.tax_number}
                  onChange={(e) => setFormData({...formData, tax_number: e.target.value})}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Alternate Address</label>
                <textarea
                  value={formData.alternate_address}
                  onChange={(e) => setFormData({...formData, alternate_address: e.target.value})}
                  style={{...inputStyle, height: '80px'}}
                  placeholder="Mailing address if different from unit address"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Alternate Email</label>
                <input
                  type="email"
                  value={formData.alternate_email}
                  onChange={(e) => setFormData({...formData, alternate_email: e.target.value})}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Dependants</label>
                <input
                  type="text"
                  value={formData.dependants}
                  onChange={(e) => setFormData({...formData, dependants: e.target.value})}
                  style={inputStyle}
                  placeholder="Names and ages of dependants"
                />
              </div>
            </div>
            <button
              type="submit"
              style={{ 
                background: '#2563eb', 
                color: 'white', 
                padding: '12px 24px', 
                border: 'none', 
                borderRadius: '6px', 
                marginTop: '20px', 
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Add Owner
            </button>
          </form>
        </div>
      )}

      {/* Owners List */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>Unit</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>Phone</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>Tax Number</th>
            </tr>
          </thead>
          <tbody>
            {owners.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  No owners added yet. Click "Add New Owner" to get started.
                </td>
              </tr>
            ) : (
              owners.map(owner => (
                <tr key={owner.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{owner.unit_number}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{owner.first_name} {owner.last_name}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{owner.email}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{owner.phone_number || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{owner.tax_number || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Fines Tab Component
function FinesTab({ owners, fines, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    owner_id: '', owner_email: '', description: '', supporting_documentation: '', fine_amount: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const { error } = await supabase.from('fines').insert([formData])
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert(`Fine recorded successfully! Email notification would be sent to ${formData.owner_email}`)
      
      setFormData({
        owner_id: '', owner_email: '', description: '', supporting_documentation: '', fine_amount: ''
      })
      setShowForm(false)
      onUpdate()
    }
  }

  const handleOwnerSelect = (e) => {
    const selectedOwner = owners.find(owner => owner.id.toString() === e.target.value)
    setFormData({
      ...formData,
      owner_id: e.target.value,
      owner_email: selectedOwner ? selectedOwner.email : ''
    })
  }

  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ color: '#2563eb', margin: 0 }}>⚠️ Fines Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ 
            background: '#dc2626', 
            color: 'white', 
            padding: '12px 20px', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {showForm ? 'Cancel' : '+ Issue New Fine'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fef2f2', padding: '25px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #fecaca' }}>
          <h3 style={{ marginTop: 0, color: '#dc2626' }}>Issue Fine</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Owner *</label>
                <select
                  value={formData.owner_id}
                  onChange={handleOwnerSelect}
                  style={inputStyle}
                  required
                >
                  <option value="">Choose an owner...</option>
                  {owners.map(owner => (
                    <option key={owner.id} value={owner.id}>
                      Unit {owner.unit_number} - {owner.first_name} {owner.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Owner Email *</label>
                <input
                  type="email"
                  value={formData.owner_email}
                  onChange={(e) => setFormData({...formData, owner_email: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fine Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fine_amount}
                  onChange={(e) => setFormData({...formData, fine_amount: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fine Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={{...inputStyle, height: '100px'}}
                  placeholder="Describe the violation and fine details..."
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Supporting Documentation</label>
                <textarea
                  value={formData.supporting_documentation}
                  onChange={(e) => setFormData({...formData, supporting_documentation: e.target.value})}
                  style={{...inputStyle, height: '80px'}}
                  placeholder="Add any relevant details, dates, witness information, etc."
                />
              </div>
            </div>
            
            <button
              type="submit"
              style={{ 
                background: '#dc2626', 
                color: 'white', 
                padding: '12px 24px', 
                border: 'none', 
                borderRadius: '6px', 
                marginTop: '20px', 
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Issue Fine & Send Email
            </button>
          </form>
        </div>
      )}

      {/* Fines List */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>Owner Email</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {fines.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  No fines issued yet.
                </td>
              </tr>
            ) : (
              fines.map(fine => (
                <tr key={fine.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                    {new Date(fine.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{fine.owner_email}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>${fine.fine_amount}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{fine.description}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                    <span style={{ 
                      background: fine.status === 'pending' ? '#fef3c7' : '#dcfce7',
                      color: fine.status === 'pending' ? '#92400e' : '#166534',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {fine.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Payments Tab Component
function PaymentsTab({ owners }) {
  return (
    <div>
      <h2 style={{ color: '#2563eb', marginBottom: '25px' }}>💳 Payment Management</h2>
      
      <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
        <h3 style={{ color: '#1d4ed8', marginTop: 0 }}>💡 Payment Integration Coming Soon</h3>
        <p style={{ marginBottom: '15px' }}>Your HOA system is ready for payment integration. Recommended options:</p>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>1. Stripe + ACH Bank Transfers (
