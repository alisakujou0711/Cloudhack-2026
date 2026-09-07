import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/AuthForm';

export default function SignInPage() {
  const { signIn, notice } = useAuth();

  return (
    <AuthForm
      headline="Your drafts are where you left them."
      subtitle="Sign in to pick up your applications, your feedback, and everything already in your history."
      submitLabel="Sign in"
      pendingLabel="Signing in..."
      passwordAutoComplete="current-password"
      onSubmit={signIn}
      // Set when the app sent the person here — today, only a deleted account. It lives in memory
      // on the auth context, so a reload lands on the ordinary sign-in screen.
      notice={notice}
      footer={<>New here? <Link to="/signup">Create an account</Link></>}
    />
  );
}
