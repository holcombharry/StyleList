import SignupScreen from '../screens/SignupScreen';
 
/**
 * Signup route component
 * Uses SignupScreen component which now includes email provider conflict checking.
 * Before signup, the system verifies if the email is already associated with a social login provider.
 * This prevents creating duplicate accounts for emails already used with social login.
 */
export default function Signup() {
  return <SignupScreen />;
} 