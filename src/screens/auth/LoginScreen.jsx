import { useState } from 'react';
import { Box, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { THEME } from '../../constants/theme';
import Input from '../../components/Input';
import Button from '../../components/Button';

export const LoginScreen = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) return;

    setError('');
    setLoading(true);

    try {
      await onLogin(credentials);
    } catch (err) {
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${THEME.bg} flex flex-col items-center justify-center px-6 selection:bg-[#d4ff00] selection:text-black animate-in fade-in zoom-in duration-500`}>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#d4ff00] rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(212,255,0,0.3)]">
            <Box className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-100">KUYAJEFF'S GYM</h1>
          <p className="text-[10px] font-bold text-[#d4ff00] uppercase tracking-widest">User Login</p>
        </div>

        <form onSubmit={handleSubmit} className={`${THEME.card} border ${THEME.border} rounded-2xl p-6 space-y-5 shadow-2xl`}>
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input 
            icon={User} 
            label="Username" 
            placeholder="e.g. admin"
            value={credentials.username}
            onChange={(e) => {
              setError('');
              setCredentials({ ...credentials, username: e.target.value });
            }}
            disabled={loading}
          />
          <Input 
            icon={Lock} 
            label="Password" 
            type="password"
            placeholder="••••••••"
            value={credentials.password}
            onChange={(e) => {
              setError('');
              setCredentials({ ...credentials, password: e.target.value });
            }}
            disabled={loading}
          />
          
          <Button 
            className="w-full py-4 mt-4 shadow-[0_0_15px_rgba(212,255,0,0.2)]"
            disabled={!credentials.username || !credentials.password || loading}
            type="submit"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                VERIFYING...
              </>
            ) : (
              'LOGIN'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
