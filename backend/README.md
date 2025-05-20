# Backend API

## Email Configuration

The application uses Nodemailer with SendGrid for sending emails. To configure the email service, add the following environment variables to your `.env` file:

```
# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key_here
EMAIL_DEFAULT_FROM=noreply@yourdomain.com
```

### SendGrid Setup

1. Create a SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Create an API key in the SendGrid dashboard
3. Add the API key to your environment variables as `SMTP_PASSWORD`
4. Verify your sender domain or email address in SendGrid

### Testing Email Functionality

You can test the email functionality by using the `/api/test/email` endpoint (if available) or by creating a test route. 