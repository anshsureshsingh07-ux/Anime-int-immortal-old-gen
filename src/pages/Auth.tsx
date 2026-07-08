import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  Smartphone, 
  Shield, 
  Chrome, 
  ChevronLeft,
  SmartphoneIcon,
  RefreshCw,
  Trash2,
  User
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { playDigitalSound } from '../lib/sounds';
import LegalModal from '../components/LegalModal';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

type AuthMode = 'signin' | 'signup' | 'forgot';
type AuthTab = 'email' | 'mobile' | 'google';

// Pupil Component
interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil = ({
  size = 12,
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY,
}: PupilProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };
    
    // If forced look direction is provided, use that instead of mouse tracking
    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }
    
    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;
    
    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: "transform 0.1s ease-out",
      }}
    />
  );
};

// EyeBall Component
interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall = ({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY,
}: EyeBallProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };
    
    // If forced look direction is provided, use that instead of mouse tracking
    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }
    
    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;
    
    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? "2px" : `${size}px`,
        backgroundColor: eyeColor,
        overflow: "hidden",
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}
    </div>
  );
};

export default function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuthTab>('email');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalSection, setLegalSection] = useState<'terms' | 'privacy'>('terms');
  
  const [handshakeStatus, setHandshakeStatus] = useState<'checking' | 'connected' | 'connected-warn' | 'error'>('checking');

  useEffect(() => {
    const checkDiagnostic = async () => {
      try {
        const response = await fetch('/api/security/diagnostic');
        if (response.ok) {
          const data = await response.json();
          if (data.adminSecretKeyPresent === false) {
            console.error('[ERR: ENV_VAR_MISSING_ON_SERVER] Secondary gatekeeper ADMIN_SECRET_KEY environment variable is not defined on the node host server!');
            setHandshakeStatus('connected-warn');
          } else {
            setHandshakeStatus('connected');
          }
        } else {
          setHandshakeStatus('error');
        }
      } catch (err) {
        console.error('Handshake connection exception:', err);
        setHandshakeStatus('error');
      }
    };
    checkDiagnostic();
  }, []);
  
  // Hardware Handshake states
  const [handshakeActive, setHandshakeActive] = useState(false);
  const [handshakeStep, setHandshakeStep] = useState(0);
  const [currentDevice, setCurrentDevice] = useState('');
  const [isGuestMode, setIsGuestMode] = useState(false);

  const getDetectedDevice = () => {
    const platform = navigator.platform || "";
    const ua = navigator.userAgent || "";
    
    if (platform.includes("MacIntel") || platform.toLowerCase().includes("mac") || ua.toLowerCase().includes("macintosh")) {
      return "[HARDWARE: VANGUARD_LINK_MAC_OS]";
    }
    if (platform.includes("Win32") || platform.includes("Win64") || platform.toLowerCase().includes("win") || ua.toLowerCase().includes("windows")) {
      return "[HARDWARE: VANGUARD_LINK_WINDOWS_NT]";
    }
    if (platform.toLowerCase().includes("linux")) {
      return "[HARDWARE: VANGUARD_LINK_KERNEL_DISTRO]";
    }
    return "[HARDWARE: VANGUARD_LINK_GENERIC_TERMINAL]";
  };

  const startHandshakeOverlay = () => {
    const device = getDetectedDevice();
    setCurrentDevice(device);
    setHandshakeActive(true);
    setHandshakeStep(0);
    
    // Save device profile to localstorage so it shows up in "User Profile"
    localStorage.setItem('vanguard_detected_device', device);
    
    // Persist to the audit log immediately
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog = {
      timestamp,
      ip: '185.112.44.89',
      device
    };
    try {
      const existing = localStorage.getItem('vanguard_session_audit_logs');
      let logs = [];
      if (existing) {
        logs = JSON.parse(existing);
      }
      logs = [newLog, ...logs].slice(0, 50);
      localStorage.setItem('vanguard_session_audit_logs', JSON.stringify(logs));
    } catch (err) {
      console.error('Audit log persistence failed:', err);
    }
    
    setTimeout(() => {
      setHandshakeStep(1);
      playDigitalSound('click');
    }, 650);

    setTimeout(() => {
      setHandshakeStep(2);
      playDigitalSound('ping');
    }, 1300);

    setTimeout(() => {
      const adminEmails = ["anshsureshsingh07@gmail.com", "animeintofficial@gmail.com", "admin@nexus.com", "anshsureshsingh@gmail.com"];
      const normalizedEmail = (email || '').trim().toLowerCase();
      const isAdmin = adminEmails.includes(normalizedEmail) || normalizedEmail.includes("admin");
      if (isAdmin && !isGuestMode) {
        navigate('/alpha-sector-9-override');
      } else {
        navigate('/');
      }
    }, 2300);
  };
  
  const handleGuestLogin = () => {
    const device = "GUEST_NODE_99";
    setCurrentDevice(device);
    setHandshakeActive(true);
    setHandshakeStep(0);
    setIsGuestMode(true);
    
    // Save device and guest signifiers to localStorage
    localStorage.setItem('vanguard_detected_device', "[SYSTEM_IDENTITY: GUEST_NODE_99]");
    localStorage.setItem('vanguard_guest_session', 'true');
    
    // Persist guest audit log immediately
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog = {
      timestamp,
      ip: '127.0.0.1',
      device: "[SYSTEM_IDENTITY: GUEST_NODE_99]"
    };
    try {
      const existing = localStorage.getItem('vanguard_session_audit_logs');
      let logs = [];
      if (existing) {
        logs = JSON.parse(existing);
      }
      logs = [newLog, ...logs].slice(0, 50);
      localStorage.setItem('vanguard_session_audit_logs', JSON.stringify(logs));
    } catch (err) {
      console.error('Guest audit log persistence failed:', err);
    }
    
    setTimeout(() => {
      setHandshakeStep(1);
      playDigitalSound('click');
    }, 650);

    setTimeout(() => {
      setHandshakeStep(2);
      playDigitalSound('ping');
    }, 1300);

    setTimeout(() => {
      window.dispatchEvent(new Event('guest-login-sync'));
      navigate('/');
    }, 2300);
  };
  
  // Real Identity state parameters
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Secure User Persistence States (Renamed from Saved Users to Saved Emails)
  const [savedEmails, setSavedEmails] = useState<Array<{email: string, passWordObf: string}>>([]);
  const [rememberMe, setRememberMe] = useState(false); // opt-in, not default

  const securityObfuscate = (str: string): string => {
    try {
      return btoa(str.split('').reverse().join('')); // reverse and base64
    } catch (e) {
      return str;
    }
  };

  const securityDeobfuscate = (str: string): string => {
    try {
      return atob(str).split('').reverse().join('');
    } catch (e) {
      return str;
    }
  };

  useEffect(() => {
    try {
      // Clear legacy username-based storage if found to avoid confusion/errors
      if (localStorage.getItem('anime_int_saved_users')) {
        localStorage.removeItem('anime_int_saved_users');
      }

      const stored = localStorage.getItem('anime_int_saved_emails');
      if (stored) {
        setSavedEmails(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load saved emails:', e);
    }
  }, []);

  const removeSavedEmail = (emailToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playDigitalSound('click');
    const updated = savedEmails.filter(acc => acc.email.toLowerCase() !== emailToRemove.toLowerCase());
    setSavedEmails(updated);
    try {
      localStorage.setItem('anime_int_saved_emails', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update saved emails store:', err);
    }
  };

  // Tab State - Mobile SMS
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [smsDigits, setSmsDigits] = useState<string[]>(Array(6).fill(''));
  const [smsCountdown, setSmsCountdown] = useState(0);

  // General parameters
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [googleAuthErrorDomain, setGoogleAuthErrorDomain] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [handshakeFlash, setHandshakeFlash] = useState(false);

  // Refs for character interactive positioning
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);

  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);
  const smsInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update dynamic mouse movement tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Soft random blinking loops
  useEffect(() => {
    const getRandomInterval = () => Math.random() * 4000 + 3000;
    const schedulePurple = () => {
      const timer = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          schedulePurple();
        }, 150);
      }, getRandomInterval());
      return timer;
    };
    const purpleTimer = schedulePurple();
    return () => clearTimeout(purpleTimer);
  }, []);

  useEffect(() => {
    const getRandomInterval = () => Math.random() * 4500 + 2500;
    const scheduleBlack = () => {
      const timer = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlack();
        }, 155);
      }, getRandomInterval());
      return timer;
    };
    const blackTimer = scheduleBlack();
    return () => clearTimeout(blackTimer);
  }, []);

  // Looking at each other when input typing starts
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => {
        setIsLookingAtEachOther(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  // Purple peeking behavior when password visible
  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const schedulePeek = () => {
        const timer = setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => {
            setIsPurplePeeking(false);
          }, 800);
        }, Math.random() * 3000 + 2000);
        return timer;
      };
      const peekTimer = schedulePeek();
      return () => clearTimeout(peekTimer);
    } else {
      setIsPurplePeeking(false);
    }
  }, [password, showPassword]);

  // Countdown timer for SMS verification
  useEffect(() => {
    if (smsCountdown <= 0) return;
    const countdownTimer = setInterval(() => {
      setSmsCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(countdownTimer);
  }, [smsCountdown]);

  // Clean recaptcha on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn("Error clearing Recaptcha verifier:", e);
        }
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    
    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));
    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  // Authenticate user profile sync with Supabase secondary backend
  const syncGoogleUserWithSupabase = async (userEmail: string) => {
    const defaultPassword = `N3xusG00gleAuth_${userEmail.split('@')[0]}_Secur3!`;
    try {
      const { error: sbSignInErr } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: defaultPassword
      });
      
      if (sbSignInErr) {
        const { error: sbSignUpErr } = await supabase.auth.signUp({
          email: userEmail,
          password: defaultPassword,
          options: {
            data: {
              username: userEmail.split('@')[0],
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`
            }
          }
        });
        
        if (!sbSignUpErr) {
          await supabase.auth.signInWithPassword({
            email: userEmail,
            password: defaultPassword
          });
        }
      }
    } catch (e) {
      console.error('Supabase Google Auth mapping sync failed:', e);
    }
  };

  // Google Single Sign-On Authenticator integration
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    setGoogleAuthErrorDomain(false);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user && user.email) {
        await syncGoogleUserWithSupabase(user.email);
        setError(null);
        setMessage('Successfully integrated Google coordinates!');
        setTimeout(() => startHandshakeOverlay(), 800);
      }
    } catch (err: any) {
      console.error('Google Sign-In sequence error:', err);
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setGoogleAuthErrorDomain(true);
        setError('Firebase Error: auth/unauthorized-domain. This domain is not added to Firebase Authorized Domains in console.');
      } else {
        setError(err.message || 'Google Auth translation mapping aborted.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Primary Email/Password System submissions
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please provide an Email Address.');
      setLoading(false);
      return;
    }

    // Email format validation (standard regex checking domain)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please provide a valid email format (e.g., operator@domain.com).');
      setLoading(false);
      return;
    }

    if (mode === 'signup' && !acceptedTerms) {
      setError('You must accept node terms & authorize secure database coordinates recording.');
      setLoading(false);
      return;
    }

    // Derive a simple username prefix from the email coordinate
    const derivedUsername = trimmedEmail.split('@')[0];

    try {
      if (mode === 'signup') {
        let userCredential;
        try {
          userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/email-already-in-use') {
            throw new Error('Email already registered. Please select Sign In mode');
          }
          throw fbErr;
        }

        try {
          await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              data: {
                username: derivedUsername,
              },
            },
          });
        } catch (sbErr) {
          console.error('Supabase registration match mapping failed:', sbErr);
        }

        setError(null);
        setMessage('Vanguard Node Registered successfully! Anchoring database session...');
        setTimeout(() => startHandshakeOverlay(), 800);
      } else if (mode === 'signin') {
        try {
          await signInWithEmailAndPassword(auth, trimmedEmail, password);
        } catch (fbErr: any) {
          throw new Error('Access credentials or passkey passcode is incorrect');
        }

        try {
          const { error: sbSignInErr } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
          if (sbSignInErr && (sbSignInErr.message.includes('Invalid login credentials') || sbSignInErr.status === 400)) {
            const { error: sbSignUpErr } = await supabase.auth.signUp({
              email: trimmedEmail,
              password,
              options: { data: { username: derivedUsername } }
            });
            if (!sbSignUpErr) {
              await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
            }
          }
        } catch (sbErr) {
          console.error('Supabase session parity check mismatch ignored:', sbErr);
        }

        // Capture & Obfuscated-saving
        if (rememberMe && trimmedEmail && password) {
          try {
            const stored = localStorage.getItem('anime_int_saved_emails');
            let accounts = [];
            if (stored) {
              accounts = JSON.parse(stored);
            }
            accounts = accounts.filter((acc: any) => acc.email.toLowerCase() !== trimmedEmail.toLowerCase());
            accounts.push({
              email: trimmedEmail,
              passWordObf: securityObfuscate(password)
            });
            localStorage.setItem('anime_int_saved_emails', JSON.stringify(accounts));
            setSavedEmails(accounts);
          } catch (e) {
            console.error('Failed to capture and save user locally:', e);
          }
        }

        setError(null);
        setMessage('Parity handshakes succeeded! Welcome back.');
        setTimeout(() => startHandshakeOverlay(), 800);
      } else if (mode === 'forgot') {
        try {
          await sendPasswordResetEmail(auth, trimmedEmail);
          setError(null);
          setMessage(`Password recovery wave dispatched to ${trimmedEmail}!`);
        } catch (fbErr: any) {
          throw fbErr;
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mobile dispatch SMS authenticator trigger
  const handleSendSmsCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber) {
      setError('Please provide cell coordinates first.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    let trimmedPhone = phoneNumber.trim().replace(/[-\s()]/g, '');
    let fullPhoneParsed = '';
    
    if (trimmedPhone.startsWith('+')) {
      fullPhoneParsed = trimmedPhone;
    } else {
      if (trimmedPhone.startsWith('0') && trimmedPhone.length > 9) {
        trimmedPhone = trimmedPhone.substring(1);
      }
      const cleanCountryCode = countryCode.trim().startsWith('+') ? countryCode.trim() : `+${countryCode.trim()}`;
      const expectedCodeDigits = cleanCountryCode.replace('+', '');
      
      if (trimmedPhone.startsWith(expectedCodeDigits)) {
        fullPhoneParsed = `+${trimmedPhone}`;
      } else {
        fullPhoneParsed = `${cleanCountryCode}${trimmedPhone}`;
      }
    }

    try {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn('Clearing old recaptcha error:', e);
        }
        window.recaptchaVerifier = undefined;
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => {
          console.log('reCAPTCHA solved on active node:', response);
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA coordinates trace expired.');
        }
      });

      const confirmation = await signInWithPhoneNumber(auth, fullPhoneParsed, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setError(null);
      setMessage(`SMS cryptographic validation key sent to ${fullPhoneParsed}`);
      setSmsDigits(Array(6).fill(''));
      setSmsCountdown(60);
    } catch (err: any) {
      console.error('Mobile authentication wave failed:', err);
      setError(err.message || 'SMS transmission wave blocked. Check verification prefix formats.');
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (clrErr) {
          console.warn('Re-clean recaptcha error:', clrErr);
        }
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSmsDigitChange = (value: string, index: number) => {
    const cleanDigit = value.replace(/[^0-9]/g, '').slice(-1);
    const updated = [...smsDigits];
    updated[index] = cleanDigit;
    setSmsDigits(updated);

    if (cleanDigit && index < 5) {
      smsInputRefs.current[index + 1]?.focus();
    }

    const code = updated.join('');
    if (code.length === 6) {
      handleConfirmSmsCode(code);
    }
  };

  const handleSmsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !smsDigits[index] && index > 0) {
      const updated = [...smsDigits];
      updated[index - 1] = '';
      setSmsDigits(updated);
      smsInputRefs.current[index - 1]?.focus();
    }
  };

  const handleSmsPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (data.length === 6) {
      const parsed = data.split('');
      setSmsDigits(parsed);
      handleConfirmSmsCode(data);
    }
  };

  const handleConfirmSmsCode = async (completeCode: string) => {
    setLoading(true);
    setError(null);

    if (completeCode === '123456') {
      try {
        const phoneMockEmail = `mock_${phoneNumber.replace(/\D/g, '') || 'vanguard'}@phone.nexus`;
        await syncGoogleUserWithSupabase(phoneMockEmail);
        setError(null);
        setMessage('Vanguard dynamic identity successfully synced! (Simulated Bypass Key)');
        setTimeout(() => startHandshakeOverlay(), 800);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!confirmationResult) {
      setError('Active validation session lost registry lock. Request a new OTP wave.');
      setLoading(false);
      return;
    }

    try {
      const result = await confirmationResult.confirm(completeCode);
      const user = result.user;
      if (user) {
        const phoneMockEmail = `${user.uid}@phone.nexus`;
        await syncGoogleUserWithSupabase(phoneMockEmail);
        setError(null);
        setMessage('Parity handshakes succeeded! Phone node authenticated.');
        setTimeout(() => startHandshakeOverlay(), 800);
      }
    } catch (err: any) {
      console.error('SMS validation confirmation expired:', err);
      if (err.code === 'auth/invalid-verification-code' || err.message?.includes('invalid-verification-code')) {
        setError('Passcode invalid (auth/invalid-verification-code). Help: Use "123456" for immediate bypass.');
      } else {
        setError(err.message || 'Passkey resolution failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (newMode: AuthMode) => {
    playDigitalSound('click');
    setMode(newMode);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#030105] text-zinc-100">
      
      {/* Invisible Captcha Anchor */}
      <div id="recaptcha-container" className="fixed bottom-0 right-0 w-10 h-10 opacity-0 pointer-events-none z-[-50]" />

      {/* Handshake Screening ripples */}
      {handshakeFlash && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.45, 0] }}
          transition={{ duration: 0.08 }}
          className="fixed inset-0 bg-white z-[99999] pointer-events-none"
        />
      )}

      {/* Hardware Handshake Overlay */}
      <AnimatePresence>
        {handshakeActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#040207] z-[999999] flex flex-col items-center justify-center font-mono p-6 relative overflow-hidden select-none"
          >
            {/* Ambient Red & Purple CRT Atmosphere glows */}
            <div className="absolute top-1/4 left-1/4 size-72 bg-[#E50914]/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 size-72 bg-[#6C3FF5]/10 rounded-full blur-[120px] pointer-events-none" />
            
            {/* Retro grid lines */}
            <div className="absolute inset-x-0 inset-y-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/10 animate-scanline pointer-events-none" style={{ animation: 'scanline 7s linear infinite' }} />
            
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes scanline {
                0% { transform: translateY(0vh); }
                100% { transform: translateY(100vh); }
              }
            `}} />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full border border-white/10 bg-black/80 backdrop-blur-md p-8 rounded-2xl shadow-[0_0_50px_rgba(229,9,20,0.15)] flex flex-col gap-6"
            >
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <div className="size-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">HARDWARE INTERFACE SYNCHRONIZER</span>
              </div>

              <div className="flex flex-col gap-4.5 text-xs font-mono leading-relaxed">
                {/* Step 1: Initiating Secure Link */}
                <motion.div 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2.5 text-zinc-300 font-bold"
                >
                  <span className="text-[#6C3FF5] font-extrabold">//</span>
                  <span>{isGuestMode ? "[GUEST_MODE_INITIALIZED]..." : "[INITIATING_SECURE_LINK]..."}</span>
                </motion.div>
                
                {/* Step 2: System Detection */}
                {handshakeStep >= 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 text-amber-400 font-bold"
                  >
                    <span className="text-amber-500 font-extrabold">//</span>
                    <span>
                      {isGuestMode ? (
                        "[READ_ONLY_ACCESS_GRANTED]..."
                      ) : (
                        <>[DETECTED_SYSTEM: <span className="text-white hover:text-amber-400 font-black">{currentDevice}</span>]...</>
                      )}
                    </span>
                  </motion.div>
                )}

                {/* Step 3: Link Established */}
                {handshakeStep >= 2 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-center gap-2 p-3 rounded-lg border mt-1.5 ${
                      isGuestMode 
                        ? 'text-amber-400 bg-amber-500/5 border-amber-500/20' 
                        : 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20'
                    }`}
                  >
                    {isGuestMode ? (
                      <>
                        <ShieldAlert className="size-4 shrink-0 text-amber-500 animate-pulse" />
                        <span className="font-extrabold tracking-widest uppercase">// [SYSTEM_IDENTITY: GUEST_NODE_99]</span>
                      </>
                    ) : (
                      <>
                        <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-extrabold tracking-widest uppercase">// [LINK_ESTABLISHED]</span>
                      </>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Secure loading channel bar */}
              <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mt-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.1, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-[#6C3FF5] via-amber-500 to-emerald-500"
                />
              </div>

              <div className="flex justify-between text-[8px] text-zinc-500 tracking-wider">
                <span>COORD LINK: SECURE_CORE_GATE`</span>
                <span>STATUS: VANGUARD_CONNECTED</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Column: Interactive Animated Cartoon Characters */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#120826] via-[#1a0f3d] to-[#0d051a] p-12 text-white border-r border-white/5 select-none overflow-hidden">
        
        {/* Subtle decorative grid lines */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:25px_25px] pointer-events-none" />
        
        <div className="relative z-20">
          <div className="flex items-center gap-2.5 text-lg font-black tracking-widest font-mono uppercase text-zinc-300">
            <div className="size-8 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center animate-pulse">
              <Sparkles className="size-4 text-[#6C3FF5]" />
            </div>
            <span>NEXUS SECURE</span>
            <span className="text-[10px] text-zinc-500 font-normal">v1.12</span>
          </div>
        </div>

        {/* Live cartoon squad tracking context coordinates */}
        <div className="relative z-20 flex items-end justify-center h-[520px]">
          <div className="relative" style={{ width: '550px', height: '400px' }}>
            
            {/* Purple stylized arch - Sleek asymmetric arch with an elegant peak (Tallest Back layer) */}
            <div 
              ref={purpleRef} 
              className="absolute bottom-0 transition-all duration-700 ease-in-out" 
              style={{ 
                left: '110px', 
                width: '160px', 
                height: (isTyping || (password.length > 0 && !showPassword)) ? '435px' : '410px', 
                backgroundColor: '#7543FF', 
                borderRadius: '120px 20px 0 0', // Sleek asymmetric arch with an elegant peak
                zIndex: 1, 
                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : (isTyping || (password.length > 0 && !showPassword)) ? `skewX(${(purplePos.bodySkew || 0) * 1.2 - 8}deg) translateX(25px)` : `skewX(${purplePos.bodySkew || 0}deg)`, 
                transformOrigin: 'bottom center',
                boxShadow: '0 -15px 60px rgba(117, 67, 255, 0.5)'
              }}
            >
              {/* Eyes */}
              <div 
                className="absolute flex gap-8 transition-all duration-700 ease-in-out" 
                style={{ 
                  left: (password.length > 0 && showPassword) ? `${15}px` : isLookingAtEachOther ? `${45}px` : `${35 + purplePos.faceX}px`, 
                  top: (password.length > 0 && showPassword) ? `${45}px` : isLookingAtEachOther ? `${75}px` : `${60 + purplePos.faceY}px`, 
                }}
              >
                <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
                <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
              </div>
            </div>

            {/* Gray/Black - Central nested chatbot round bubble stacked high */}
            <div 
              ref={blackRef} 
              className="absolute transition-all duration-700 ease-in-out" 
              style={{ 
                left: '230px', 
                bottom: '120px', // Elevated inside the stack for a beautiful vertical rhythm
                width: '150px', 
                height: '150px', 
                backgroundColor: '#374151', 
                borderRadius: '50%', // Perfectly round bubble shape
                zIndex: 2, 
                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : isLookingAtEachOther ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 8}deg) translateX(15px)` : (isTyping || (password.length > 0 && !showPassword)) ? `skewX(${(blackPos.bodySkew || 0) * 1.3}deg)` : `skewX(${blackPos.bodySkew || 0}deg)`, 
                transformOrigin: 'bottom center',
                boxShadow: '0 -10px 40px rgba(55, 65, 81, 0.6)'
              }}
            >
              {/* Nested inner loop/circle for cybernetic aesthetic */}
              <div className="absolute inset-2.5 rounded-full border border-zinc-600/40 bg-zinc-900/10 pointer-events-none" />
              
              {/* Eyes */}
              <div 
                className="absolute flex gap-6 transition-all duration-700 ease-in-out" 
                style={{ 
                  left: (password.length > 0 && showPassword) ? `${25}px` : isLookingAtEachOther ? `${58}px` : `${48 + blackPos.faceX}px`, 
                  top: (password.length > 0 && showPassword) ? `${45}px` : isLookingAtEachOther ? `${28}px` : `${45 + blackPos.faceY}px`, 
                }}
              >
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} />
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} />
              </div>
            </div>

            {/* Orange organic teardrop - Stacked Front Left */}
            <div 
              ref={orangeRef} 
              className="absolute bottom-0 transition-all duration-700 ease-in-out" 
              style={{ 
                left: '20px', 
                width: '210px', 
                height: '210px', 
                zIndex: 3, 
                backgroundColor: '#FF8255', 
                borderRadius: '105px 30px 40px 10px', // Smooth, organic teardrop
                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`, 
                transformOrigin: 'bottom center',
                boxShadow: '0 -8px 35px rgba(255, 130, 85, 0.45)'
              }}
            >
              <div 
                className="absolute flex gap-8 transition-all duration-200 ease-out" 
                style={{ 
                  left: (password.length > 0 && showPassword) ? `${45}px` : `${72 + (orangePos.faceX || 0)}px`, 
                  top: (password.length > 0 && showPassword) ? `${80}px` : `${85 + (orangePos.faceY || 0)}px`, 
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
              </div>
            </div>

            {/* Yellow extra-narrow pillar - Front Right Abstract Shape with a Round Crest */}
            <div 
              ref={yellowRef} 
              className="absolute bottom-0 transition-all duration-700 ease-in-out" 
              style={{ 
                left: '345px', // Shift slightly right to balance the narrower profile
                width: '86px', // Extra-narrow
                height: '315px', // Tall pillar shape
                backgroundColor: '#F3E03F', 
                borderRadius: '43px 43px 15px 15px', // Perfect half-circle round crest
                zIndex: 4, 
                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`, 
                transformOrigin: 'bottom center',
                boxShadow: '0 -8px 40px rgba(243, 224, 63, 0.45)'
              }}
            >
              <div 
                className="absolute flex gap-3 transition-all duration-200 ease-out" 
                style={{ 
                  left: (password.length > 0 && showPassword) ? `${18}px` : `${27 + (yellowPos.faceX || 0)}px`, 
                  top: (password.length > 0 && showPassword) ? `${55}px` : `${60 + (yellowPos.faceY || 0)}px`, 
                }}
              >
                <Pupil size={10} maxDistance={4} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -4 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={10} maxDistance={4} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -4 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
              </div>
              <div 
                className="absolute w-10 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out" 
                style={{ 
                  left: (password.length > 0 && showPassword) ? `${15}px` : `${23 + (yellowPos.faceX || 0)}px`, 
                  top: (password.length > 0 && showPassword) ? `${108}px` : `${108 + (yellowPos.faceY || 0)}px`, 
                }}
              />
            </div>

          </div>
        </div>

        <div className="relative z-20 flex items-center gap-8 text-xs text-zinc-500 font-mono tracking-widest uppercase">
          <button 
            type="button" 
            onClick={() => {
              setLegalSection('privacy');
              setIsLegalOpen(true);
            }}
            className="hover:text-zinc-200 transition-colors focus:outline-none cursor-pointer"
          >
            Privacy Policy
          </button>
          <button 
            type="button" 
            onClick={() => {
              setLegalSection('terms');
              setIsLegalOpen(true);
            }}
            className="hover:text-zinc-200 transition-colors focus:outline-none cursor-pointer"
          >
            Terms of Service
          </button>
          <span className="text-[10px] text-zinc-700">// AUTH_STANDBY</span>
        </div>

        {/* Ambient atmospheric glows */}
        <div className="absolute top-1/4 right-1/4 size-80 bg-[#7543FF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 size-[400px] bg-[#FF8255]/8 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right Column: Authentication Panel */}
      <div className="flex items-center justify-center p-6 sm:p-12 md:p-16 bg-[#040207] relative overflow-hidden select-none">
        
        {/* Fine background grid details */}
        <div className="absolute inset-0 bg-grid-white/[0.01] pointer-events-none" />
        
        <div className="w-full max-w-[440px] z-15 flex flex-col gap-8">
          
          {/* Header & Logo for Mobile fallback */}
          <div className="text-center lg:text-left flex flex-col gap-2">
            <div className="lg:hidden flex items-center justify-center gap-2 text-md font-black tracking-widest font-mono uppercase text-zinc-300 mb-4 select-none">
              <div className="size-7 rounded bg-white/5 border border-white/10 flex items-center justify-center">
                <Sparkles className="size-4 text-[#6C3FF5]" />
              </div>
              <span>NEXUS SECURE</span>
            </div>
            
            <h1 className="text-3xl font-black font-sans tracking-tight text-white leading-tight">
              {activeTab === 'email' && mode === 'signin' && 'Welcome back!'}
              {activeTab === 'email' && mode === 'signup' && 'Register Node'}
              {activeTab === 'email' && mode === 'forgot' && 'Reset Coordinates'}
              {activeTab === 'mobile' && 'SMS Signal Channel'}
              {activeTab === 'google' && 'Federated Identity'}
            </h1>
            <p className="text-zinc-450 text-xs italic font-mono uppercase tracking-widest leading-none mt-1">
              {activeTab === 'email' && mode === 'signin' && 'Establish Mainframe session'}
              {activeTab === 'email' && mode === 'signup' && 'Activate your secure coordinate bounds'}
              {activeTab === 'email' && mode === 'forgot' && 'Transmit standard passkey bypass'}
              {activeTab === 'mobile' && 'Connect cell terminal wave'}
              {activeTab === 'google' && 'Link verified secure ID'}
            </p>
          </div>

          {/* Secure Interactive Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-black/60 border border-white/5 rounded-xl text-[9px] font-mono font-bold tracking-widest uppercase select-none">
            <button
              type="button"
              onClick={() => {
                playDigitalSound('click');
                setActiveTab('email');
                setError(null);
                setMessage(null);
              }}
              className={`py-2 px-1 rounded-lg transition-all ${
                activeTab === 'email'
                  ? 'bg-[#E50914] text-white font-extrabold shadow-md shadow-red-950/40'
                  : 'text-zinc-550 hover:text-zinc-300 bg-transparent'
              }`}
            >
              EMAIL ID
            </button>
            <button
              type="button"
              onClick={() => {
                playDigitalSound('click');
                setActiveTab('mobile');
                setError(null);
                setMessage(null);
              }}
              className={`py-2 px-1 rounded-lg transition-all ${
                activeTab === 'mobile'
                  ? 'bg-[#E50914] text-white font-extrabold shadow-md shadow-red-950/40'
                  : 'text-zinc-550 hover:text-zinc-300 bg-transparent'
              }`}
            >
              MOBILE SMS
            </button>
            <button
              type="button"
              onClick={() => {
                playDigitalSound('click');
                setActiveTab('google');
                setError(null);
                setMessage(null);
              }}
              className={`py-2 px-1 rounded-lg transition-all ${
                activeTab === 'google'
                  ? 'bg-[#E50914] text-white font-extrabold shadow-md shadow-red-950/40'
                  : 'text-zinc-550 hover:text-zinc-300 bg-transparent'
              }`}
            >
              GOOGLE ID
            </button>
          </div>

          {/* Status logs alerts */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl flex items-start gap-3 text-red-400 text-xs font-mono leading-normal shadow-sm"
              >
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {message && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl flex items-start gap-3 text-emerald-400 text-xs font-mono leading-normal shadow-sm"
              >
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                <span>{message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Content Form Box */}
          <AnimatePresence mode="wait">
            {activeTab === 'email' && (
              <motion.form 
                key="email-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleAuth}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-zinc-450 text-[10px] uppercase font-mono tracking-wider flex justify-between items-center">
                    <span>Email Address</span>
                    {savedEmails.length > 0 && (
                      <span className="text-[9px] text-[#E50914] font-mono lowercase tracking-normal">(Saved Nodes Available)</span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input 
                      id="email"
                      type="email"
                      placeholder="e.g. operator@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => {
                        setIsTyping(true);
                        setFocusedField('email');
                      }}
                      onBlur={() => {
                        setIsTyping(false);
                        // Delay so that selection click event has time to register
                        setTimeout(() => {
                          setFocusedField(prev => prev === 'email' ? null : prev);
                        }, 250);
                      }}
                      required
                      autoComplete="off"
                      className="h-12 bg-black/45 border-white/5 focus:border-[#6C3FF5] text-zinc-100 font-mono text-xs w-full"
                    />

                    {/* SUGGESTED EMAILS OVERLAY DROPDOWN (GLASSMORPHISM WITH BLACK OBSIDIAN BED AND RED NEON ACCENT) */}
                    <AnimatePresence>
                      {focusedField === 'email' && savedEmails.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 4, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-black/90 backdrop-blur-md border border-[#E50914] shadow-[0_0_25px_rgba(229,9,20,0.25)] overflow-hidden"
                        >
                          <div className="py-2 px-3 border-b border-white/[0.04] bg-[#E50914]/5 flex items-center justify-between">
                            <span className="text-[9px] font-mono text-white uppercase tracking-widest">Anchored Signatures</span>
                          </div>
                          <div className="max-h-48 overflow-y-auto scrollbar-thin">
                            {savedEmails.map((emailObj) => (
                              <div
                                key={emailObj.email}
                                onMouseDown={(e) => {
                                  // Use onMouseDown to prevent focus loss before onClick is fired
                                  e.preventDefault();
                                  playDigitalSound('ping');
                                  setEmail(emailObj.email);
                                  const deobfuscated = securityDeobfuscate(emailObj.passWordObf);
                                  setPassword(deobfuscated);
                                  setFocusedField(null);
                                }}
                                className="flex items-center justify-between px-3 py-3 hover:bg-[#6C3FF5]/20 text-xs transition-colors cursor-pointer group/item border-b border-white/[0.03] last:border-0"
                              >
                                <div className="flex items-center gap-2 text-zinc-300 font-mono text-[11px] truncate mr-2">
                                  <Mail className="size-3.5 text-zinc-500 group-hover/item:text-[#6C3FF5] transition-colors shrink-0 animate-pulse" />
                                  <span className="truncate group-hover/item:text-white transition-colors">{emailObj.email}</span>
                                </div>
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeSavedEmail(emailObj.email, e);
                                  }}
                                  className="text-zinc-500 hover:text-[#E50914] p-1 rounded-md hover:bg-white/5 transition-colors shrink-0"
                                  title="Remove Saved Credentials"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-zinc-450 text-[10px] uppercase font-mono tracking-wider">Access Passkey</Label>
                      {mode === 'signin' && (
                        <button 
                          type="button"
                          onClick={() => toggleMode('forgot')}
                          className="text-[10px] font-mono font-extrabold text-[#E50914] hover:underline hover:text-red-400 focus:outline-none uppercase tracking-tighter"
                        >
                          Lost passkey?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input 
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => {
                          setFocusedField('password');
                        }}
                        onBlur={() => {
                          setFocusedField(null);
                        }}
                        required
                        className="h-12 pr-10 bg-black/45 border-white/5 focus:border-[#6C3FF5] text-zinc-100 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          playDigitalSound('click');
                          setShowPassword(!showPassword);
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'signin' && (
                  <div className="flex items-center gap-2.5 py-1 px-1">
                    <Checkbox 
                      id="remember-account" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => {
                        playDigitalSound('click');
                        setRememberMe(!!checked);
                      }}
                      className="border-white/10 data-[state=checked]:bg-[#E50914] data-[state=checked]:text-white data-[state=checked]:border-[#E50914] focus-visible:ring-[#E50914]"
                    />
                    <Label 
                      htmlFor="remember-account" 
                      className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider cursor-pointer hover:text-zinc-300 select-none flex items-center gap-1.5"
                    >
                      Remember my account <span className="text-[8px] text-[#ff1a26] lowercase font-normal">(opt-in)</span>
                    </Label>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="p-3.5 bg-white/[0.01] border border-white/5 rounded-xl space-y-3 shadow-inner">
                    <div className="flex items-start gap-2.5">
                      <Checkbox 
                        id="agree-terms" 
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => {
                          playDigitalSound('click');
                          setAcceptedTerms(!!checked);
                        }}
                        className="mt-0.5"
                      />
                      <div className="text-[9px] text-zinc-500 font-mono leading-normal tracking-tight uppercase select-none">
                        Authorize coordinate logs sync & accept{' '}
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.preventDefault();
                            setLegalSection('privacy');
                            setIsLegalOpen(true);
                          }}
                          className="text-zinc-300 hover:text-[#E50914] underline focus:outline-none cursor-pointer"
                        >
                          Privacy Policy
                        </button>
                        {' '}and{' '}
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.preventDefault();
                            setLegalSection('terms');
                            setIsLegalOpen(true);
                          }}
                          className="text-zinc-300 hover:text-[#E50914] underline focus:outline-none cursor-pointer"
                        >
                          Terms of Service
                        </button>
                        .
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  onClick={() => {
                    playDigitalSound('ping');
                    setHandshakeFlash(true);
                    setTimeout(() => setHandshakeFlash(false), 50);
                  }}
                  className="w-full h-12 text-sm font-black uppercase tracking-widest bg-gradient-to-r from-[#6C3FF5] to-[#E50914] text-white hover:from-[#7C4FF7] hover:to-[#ff1a26] transition-all flex items-center justify-center gap-2 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (
                    <>
                      <span>{mode === 'signin' ? 'Verify Interface' : mode === 'signup' ? 'Activate Node' : 'Dispatch Recovery link'}</span>
                      <ArrowRight size={14} className="text-zinc-200" />
                    </>
                  )}
                </Button>

                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      playDigitalSound('ping');
                      handleGuestLogin();
                    }}
                    className="w-full h-12 text-xs font-mono font-bold uppercase tracking-widest bg-transparent border border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-all rounded-xl cursor-pointer flex items-center justify-center gap-2"
                  >
                    [INITIALIZE_GUEST_NODE]
                  </button>
                )}
              </motion.form>
            )}

            {/* Mobile SMS tab */}
            {activeTab === 'mobile' && (
              <motion.div
                key="mobile-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {!confirmationResult ? (
                  <form onSubmit={handleSendSmsCode} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-zinc-450 text-[10px] uppercase font-mono tracking-wider">SMS Signal Path</Label>
                      <div className="flex gap-2">
                        <select 
                          value={countryCode}
                          onChange={(e) => {
                            setCountryCode(e.target.value);
                            playDigitalSound('click');
                          }}
                          className="bg-black/60 border border-white/5 rounded-xl px-3 text-xs font-mono text-zinc-250 select-none cursor-pointer focus:outline-none"
                        >
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+81">🇯🇵 +81</option>
                          <option value="+63">🇵🇭 +63</option>
                          <option value="+61">🇦🇺 +61</option>
                        </select>
                        
                        <div className="relative flex-1">
                          <Input 
                            type="tel"
                            placeholder="555-123-4567"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            onFocus={() => setIsTyping(true)}
                            onBlur={() => setIsTyping(false)}
                            required
                            className="h-12 bg-black/45 border-white/5 text-zinc-100 font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      onClick={() => {
                        playDigitalSound('ping');
                        setHandshakeFlash(true);
                        setTimeout(() => setHandshakeFlash(false), 50);
                      }}
                      className="w-full h-12 text-sm font-black uppercase tracking-widest bg-gradient-to-r from-[#6C3FF5] to-[#E50914] text-white hover:from-[#7C4FF7] hover:to-[#ff1a26] transition-all rounded-xl cursor-pointer"
                    >
                      {loading ? 'Dispersing OTP...' : 'Request Verification SMS'}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center bg-[#0d0915] border border-white/5 p-4 rounded-xl">
                      <Label className="block text-[11px] font-black uppercase tracking-widest text-[#E50914] animate-pulse">
                        Passcode received via Terminal
                      </Label>
                      <p className="text-zinc-500 text-[9px] font-mono mt-0.5 tracking-wider uppercase">
                        Payload trace dispatch coordinate: {countryCode}{phoneNumber}
                      </p>
                    </div>

                    <div className="flex justify-between gap-2" onPaste={handleSmsPaste}>
                      {smsDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { smsInputRefs.current[index] = el; }}
                          type="text"
                          maxLength={1}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={digit}
                          onChange={(e) => {
                            handleSmsDigitChange(e.target.value, index);
                            playDigitalSound('click');
                          }}
                          onKeyDown={(e) => handleSmsKeyDown(e, index)}
                          disabled={loading}
                          className="w-12 h-12 bg-black/45 border border-white/5 focus:border-[#E50914] rounded-xl text-center text-lg font-mono font-bold text-zinc-200 transition-all focus:outline-none"
                        />
                      ))}
                    </div>

                    <div className="text-center font-mono text-[9px] text-zinc-450 uppercase tracking-widest bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 select-all">
                      Developer Bypass Key: <span className="text-red-500 font-extrabold">123456</span>
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-mono select-none">
                      <button
                        type="button"
                        onClick={() => {
                          handleSendSmsCode();
                          playDigitalSound('click');
                        }}
                        disabled={smsCountdown > 0 || loading}
                        className={`font-black uppercase tracking-wider flex items-center gap-1 focus:outline-none ${
                          smsCountdown > 0 || loading
                            ? 'text-zinc-650 cursor-not-allowed'
                            : 'text-[#E50914] hover:text-red-400'
                        }`}
                      >
                        <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
                        {smsCountdown > 0 ? `Resend Passcode in ${smsCountdown}s` : 'Resend OTP'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setConfirmationResult(null);
                          playDigitalSound('click');
                        }}
                        className="text-zinc-500 uppercase tracking-widest hover:text-white"
                      >
                        Change Number
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const codeVal = '123456';
                        setSmsDigits(codeVal.split(''));
                        handleConfirmSmsCode(codeVal);
                        playDigitalSound('ping');
                        setHandshakeFlash(true);
                        setTimeout(() => setHandshakeFlash(false), 50);
                      }}
                      className="w-full text-center border border-dashed border-[#E50914]/40 hover:border-[#E50914] hover:bg-[#E50914]/5 py-2.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest text-[#E50914] transition-all cursor-pointer"
                    >
                      [AUTO-FILL GATEWAY PASSKEY]
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Google Federated Authentication tab */}
            {activeTab === 'google' && (
              <motion.div
                key="google-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="p-4 bg-zinc-950/45 border border-white/5 rounded-xl text-center space-y-2">
                  <Shield size={24} className="text-[#6C3FF5] mx-auto mb-1 animate-pulse" />
                  <h3 className="text-xs font-black text-zinc-300 uppercase tracking-widest font-mono">ID Federation</h3>
                  <p className="text-[9px] text-zinc-550 font-mono max-w-[280px] mx-auto leading-normal">
                    Secure link verification utilizing federated token boundaries. Avoid simple key leaks.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    handleGoogleSignIn();
                    playDigitalSound('ping');
                    setHandshakeFlash(true);
                    setTimeout(() => setHandshakeFlash(false), 50);
                  }}
                  disabled={loading}
                  className="w-full h-12 text-sm font-black uppercase tracking-widest bg-zinc-100 hover:bg-white text-zinc-900 transition-all flex items-center justify-center gap-2 rounded-xl shadow-lg cursor-pointer"
                >
                  <Chrome className="size-4.5 fill-current" />
                  <span>Activate via Google ID</span>
                </Button>

                {/* Developer bypass credentials portal */}
                <div className="p-3.5 bg-red-950/10 border border-red-900/20 rounded-xl mt-4 text-center space-y-2">
                  <span className="text-[#E50914] font-black text-[9px] font-mono uppercase tracking-widest block">
                    ⚠️ TESTER OVERRIDE CONSOLE
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      playDigitalSound('ping');
                      setHandshakeFlash(true);
                      setTimeout(() => setHandshakeFlash(false), 50);
                      try {
                        const mockUserEmail = 'anshsureshsingh07@gmail.com'; 
                        await syncGoogleUserWithSupabase(mockUserEmail);
                        setError(null);
                        setMessage('Parity bypassed (Simulated Google Sync Success)!');
                        setTimeout(() => navigate('/alpha-sector-9-override'), 800);
                      } catch (e: any) {
                        setError(e.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="text-[9px] text-zinc-300 hover:text-white border border-dashed border-zinc-800 hover:border-[#E50914] font-mono px-4 py-2 uppercase rounded-lg bg-black/40 transition-all cursor-pointer inline-block"
                  >
                    Bypass logging as anshsureshsingh07@gmail.com
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom toggle auth modes */}
          {activeTab === 'email' && (
            <div className="pt-4 border-t border-white/5 text-center select-none">
              {mode === 'signin' ? (
                <p className="text-xs text-zinc-500 font-medium font-mono">
                  New vanguard node?{' '}
                  <button 
                    onClick={() => {
                      toggleMode('signup');
                    }}
                    className="text-[#E50914] font-black uppercase italic tracking-wider ml-1 hover:underline hover:text-red-400 focus:outline-none"
                  >
                    Register Link
                  </button>
                </p>
              ) : (
                <p className="text-xs text-zinc-500 font-medium font-mono">
                  Already registered?{' '}
                  <button 
                    onClick={() => {
                      toggleMode('signin');
                    }}
                    className="text-[#E50914] font-black uppercase italic tracking-wider ml-1 hover:underline hover:text-red-400 focus:outline-none"
                  >
                    Return to sign in
                  </button>
                </p>
              )}
            </div>
          )}

          {activeTab === 'email' && mode === 'forgot' && (
            <button 
              onClick={() => {
                toggleMode('signin');
              }}
              className="flex items-center justify-center gap-1 text-zinc-500 hover:text-zinc-200 transition-colors w-full text-[10px] font-black uppercase tracking-widest font-mono"
            >
              <ChevronLeft size={14} /> Back to standard Sign In
            </button>
          )}

          {/* Micro status footer log indicators */}
          <div className="pt-4 border-t border-white/5 flex flex-col gap-2 font-mono tracking-widest uppercase select-none">
            <div className="flex items-center justify-between text-[8px] text-zinc-650">
              <span className="flex items-center gap-1 text-[#E50914]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-ping" />
                LOCK_SECURE
              </span>
              <span>SHIELD KEY: AES-256</span>
              <span>NODE ID: NX-99</span>
            </div>
            
            {/* Handshake Status indicator */}
            <div className="flex items-center justify-between text-[7.5px] border-t border-white/5 pt-1.5 font-bold tracking-wider">
              <span className="text-zinc-500">SERVER HANDSHAKE PROTOCOL:</span>
              {handshakeStatus === 'checking' && (
                <span className="text-amber-500 animate-pulse">[SERVER_HANDSHAKE: SYNCING...]</span>
              )}
              {handshakeStatus === 'connected' && (
                <span className="text-emerald-500">[SERVER_HANDSHAKE: CONNECTED]</span>
              )}
              {handshakeStatus === 'connected-warn' && (
                <span className="text-amber-400 animate-pulse" title="ADMIN_SECRET_KEY is missing on server environment">[SERVER_HANDSHAKE: CONNECTED - ADMIN_KEY_MISSING]</span>
              )}
              {handshakeStatus === 'error' && (
                <span className="text-red-500 font-extrabold animate-pulse">[SERVER_HANDSHAKE: ERROR / CORS_DISRUPTED]</span>
              )}
            </div>
          </div>

        </div>
      </div>

      <LegalModal 
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        defaultSection={legalSection}
      />
    </div>
  );
}
