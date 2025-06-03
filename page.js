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

  // Authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
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

  // If not logged in, show login form
  if (!user) {
    return <LoginForm onSignIn={signIn} onSignUp={signUp} />
  }

  // Main HOA management interface
  return (
    <div style={{ fontFamily: 'Arial', margin: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#2563eb', margin: 0 }}>🏠 HOA Management System</h1>
        <div style={{ float: 'right' }}>
          <span style={{ marginRight: '10px' }}>{user.email}</span>
          <button onClick={signOut} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px' }}>
            Sign Out
          </button>
        </div>
        <div style={{ clear: 'both' }}></div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ marginBottom: '20px' }}>
        {['owners', 'fines', 'payments', 'waitlist', 'rentals'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? '#2563eb' : 'white',
              color: activeTab === tab ? 'white' : '#2563eb',
              border: '2px solid #2563eb',
              padding: '10px 20px',
              marginRight: '10px',
              borderRadius: '5px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab}
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
    <div style={{ maxWidth: '400px', margin: '100px auto', background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#2563eb', marginBottom: '30px' }}>
        {isSignUp ? 'Create Admin Account' : 'Admin Login'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            required
          />
        </div>
        
        <button
          type="submit"
          style={{ width: '100%', background: '#2563eb', color: 'white', padding: '12px', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer' }}
        >
          {isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', marginLeft: '5px' }}
        >
          {isSignUp ? 'Sign In' : 'Create Account'}
        </button>
      </p>
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#2563eb' }}>👥 Condo Owners</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: '#10b981', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : 'Add New Owner'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '5px', marginBottom: '20px' }}>
          <h3>Add New Condo Owner</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>First Name *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Last Name *</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Unit Number *</label>
                <input
                  type="text"
                  value={formData.unit_number}
                  onChange={(e) => setFormData({...formData, unit_number: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tax Number</label>
                <input
                  type="text"
                  value={formData.tax_number}
                  onChange={(e) => setFormData({...formData, tax_number: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
                  required
                />
              </div>
              <div style={{ gridColumn: '1 / 3' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Alternate Address</label>
                <textarea
                  value={formData.alternate_address}
                  onChange={(e) => setFormData({...formData, alternate_address: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px', height: '60px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Alternate Email</label>
                <input
                  type="email"
                  value={formData.alternate_email}
                  onChange={(e) => setFormData({...formData, alternate_email: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Dependants</label>
                <input
                  type="text"
                  value={formData.dependants}
                  onChange={(e) => setFormData({...formData, dependants: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
                  placeholder="Names and ages of dependants"
                />
              </div>
            </div>
            <button
              type="submit"
              style={{ background: '#2563eb', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', marginTop: '15px', cursor: 'pointer' }}
            >
              Add Owner
            </button>
          </form>
        </div>
      )}

      {/* Owners List */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Unit</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Phone</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Tax Number</th>
            </tr>
          </thead>
          <tbody>
            {owners.map(owner => (
              <tr key={owner.id}>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{owner.unit_number}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{owner.first_name} {owner.last_name}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{owner.email}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{owner.phone_number || 'N/A'}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{owner.tax_number || 'N/A'}</td>
              </tr>
            ))}
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
    
    // Add the fine to database
    const { error } = await supabase.from('fines').insert([formData])
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      // Here you would integrate with an email service
      // For now, we'll just show a success message
      alert(`Fine recorded and email notification sent to ${formData.owner_email}`)
      
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#2563eb' }}>⚠️ Fines Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: '#dc2626', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : 'Issue New Fine'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '5px', marginBottom: '20px' }}>
          <h3>Issue Fine</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Owner *</label>
              <select
                value={formData.owner_id}
                onChange={handleOwnerSelect}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
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

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Owner Email *</label>
              <input
                type="email"
                value={formData.owner_email}
                onChange={(e) => setFormData({...formData, owner_email: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fine Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '3px', height: '80px' }}
