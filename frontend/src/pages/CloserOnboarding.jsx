import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Mail, 
  User, 
  CheckCircle2,
  Loader2,
  Video,
  Calendar,
  Briefcase,
  Phone,
  Check,
  AlertCircle
} from 'lucide-react';

export default function CloserOnboarding() {
  const [currentStep, setCurrentStep] = useState(0); // Start at 0 for instructions
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    personalEmail: ''
  });
  const [createdAccount, setCreatedAccount] = useState({
    email: '',
    password: ''
  });
  const [twilioNumber, setTwilioNumber] = useState('');

  const totalSteps = 6; // Now 6 steps (0=instructions, 1-5=original steps)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // TODO: API call to create Google Workspace account
    // For now, simulate the process
    setTimeout(() => {
      setCreatedAccount({
        email: `${formData.firstName.toLowerCase()}@tjr-trades.com`,
        password: 'TempPassword123!'
      });
      setIsProcessing(false);
      setCurrentStep(2); // Was 2, now goes to step 2
    }, 2000);
  };

  const handleSendZoomInvite = () => {
    setIsSendingInvite(true);
    
    // TODO: API call to send Zoom invitation
    // For now, simulate the process
    setTimeout(() => {
      setIsSendingInvite(false);
      setInviteSent(true);
    }, 1500);
  };

  const handleSendCalendlyInvite = () => {
    setIsSendingInvite(true);
    
    // TODO: API call to send Calendly invitation
    // For now, simulate the process
    setTimeout(() => {
      setIsSendingInvite(false);
      setInviteSent(true);
    }, 1500);
  };

  const handleSendGHLInvite = () => {
    setIsSendingInvite(true);
    
    // TODO: API call to send GHL invitation + purchase Twilio number
    // For now, simulate the process
    setTimeout(() => {
      setTwilioNumber('+1 (650) 555-0123'); // Dummy number
      setIsSendingInvite(false);
      setInviteSent(true);
    }, 1500);
  };

  const handleContinueToCalendly = () => {
    setCurrentStep(4); // Was 4, now 4
    setInviteSent(false);
  };

  const handleContinueToGHL = () => {
    setCurrentStep(5); // Was 5, now 5
    setInviteSent(false);
  };

  const handleFinish = () => {
    // TODO: Redirect to dashboard or show completion message
    alert('Onboarding complete! You can now close this page.');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome to TJR Sales Team
          </h1>
          <p className="text-gray-600 text-lg">
            Let's get you onboarded with all your tools and accounts
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-black"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* STEP 0: Instructions / Welcome */}
          {currentStep === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                    <Briefcase className="h-10 w-10 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Welcome to TJR Sales Team
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Let's get you set up with all your tools and accounts
                  </p>
                </div>

                <div className="space-y-6 mb-8">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Step 1: Google Workspace (@tjr-trades.com)
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          Your business email for <strong>all customer communication</strong>. This is NOT for personal use. 
                          All calls and conversations with customers must go through this account.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <Video className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Step 2: Zoom Meeting Account
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          Associated with your @tjr-trades.com account. You'll get personal + team meeting links for sales calls. 
                          <strong className="text-red-700"> All calls are RECORDED</strong>. Sales calls ONLY - no personal use.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Step 3: Calendly Scheduling
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          Book and manage sales appointments. Integrated with your @tjr-trades.com calendar. 
                          <strong> Sales use only</strong> - this is for customer-facing bookings.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Step 4: GoHighLevel (GHL) CRM
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          Customer relationship management system. Track all leads and deals here. 
                          You'll also get your <strong>650 area code sales number</strong> for making calls.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        Important Notes
                      </p>
                      <ul className="text-sm text-amber-800 space-y-1">
                        <li>• All accounts are for <strong>business use only</strong></li>
                        <li>• Your @tjr-trades.com email is your primary work identity</li>
                        <li>• All customer interactions must happen through these platforms</li>
                        <li>• Never share login credentials with anyone</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base"
                >
                  <span>Start Onboarding</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 1: Initial Form */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Your Information
                </h2>
                <p className="text-gray-600 mb-8">
                  Please provide your basic information to get started
                </p>

                <form onSubmit={handleSubmitForm} className="space-y-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                        placeholder="John"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  {/* Personal Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Personal Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        name="personalEmail"
                        required
                        value={formData.personalEmail}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                        placeholder="john.doe@gmail.com"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      We'll send your account details to this email
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Creating Your Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Google Workspace Success */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Google Workspace Account Created!
                  </h2>
                  <p className="text-gray-600">
                    Your company email has been set up successfully
                  </p>
                </div>

                {/* Account Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                    Your Account Details
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Company Email Address
                      </label>
                      <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg p-3">
                        <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="font-mono text-sm text-gray-900 font-semibold">
                          {createdAccount.email}
                        </span>
                      </div>
                    </div>

                    {/* Temporary Password */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Temporary Password
                      </label>
                      <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg p-3">
                        <div className="flex-1 font-mono text-sm text-gray-900 font-semibold">
                          {createdAccount.password}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        ⚠️ You'll be asked to change this password on your first login
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">
                    📧 Email Sent!
                  </h3>
                  <p className="text-sm text-blue-800">
                    We've sent these credentials to <strong>{formData.personalEmail}</strong>. Please check your inbox for the welcome email.
                  </p>
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base"
                >
                  <span>Continue to Zoom Setup</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Zoom Invitation */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                    <Video className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Add Zoom Account
                  </h2>
                  <p className="text-gray-600">
                    Set up your video conferencing account
                  </p>
                </div>

                {/* Prefilled Information */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                    Account Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Name</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formData.firstName} {formData.lastName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Email</span>
                      <span className="text-sm font-semibold text-gray-900 font-mono">
                        {createdAccount.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Invitation Status */}
                {!inviteSent ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                      📹 Ready to Send Zoom Invitation
                    </h3>
                    <p className="text-sm text-blue-800">
                      Click the button below to send a Zoom invitation to <strong>{createdAccount.email}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-green-900 mb-2">
                          ✅ Zoom Invitation Sent!
                        </h3>
                        <p className="text-sm text-green-800">
                          Please check <strong>{createdAccount.email}</strong> for your Zoom invitation email and follow the instructions to activate your account.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!inviteSent ? (
                  <button
                    onClick={handleSendZoomInvite}
                    disabled={isSendingInvite}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50"
                  >
                    {isSendingInvite ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Sending Invitation...</span>
                      </>
                    ) : (
                      <>
                        <Video className="h-5 w-5" />
                        <span>Send Zoom Invitation</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleContinueToCalendly}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base"
                  >
                    <span>Continue to Calendly Setup</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 4: Calendly Invitation */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Add Calendly Account
                  </h2>
                  <p className="text-gray-600">
                    Set up your scheduling and calendar integration
                  </p>
                </div>

                {/* Prefilled Information */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                    Account Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Name</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formData.firstName} {formData.lastName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Email</span>
                      <span className="text-sm font-semibold text-gray-900 font-mono">
                        {createdAccount.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Invitation Status */}
                {!inviteSent ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                      📅 Ready to Send Calendly Invitation
                    </h3>
                    <p className="text-sm text-blue-800">
                      Click the button below to send a Calendly invitation to <strong>{createdAccount.email}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-green-900 mb-2">
                          ✅ Calendly Invitation Sent!
                        </h3>
                        <p className="text-sm text-green-800">
                          Please check <strong>{createdAccount.email}</strong> for your Calendly invitation email and follow the instructions to activate your account.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!inviteSent ? (
                  <button
                    onClick={handleSendCalendlyInvite}
                    disabled={isSendingInvite}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50"
                  >
                    {isSendingInvite ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Sending Invitation...</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="h-5 w-5" />
                        <span>Send Calendly Invitation</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleContinueToGHL}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base"
                  >
                    <span>Continue to GHL Setup</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 5: GHL Invitation + Completion */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                {!inviteSent ? (
                  <>
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                        <Briefcase className="h-8 w-8 text-purple-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Add GoHighLevel Account
                      </h2>
                      <p className="text-gray-600">
                        Set up your CRM and get your sales phone number
                      </p>
                    </div>

                    {/* Prefilled Information */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                        Account Information
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-600">Name</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formData.firstName} {formData.lastName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-t border-gray-200">
                          <span className="text-sm text-gray-600">Email</span>
                          <span className="text-sm font-semibold text-gray-900 font-mono">
                            {createdAccount.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Invitation Status */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                      <h3 className="text-sm font-semibold text-blue-900 mb-2">
                        🚀 Final Step - GHL & Phone Number
                      </h3>
                      <p className="text-sm text-blue-800">
                        Click the button below to send your GHL invitation and automatically assign you a 650 area code phone number for sales calls.
                      </p>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={handleSendGHLInvite}
                      disabled={isSendingInvite}
                      className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50"
                    >
                      {isSendingInvite ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Setting Up...</span>
                        </>
                      ) : (
                        <>
                          <Briefcase className="h-5 w-5" />
                          <span>Send GHL Invitation & Assign Number</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Completion Success */}
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                        <Check className="h-10 w-10 text-green-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-3">
                        All Set! Welcome to the Team! 🎉
                      </h2>
                      <p className="text-gray-600 text-lg">
                        Your onboarding is complete
                      </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="space-y-4 mb-8">
                      {/* Google Workspace */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Mail className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">Google Workspace</p>
                            <p className="text-xs text-gray-600 truncate font-mono">{createdAccount.email}</p>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        </div>
                      </div>

                      {/* Zoom */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Video className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Zoom</p>
                            <p className="text-xs text-gray-600">Invitation sent</p>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        </div>
                      </div>

                      {/* Calendly */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Calendly</p>
                            <p className="text-xs text-gray-600">Invitation sent</p>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        </div>
                      </div>

                      {/* GHL */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">GoHighLevel</p>
                            <p className="text-xs text-gray-600">Invitation sent</p>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Phone className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Sales Phone Number</p>
                            <p className="text-xs text-gray-600 font-mono font-semibold">{twilioNumber}</p>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        </div>
                      </div>
                    </div>

                    {/* Next Steps */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                      <h3 className="text-sm font-semibold text-blue-900 mb-3">
                        📧 What's Next?
                      </h3>
                      <ul className="text-sm text-blue-800 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0">•</span>
                          <span>Check <strong>{formData.personalEmail}</strong> for all invitation emails</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0">•</span>
                          <span>Accept all invitations and set up your accounts</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0">•</span>
                          <span>Your sales manager will reach out to schedule your training</span>
                        </li>
                      </ul>
                    </div>

                    {/* Finish Button */}
                    <button
                      onClick={handleFinish}
                      className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base"
                    >
                      <Check className="h-5 w-5" />
                      <span>Complete Onboarding</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}