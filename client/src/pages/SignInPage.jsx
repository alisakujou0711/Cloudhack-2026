import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/AuthForm';

export default function SignInPage() {
  const { signIn } = useAuth();

  return (
    <AuthForm
      headline="Your drafts are where you left them."
      subtitle="Sign in to pick up your applications, your feedback, and everything already in your history."
      submitLabel="Sign in"
      pendingLabel="Signing in..."
      passwordAutoComplete="current-password"
      onSubmit={signIn}
      footer={<>New here? <Link to="/signup">Create an account</Link></>}
    />
  );
}
