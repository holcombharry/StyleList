import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

/**
 * Forgot Password route component
 * Uses ForgotPasswordScreen component which now includes email provider conflict checking.
 * Before requesting a password reset, the system verifies if the email is already associated 
 * with a social login provider (Google/Apple) and prevents password reset requests for those accounts.
 */
export default function ForgotPassword() {
  return <ForgotPasswordScreen />;
} 