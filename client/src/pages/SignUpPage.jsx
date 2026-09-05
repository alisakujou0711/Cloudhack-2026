import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/AuthForm';

export default function SignUpPage() {
  const { signUp } = useAuth();

  return (
    <AuthForm
      subtitle="Create an account and your profile, history, and drafts follow you rather than this browser."
      submitLabel="Create account"
      pendingLabel="Creating account..."
      passwordHint="At least 8 characters"
      passwordAutoComplete="new-password"
      onSubmit={signUp}
      footer={<>Already have an account? <Link to="/signin">Sign in</Link></>}
    />
  );
}
