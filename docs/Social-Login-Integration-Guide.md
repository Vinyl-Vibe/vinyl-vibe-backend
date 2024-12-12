# Social Login Integration Guide

## Available Authentication Methods
1. Google Sign In
2. Apple Sign In (Production only)

## Endpoints

### Google Authentication
```javascript
// Initiate Google Sign In
Production: 'https://api.vinylvibe.live/auth/google'
Development: 'http://localhost:8080/auth/google'
```

### Apple Authentication (Production Only)
```javascript
// Initiate Apple Sign In
Production: 'https://api.vinylvibe.live/auth/apple'
```

## Implementation Flow

1. **Add Login Buttons**
```javascript
// Example React component
function SocialLogin() {
  const handleGoogleLogin = () => {
    window.location.href = process.env.NODE_ENV === 'production'
      ? 'https://api.vinylvibe.live/auth/google'
      : 'http://localhost:8080/auth/google'
  }

  const handleAppleLogin = () => {
    // Apple login only available in production
    window.location.href = 'https://api.vinylvibe.live/auth/apple'
  }

  return (
    <div>
      <button onClick={handleGoogleLogin}>
        Sign in with Google
      </button>
      
      {/* Only show in production */}
      {process.env.NODE_ENV === 'production' && (
        <button onClick={handleAppleLogin}>
          Sign in with Apple
        </button>
      )}
    </div>
  )
}
```

2. **Handle Callback**
```javascript
// Example callback handler component
function AuthCallback() {
  useEffect(() => {
    // Development: API returns JSON response
    if (process.env.NODE_ENV === 'development') {
      // Response will look like:
      const exampleResponse = {
        token: 'jwt_token_here',
        user: {
          id: 'user_id',
          email: 'user@example.com',
          role: 'user',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: null,
            address: {}
          },
          socialLogins: [
            {
              provider: 'google',
              email: 'user@example.com'
            }
          ]
        }
      }
      return
    }

    // Production: Get token from URL
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      // Store token
      localStorage.setItem('token', token)
      // Redirect to dashboard
      window.location.href = '/dashboard'
    } else {
      // Handle error
      window.location.href = '/login?error=auth_failed'
    }
  }, [])

  return <div>Loading...</div>
}
```

3. **Error Handling**
```javascript
// Example error handler component
function AuthError() {
  useEffect(() => {
    // Handle authentication error
    // Redirect to login with error message
    window.location.href = '/login?error=auth_failed'
  }, [])

  return <div>Authentication failed...</div>
}
```

## Important Notes

1. **Development vs Production**
   - Development: API returns JSON response directly
   - Production: API redirects with token in URL query param

2. **Token Storage**
   - Store JWT token securely
   - Include token in Authorization header for API requests:
   ```javascript
   fetch('https://api.vinylvibe.live/some-endpoint', {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   })
   ```

3. **User Profile**
   - Social login automatically captures:
     - First Name
     - Last Name
     - Email
   - Additional profile fields can be updated later via user settings

4. **Testing**
   - Google login works in both environments
   - Apple login only works in production
   - Use development environment for testing Google flow
   - Test Apple flow on production site

5. **Required Routes**
   Your React app needs these routes:
   ```javascript
   // Example React Router setup
   <Routes>
     <Route path="/auth/callback" element={<AuthCallback />} />
     <Route path="/auth/error" element={<AuthError />} />
   </Routes>
   ```

## Environment Variables
Add to your frontend `.env`:
```javascript
REACT_APP_API_URL=http://localhost:8080
REACT_APP_PROD_API_URL=https://api.vinylvibe.live
```

