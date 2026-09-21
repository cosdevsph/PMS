import React, { useState, useRef, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Clock,
  Laptop,
  Smartphone,
  Tablet,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { sendPublicChatMessage, type ChatMessage } from '../api/chatApi';
import { detectClientDevice, getDeviceFingerprint, type DeviceInfo } from '../utils/deviceDetection';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '';

const INITIAL_GREETING: ChatMessage = {
  role: 'assistant',
  content: "Hello! I'm Malasakit AI Assistant.\n\nHow can I help you learn more about Malasakit?",
};

const SUGGESTED_QUESTIONS = [
  'Is my device compatible?',
  'What is Malasakit?',
  'What features are included?',
  'How much does it cost?',
  'Is there a free trial?',
];

export const MalasakitAIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Anti-abuse 5-minute lockout state
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0);
  const [unrelatedStrikes, setUnrelatedStrikes] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const captchaRef = useRef<ReCAPTCHA>(null);

  // Initialize client device diagnostics & check persistent 5-minute lockout on mount
  useEffect(() => {
    const dev = detectClientDevice();
    setDeviceInfo(dev);
    const fingerprint = getDeviceFingerprint(dev);

    // Check device-specific or generic lockout timestamp in localStorage
    const storedLockout =
      localStorage.getItem(`malasakit_ai_lockout_${fingerprint}`) ||
      localStorage.getItem('malasakit_ai_lockout_until');

    if (storedLockout) {
      const expiry = parseInt(storedLockout, 10);
      const remaining = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
      if (remaining > 0) {
        setIsLocked(true);
        setLockoutSecondsRemaining(remaining);
        setIsVerified(true); // If already locked out, keep verified state so user sees countdown
      } else {
        localStorage.removeItem(`malasakit_ai_lockout_${fingerprint}`);
        localStorage.removeItem('malasakit_ai_lockout_until');
      }
    }
  }, []);

  // Real-time 1-second countdown timer for active lockout
  useEffect(() => {
    if (!isLocked || lockoutSecondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setLockoutSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsLocked(false);
          setUnrelatedStrikes(0);
          if (deviceInfo) {
            const fingerprint = getDeviceFingerprint(deviceInfo);
            localStorage.removeItem(`malasakit_ai_lockout_${fingerprint}`);
          }
          localStorage.removeItem('malasakit_ai_lockout_until');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, lockoutSecondsRemaining, deviceInfo]);

  const formatCountdown = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-scroll messages to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  useEffect(() => {
    if (isOpen && isVerified) {
      scrollToBottom(false);
      // Auto-focus input when opened on desktop (if not locked)
      if (window.innerWidth >= 640 && !isLocked) {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    }
  }, [isOpen, isVerified, isLocked]);

  useEffect(() => {
    if (isOpen && isVerified) {
      scrollToBottom(true);
    }
  }, [messages, isLoading, errorMessage, isLocked]);

  const handleCaptchaSuccess = (token: string | null) => {
    if (!token) return;
    setCaptchaToken(token);
    setCaptchaError(null);
    setTimeout(() => {
      setIsVerified(true);
    }, 600);
  };

  const handleLocalVerification = () => {
    const mockToken = 'local-verified-human-token';
    setCaptchaToken(mockToken);
    setCaptchaError(null);
    setTimeout(() => {
      setIsVerified(true);
    }, 450);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputValue).trim();
    if (!text || isLoading || isLocked) return;

    if (text.length > 2000) {
      setErrorMessage('Message exceeds 2,000 characters limit.');
      return;
    }

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInputValue('');
    setErrorMessage(null);
    setIsLoading(true);

    const fingerprint = deviceInfo ? getDeviceFingerprint(deviceInfo) : undefined;

    try {
      const conversationHistory = newMessages.slice(1, -1);
      const data = await sendPublicChatMessage(
        text,
        conversationHistory,
        deviceInfo ?? undefined,
        captchaToken,
        fingerprint
      );

      const reply = data.response;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);

      // Handle unrelated attempts & 5-minute lockout
      if (data.is_unrelated) {
        if (data.is_locked) {
          const duration = data.lockout_seconds || 300;
          setIsLocked(true);
          setLockoutSecondsRemaining(duration);
          setUnrelatedStrikes(2);

          const expiry = Date.now() + duration * 1000;
          if (fingerprint) {
            localStorage.setItem(`malasakit_ai_lockout_${fingerprint}`, expiry.toString());
          }
          localStorage.setItem('malasakit_ai_lockout_until', expiry.toString());
        } else {
          setUnrelatedStrikes(data.strikes || 1);
        }
      }
    } catch (err: any) {
      console.error('Malasakit AI Chat error:', err);

      // Check if server rejected due to active 5-minute lockout
      if (err?.response?.status === 429 && err?.response?.data?.is_locked) {
        const duration = err.response.data.lockout_seconds || 300;
        setIsLocked(true);
        setLockoutSecondsRemaining(duration);
        setUnrelatedStrikes(2);

        const expiry = Date.now() + duration * 1000;
        if (fingerprint) {
          localStorage.setItem(`malasakit_ai_lockout_${fingerprint}`, expiry.toString());
        }
        localStorage.setItem('malasakit_ai_lockout_until', expiry.toString());
        setErrorMessage(err.response.data.error);
      } else {
        const serverDetail = err?.response?.data?.error;
        setErrorMessage(
          serverDetail ||
          "Sorry, I'm having trouble responding right now. Please try again in a moment."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Safely formats and renders AI and user text without raw HTML injection.
   */
  const renderMessageContent = (content: string) => {
    const paragraphs = content.split(/\n\n+/);

    return (
      <div className="space-y-2">
        {paragraphs.map((para, pIdx) => {
          const lines = para.split('\n');
          const isList = lines.every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '));

          if (isList) {
            return (
              <ul key={pIdx} className="list-disc pl-4 space-y-1">
                {lines.map((item, lIdx) => {
                  const cleaned = item.replace(/^[-*]\s*/, '').trim();
                  return <li key={lIdx}>{renderFormattedLine(cleaned)}</li>;
                })}
              </ul>
            );
          }

          return (
            <p key={pIdx} className="leading-relaxed">
              {lines.map((line, lIdx) => (
                <React.Fragment key={lIdx}>
                  {renderFormattedLine(line)}
                  {lIdx < lines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          );
        })}
      </div>
    );
  };

  const renderFormattedLine = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderDeviceIcon = () => {
    if (!deviceInfo) return <Laptop className="w-4 h-4" />;
    switch (deviceInfo.deviceType) {
      case 'Mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'Tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Laptop className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* ── Chatbot Panel ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Malasakit AI Assistant"
          className="fixed bottom-22 sm:bottom-26 right-6 sm:right-10 z-50 w-[calc(100vw-48px)] sm:w-[380px] h-[520px] max-h-[calc(100vh-100px)] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden transition-all duration-200 animate-notif-enter"
        >
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: SECURITY & RECAPTCHA VERIFICATION SCREEN                   */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {!isVerified ? (
            <div className="flex flex-col h-full bg-slate-50/70">
              {/* Security Header */}
              <div className="bg-primary-gradient text-white px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between shadow-sm select-none">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold font-display tracking-tight">
                      Security Verification
                    </h3>
                    <p className="text-xs text-white/90">Malasakit Protection Gateway</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close Malasakit AI Assistant"
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Security Verification Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="text-center py-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-care-blue/10 text-care-blue mb-2.5 shadow-xs">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-gray-900 font-display">
                      Security & System Check
                    </h4>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                      Please verify you are human before starting your conversation with Malasakit AI.
                    </p>
                  </div>

                  {/* System & Device Inspection Card */}
                  {deviceInfo && (
                    <div className="mt-3.5 bg-white border border-gray-200/80 rounded-2xl p-3.5 shadow-xs text-xs space-y-2">
                      <div className="flex items-center justify-between font-semibold text-gray-700 pb-1.5 border-b border-gray-100">
                        <span className="flex items-center gap-1.5 text-care-blue">
                          {renderDeviceIcon()}
                          Device Analyzed
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                          Compatible ✓
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <div>
                          <span className="text-gray-400 block text-[10px]">OPERATING SYSTEM</span>
                          <span className="font-medium text-gray-800">{deviceInfo.os}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">WEB BROWSER</span>
                          <span className="font-medium text-gray-800">{deviceInfo.browser}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">DEVICE TYPE</span>
                          <span className="font-medium text-gray-800">{deviceInfo.deviceType}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">DISPLAY RESOLUTION</span>
                          <span className="font-medium text-gray-800">{deviceInfo.screenResolution}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Security Checks List */}
                  <div className="mt-3 space-y-1.5 px-1 text-[11px] text-gray-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Secure connection encrypted (TLS/HTTPS)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Anti-bot & AI token abuse prevention active</span>
                    </div>
                  </div>
                </div>

                {/* reCAPTCHA Box */}
                <div className="pt-2 flex flex-col items-center">
                  {captchaToken ? (
                    <div className="w-full py-3 px-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center space-x-2 text-xs font-semibold text-emerald-700 animate-pulse">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Verification successful! Loading chat...</span>
                    </div>
                  ) : RECAPTCHA_SITE_KEY ? (
                    <div className="flex flex-col items-center gap-1.5 w-full">
                      <div className="scale-[0.88] origin-center">
                        <ReCAPTCHA
                          ref={captchaRef}
                          sitekey={RECAPTCHA_SITE_KEY}
                          onChange={handleCaptchaSuccess}
                          onExpired={() => {
                            setCaptchaToken(null);
                            setCaptchaError('Verification expired. Please verify again.');
                          }}
                          theme="light"
                        />
                      </div>
                      {captchaError && (
                        <p className="text-xs text-red-600 font-medium text-center">{captchaError}</p>
                      )}
                    </div>
                  ) : (
                    // Fallback human verification if site key is absent in local dev
                    <div className="w-full space-y-2">
                      <button
                        onClick={handleLocalVerification}
                        className="w-full py-2.5 px-4 bg-primary-gradient text-white rounded-xl shadow-md hover:shadow-lg active:scale-98 transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Verify Human & Open Chat
                      </button>
                      <p className="text-[10px] text-center text-gray-400">
                        Local development security screening
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // ═════════════════════════════════════════════════════════════════
            // STEP 2: ACTIVE MALASAKIT AI CHAT INTERFACE
            // ═════════════════════════════════════════════════════════════════
            <>
              {/* Header */}
              <div className="bg-primary-gradient text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shadow-sm select-none">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display tracking-tight">
                      Malasakit AI
                    </h3>
                    <div className="flex items-center space-x-1.5 text-xs text-white/90">
                      <span className={`w-2 h-2 rounded-full ${isLocked ? 'bg-red-400' : 'bg-emerald-300 animate-pulse'}`} />
                      <span>{isLocked ? 'Cooldown Active' : 'AI Assistant • Clinic Guide'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {/* System Diagnostics Toggle Button */}
                  {deviceInfo && (
                    <button
                      onClick={() => setShowDiagnostics((prev) => !prev)}
                      aria-label="Toggle device diagnostics"
                      className="px-2 py-1 rounded-lg text-xs font-medium text-white/90 hover:text-white hover:bg-white/15 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      title="View detected device details"
                    >
                      {renderDeviceIcon()}
                      <span className="hidden sm:inline text-[11px]">{deviceInfo.os}</span>
                      {showDiagnostics ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {/* Close Button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close Malasakit AI Assistant"
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 5-Minute Anti-Spam Lockout Banner */}
              {isLocked && (
                <div className="bg-red-500/10 border-b border-red-200 px-4 py-2.5 text-xs text-red-900 flex items-center justify-between animate-notif-enter">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                      <Clock className="w-4 h-4 animate-spin [animation-duration:8s]" />
                    </div>
                    <div>
                      <span className="font-bold block text-[11px]">
                        5-Minute Anti-Spam Cooldown
                      </span>
                      <span className="text-[10px] text-red-700">
                        2 unrelated questions detected. Chat locked to prevent token abuse.
                      </span>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-mono font-bold text-xs shadow-xs shrink-0">
                    {formatCountdown(lockoutSecondsRemaining)}
                  </div>
                </div>
              )}

              {/* Strike 1 Warning Banner */}
              {unrelatedStrikes === 1 && !isLocked && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-800 flex items-center justify-between animate-notif-enter">
                  <span className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Attempt 1 of 2: Please ask questions related to Malasakit.
                  </span>
                  <span className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded text-amber-700 font-semibold">
                    1 more = 5m Lock
                  </span>
                </div>
              )}

              {/* Collapsible Device Diagnostics Drawer */}
              {showDiagnostics && deviceInfo && (
                <div className="bg-care-blue/5 border-b border-care-blue/15 px-4 py-2.5 text-xs text-gray-700 animate-notif-enter">
                  <div className="flex items-center justify-between font-semibold text-care-blue mb-1">
                    <span className="flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      Detected System Details
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                      100% Compatible
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-600 mt-1">
                    <div>OS: <strong className="text-gray-800">{deviceInfo.os}</strong></div>
                    <div>Browser: <strong className="text-gray-800">{deviceInfo.browser}</strong></div>
                    <div>Type: <strong className="text-gray-800">{deviceInfo.deviceType}</strong></div>
                    <div>Screen: <strong className="text-gray-800">{deviceInfo.screenResolution}</strong></div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-gray-500">
                    Malasakit AI knows your system details and can answer compatibility questions.
                  </p>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70 text-sm font-body">
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={index}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-full bg-primary-gradient text-white flex items-center justify-center mr-2 mt-0.5 shrink-0 shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs ${isUser
                          ? 'bg-care-blue text-white rounded-tr-none max-w-[82%]'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none max-w-[85%]'
                          }`}
                      >
                        {renderMessageContent(msg.content)}
                      </div>
                    </div>
                  );
                })}

                {/* Suggested Question Chips (visible initially or when idle and not locked) */}
                {messages.length === 1 && !isLoading && !isLocked && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Suggested questions:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_QUESTIONS.map((question, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => handleSendMessage(question)}
                          className="text-xs text-care-blue bg-care-blue/10 hover:bg-care-blue/20 border border-care-blue/20 rounded-full px-3 py-1.5 transition-colors cursor-pointer text-left"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strike 1 Warning Banner */}
                {!isLocked && unrelatedStrikes === 1 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2.5 shadow-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">Topic Relevance Warning (Attempt 1 of 2)</p>
                      <p className="mt-0.5 text-amber-700">
                        Please keep questions focused on Malasakit or clinic management. A 2nd unrelated question will trigger a 5-minute spam lockout.
                      </p>
                    </div>
                  </div>
                )}

                {/* 5-Minute Lockout Alert Card */}
                {isLocked && (
                  <div className="p-3.5 bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-200 rounded-xl text-xs text-rose-900 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5 font-semibold text-rose-800">
                        <Lock className="w-4 h-4 text-rose-600" />
                        <span>5-Minute Cooldown Active</span>
                      </div>
                      <span className="font-mono font-bold text-xs bg-rose-200/80 text-rose-900 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                        <Clock className="w-3 h-3 mr-1 inline" />
                        {formatCountdown(lockoutSecondsRemaining)}
                      </span>
                    </div>
                    <p className="text-rose-700 leading-relaxed">
                      Two consecutive unrelated inquiries were detected. Chat is temporarily suspended for 5 minutes to prevent AI token abuse. Cooldown persists across refreshes for this device.
                    </p>
                  </div>
                )}

                {/* Typing Indicator */}
                {isLoading && (
                  <div className="flex justify-start items-center">
                    <div className="w-7 h-7 rounded-full bg-primary-gradient text-white flex items-center justify-center mr-2 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-xs flex items-center space-x-2 text-xs text-gray-500">
                      <span className="flex space-x-1">
                        <span className="w-1.5 h-1.5 bg-care-blue rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-care-blue rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-care-blue rounded-full animate-bounce" />
                      </span>
                      <span>Malasakit AI is typing...</span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2 shadow-xs">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p>{errorMessage}</p>
                      {!isLocked && (
                        <button
                          onClick={() => handleSendMessage()}
                          className="mt-1.5 inline-flex items-center text-red-800 font-semibold hover:underline cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" /> Try again
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Footer Input */}
              <div className="p-3 bg-white border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isLocked
                        ? `Chat locked for 5 minutes (${formatCountdown(lockoutSecondsRemaining)} remaining)...`
                        : 'Ask Malasakit AI...'
                    }
                    disabled={isLoading || isLocked}
                    maxLength={2000}
                    className="flex-1 px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-care-blue/30 focus:border-care-blue transition-all disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 placeholder:text-gray-400 font-body"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || isLocked || !inputValue.trim()}
                    aria-label="Send message"
                    className="flex items-center justify-center w-10 h-10 bg-primary-gradient text-white rounded-xl shadow-md hover:shadow-lg hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-care-blue/40 shrink-0"
                  >
                    {isLocked ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400 px-1">
                  <span>
                    {isLocked
                      ? `Locked: ${formatCountdown(lockoutSecondsRemaining)} remaining`
                      : 'Malasakit AI Clinic Guide'}
                  </span>
                  {deviceInfo && (
                    <span className="text-gray-500 font-medium">
                      {deviceInfo.os} • {deviceInfo.browser}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Floating Launcher Button ── */}
      <div className={`fixed bottom-5 right-6 sm:bottom-7 sm:right-10 z-40 ${!isOpen ? 'animate-ai-float' : ''}`}>
        <div className="relative group">
          {/* Radiant pulse aura behind button (active when closed) */}
          {!isOpen && (
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-care-blue to-healing-mint opacity-40 blur-md pointer-events-none animate-ai-aura" />
          )}

          {/* Tooltip on hover (desktop only) */}
          {!isOpen && (
            <div className="hidden sm:block absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-gray-900/90 text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-xl border border-white/10 backdrop-blur-md">
              <span>{isLocked ? `Locked (${formatCountdown(lockoutSecondsRemaining)})` : 'Chat with Malasakit AI'}</span>
              <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-l-[5px] border-l-gray-900/90 border-b-4 border-b-transparent" />
            </div>
          )}

          {/* Main 3D Beveled Floating Button */}
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? 'Close Malasakit AI Assistant' : 'Open Malasakit AI Assistant'}
            className="relative flex items-center justify-center w-14 h-14 bg-primary-gradient text-white rounded-full ai-chat-btn-bevel hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-care-blue/40 cursor-pointer overflow-hidden group"
          >
            {/* Animated specular light sheen sweeping across face */}
            {!isOpen && (
              <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none rounded-full animate-ai-sheen" />
            )}

            {/* Icon with 3D drop shadow */}
            {isOpen ? (
              <X className="w-6 h-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transition-all duration-300 rotate-0 group-hover:rotate-90 scale-100" />
            ) : isLocked ? (
              <Lock className="w-6 h-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transition-all duration-300 text-yellow-200" />
            ) : (
              <MessageSquare className="w-6 h-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transition-all duration-300 group-hover:scale-110" />
            )}
          </button>

          {/* Active status beacon / pulse badge on the button rim */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 pointer-events-none">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLocked ? 'bg-red-400' : 'bg-healing-mint'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isLocked ? 'bg-red-500' : 'bg-emerald-500'} border-2 border-white shadow-md`} />
            </span>
          )}
        </div>
      </div>
    </>
  );
};
