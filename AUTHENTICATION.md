# Authentication Setup

This CAP application now requires authentication to access all services and the UI.

## Local Development (Mock Authentication)

For local development, the application uses **mocked authentication** with predefined users.

### Available Users

| Username | Password | Email | Full Name |
|----------|----------|-------|-----------|
| alice | alice | alice@company.com | Alice Anderson |
| bob | bob | bob@company.com | Bob Brown |
| charlie | charlie | charlie@company.com | Charlie Chen |

### How to Login

#### Option 1: Browser Basic Auth Dialog (Default)

When you access the application at `http://localhost:4004/ui5/index.html`, your browser will show a basic authentication dialog. Enter any of the usernames and passwords from the table above.

#### Option 2: Custom Login Page

You can also use the custom SAPUI5-themed login page:

1. Navigate to `http://localhost:4004/login.html`
2. Enter username and password
3. Click "Login"

The login page provides a better user experience with SAPUI5 styling.

### User Features

All authenticated users have **equal access** to all features. Authentication is only used to:

1. **Identify the user** - The current user is displayed in the top-right avatar
2. **Save user preferences** - Each user has their own settings that are saved separately
3. **Restrict access** - Only authenticated users can access the application

### User Display

Once logged in, you can:

- See your **initials** in the avatar (top-right corner)
- Click the **avatar** to see your full user information:
  - Email address
  - Full name

### User Settings

Each user's view preferences (which panels are visible/hidden) are saved separately using the `UserSettings` entity. Settings are automatically loaded when you log in.

## Production Deployment (Ubuntu Server)

For production deployment on your Ubuntu server, you have several authentication options:

### Option 1: Keep Mock Authentication (Simple, Current Setup)

For internal/trusted network deployments, you can keep the current mock authentication:

- Users authenticate with the same credentials as development
- Simple to maintain
- **Important**: Only use this if your server is behind a firewall or VPN
- **Recommended**: Use HTTPS (SSL/TLS) to encrypt credentials in transit

### Option 2: Add Users as Needed (Recommended for Small Teams)

Simply add more users to `package.json`:

```json
{
  "cds": {
    "requires": {
      "auth": {
        "kind": "mocked",
        "users": {
          "john": {
            "password": "secure-password-here",
            "id": "john@yourcompany.com",
            "attr": {
              "name": "John Doe"
            }
          }
        }
      }
    }
  }
}
```

**Best Practices:**
- Use strong passwords in production
- Keep `package.json` secure (restrict file permissions)
- Use environment variables for sensitive data
- Enable HTTPS on your Ubuntu server

### Option 3: Future Enhancement - Database-Backed Users

For more advanced user management (users can set their own passwords), you could:

1. Create a `Users` entity in the database
2. Hash passwords using bcrypt
3. Implement password reset functionality
4. Add user registration endpoint

This would require additional implementation but allows self-service user management.

### Security Recommendations for Ubuntu Deployment

1. **Enable HTTPS**: Use Let's Encrypt with nginx/Apache reverse proxy
2. **Firewall**: Configure UFW to allow only necessary ports
3. **Rate Limiting**: Use nginx to prevent brute-force attacks
4. **Fail2ban**: Automatically block IPs after failed login attempts
5. **Regular Updates**: Keep Ubuntu and Node.js packages updated
6. **Environment Variables**: Store sensitive config outside `package.json`

### Adding More Mock Users (Development Only)

To add more mock users for testing, edit `package.json`:

```json
{
  "cds": {
    "requires": {
      "auth": {
        "kind": "mocked",
        "users": {
          "newuser": {
            "password": "password123",
            "id": "newuser@company.com",
            "attr": {
              "name": "New User"
            }
          }
        }
      }
    }
  }
}
```

## API Access

When accessing the API programmatically, use HTTP Basic Authentication:

```bash
# Example: Get app info
curl -u alice:alice http://localhost:4004/analytics/getAppInfo()

# Example: Access entities
curl -u bob:bob http://localhost:4004/analytics/Dump
```

## Security Notes

- Mock authentication is **ONLY** for local development
- Never use mock authentication in production
- Passwords in `package.json` are for development convenience only
- In production, all authentication is handled by enterprise-grade identity providers
- User settings are stored per user ID, ensuring privacy between users

## Troubleshooting

### Can't login

- Verify you're using the correct username/password combination
- Check that the CAP server is running (`npm start`)
- Clear your browser cache and try again

### Changes to package.json not taking effect

- Restart the CAP server after making changes to `package.json`
- Run `npm start` to restart the server

### Login page not showing

- Make sure you're accessing `/login.html` (not `/ui5/login.html`)
- The login page is served from the `app` directory
