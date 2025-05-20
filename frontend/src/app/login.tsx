import LoginScreen from '../screens/LoginScreen';
 
/**
 * Login route component
 * Uses LoginScreen component which now includes email provider conflict checking.
 * Before login, the system verifies if the email is already associated with a social login provider.
 */
export default function Login() {
  return <LoginScreen />;
} 