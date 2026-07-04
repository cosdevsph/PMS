import React from 'react';
import { DocCallout } from '../DocCallout';
import { ScreenshotPlaceholder } from '../ScreenshotPlaceholder';

const Chapter34: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how Malasakit's built-in security features protect clinic data, secure patient information, and maintain strict operational accountability.
      </p>

      {/* SECTION 34.1 — Overview */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        34.1 Overview
      </h3>
      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            In modern healthcare, protecting sensitive operational and patient data is paramount. Malasakit is designed with multiple overlapping layers of security intended to protect clinical documentation, financial ledgers, staff credentials, and overall clinic operations from unauthorized access.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            These security features work transparently in the background, verifying identities, enforcing permissions, and logging activities to ensure complete accountability for every action performed within the platform.
          </p>
          
          <DocCallout type="info" title="Security First">
            Protecting patient information is a core responsibility of every clinic. Malasakit's security mechanisms are designed to help you maintain strict confidentiality, operational integrity, and compliance.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 34.2 — Password Security */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        34.2 Password Security
      </h3>
      <p className="text-gray-700 font-body mb-6">Securing the first line of defense.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            User passwords are the primary gatekeeper to your clinic's data. Malasakit strictly enforces password policies and securely hashes all credentials on the backend—meaning your password is <em>never</em> stored or displayed in plain text, even to system administrators.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            To maintain a secure environment, clinic management must enforce basic password best practices among staff:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Complexity:</strong> Create strong passwords using a mix of letters, numbers, and symbols.</li>
            <li><strong>Uniqueness:</strong> Do not reuse passwords from other personal accounts.</li>
            <li><strong>Isolation:</strong> Never share passwords. Every staff member must log in using their own unique credentials.</li>
            <li><strong>Rotation:</strong> Update passwords periodically, especially if you suspect an account has been compromised.</li>
          </ul>

          <ScreenshotPlaceholder label="Screenshot 34.1: Change Password Screen. Highlight: Current Password, New Password, Confirm Password, Save Password button." />
        </div>
      </div>


      {/* SECTION 34.3 — One-Time Password (OTP) */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        34.3 One-Time Password (OTP)
      </h3>
      <p className="text-gray-700 font-body mb-6">Adding identity verification layers.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            For critical system actions, a standard password is not enough. Malasakit utilizes <strong>One-Time Password (OTP)</strong> verification during sensitive workflows like Owner registration, email verification, or password recovery.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            The verification workflow is simple but highly secure:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>The user enters their registered email address.</li>
            <li>Malasakit generates and emails a secure, randomized verification code.</li>
            <li>The user retrieves the code and enters it into the system prompt.</li>
            <li>The system validates the code and authorizes the user to proceed.</li>
          </ol>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            For security purposes, these OTP codes expire automatically after a very short period.
          </p>

          <ScreenshotPlaceholder label="Screenshot 34.2: OTP Verification Page. Highlight: Email address, OTP input fields, Verify button, Resend Code option (if available)." />
          
          <DocCallout type="important">
            OTP codes are the digital equivalent of a physical key. They should <strong>never</strong> be shared with anyone—not even other clinic staff, managers, or technical support personnel.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 34.4 — Role-Based Access Control (RBAC) */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        34.4 Role-Based Access Control (RBAC)
      </h3>
      <p className="text-gray-700 font-body mb-6">Enforcing strict modular permissions.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Not all staff require access to every part of the system. Malasakit enforces <strong>Role-Based Access Control (RBAC)</strong> to securely limit what individual users can view and modify based entirely on their assigned job function.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Owners</strong> have full, unrestricted administrative control over the entire organization.</li>
            <li><strong>Managers</strong> oversee branch-specific operations and configuration.</li>
            <li><strong>Practitioners</strong> have targeted access to clinical modules, patient care records, and scheduling.</li>
            <li><strong>Finance</strong> users manage invoices, billing, and payment processing.</li>
            <li><strong>Front Desk</strong> users handle daily scheduling and patient intake.</li>
          </ul>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            This security is enforced at the server level. Even if a restricted user attempts to bypass the navigation menu and access a protected page directly via its URL, the system will actively block the request.
          </p>

          <ScreenshotPlaceholder label="Screenshot 34.3: Role Permissions Page. Highlight: List of roles, Assigned permissions, Enabled/disabled access indicators." />
        </div>
      </div>


      {/* SECTION 34.5 — User Sessions */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        34.5 User Sessions
      </h3>
      <p className="text-gray-700 font-body mb-6">Protecting active system access.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Upon a successful login, Malasakit establishes a secure "session" that keeps the user authenticated as they move between different modules. This session continuously validates the user's identity to protect against unauthorized access or hijacking.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            If configured, the system may automatically terminate (log out) sessions that have been inactive for an extended period.
          </p>

          <ScreenshotPlaceholder label="Screenshot 34.4: User Account Menu with Logout Option. Highlight: User profile menu, Logout button, Session-related options (if available)." />
          
          <DocCallout type="tip">
            Always click <strong>Logout</strong> before leaving a workstation unattended—especially when using a shared computer at a busy front desk—to completely terminate your active session and prevent unauthorized access.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 34.6 — Audit Logs */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        34.6 Audit Logs
      </h3>
      <p className="text-gray-700 font-body mb-6">Maintaining strict operational accountability.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            To ensure complete accountability, Malasakit quietly records every significant action performed in the system into an immutable <strong>Audit Log</strong>.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Administrators can review these logs to monitor activity, investigate errors, or support compliance requirements. The system routinely logs events such as:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>User logins and logouts.</li>
            <li>The creation, modification, deletion, or archival of any system records (e.g., Appointments, Invoices, Patient Profiles).</li>
            <li>Security-related actions, such as password changes or permission updates.</li>
          </ul>

          <ScreenshotPlaceholder label="Screenshot 34.5: Audit Logs Page. Highlight: Timestamp, User, Activity performed, Module, Action details." />
          
          <DocCallout type="info">
            Audit Logs provide an objective historical record of activities. To maintain their integrity, standard users are strictly forbidden from editing or deleting entries within the log.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 34.7 — Best Practices */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        34.7 Best Practices
      </h3>
      
      <DocCallout type="tip" title="Security Tips">
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Unique Credentials:</strong> Use strong, unique passwords for your Malasakit account and never share your login credentials with colleagues.</li>
          <li><strong>Update Contact Info:</strong> Keep your email address up to date to ensure you can receive OTP verification codes if your password needs resetting.</li>
          <li><strong>Principle of Least Privilege:</strong> Administrators should assign staff the absolute minimum permissions necessary to perform their specific job role.</li>
          <li><strong>Routine Audits:</strong> Review the Audit Logs regularly to identify any unusual or unauthorized behavior early.</li>
          <li><strong>Secure Workstations:</strong> Always log out of the system before stepping away from a shared clinic computer.</li>
          <li><strong>Report Issues:</strong> If you notice suspicious account activity, report it to your Clinic Owner or Administrator immediately.</li>
        </ul>
      </DocCallout>

    </>
  );
};

export default Chapter34;
