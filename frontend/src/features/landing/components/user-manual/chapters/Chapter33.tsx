import React from 'react';
import { DocCallout } from '../DocCallout';
import { ScreenshotPlaceholder } from '../ScreenshotPlaceholder';

const Chapter33: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how authorized administrators configure clinic-wide behavior, manage branch operations, and customize the overall Malasakit experience.
      </p>

      {/* SECTION 33.1 — Overview */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        33.1 Overview
      </h3>
      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            The System Settings module centralizes the critical configurations that dictate how Malasakit operates across your entire organization. Rather than configuring individual modules separately, this administrative hub allows you to establish clinic-wide defaults, operational schedules, and user-experience preferences.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Changes made within this module can immediately impact how staff schedule appointments, how the system communicates with patients, and how operational data is formatted globally.
          </p>
          
          <DocCallout type="info" title="Administrative Access">
            Because System Settings influence the fundamental behavior of the clinic, access is strictly restricted. Only users with the highest level of permissions (typically Clinic Owners or explicit System Administrators) can view and modify these configurations.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 33.2 — General Settings */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        33.2 General Settings
      </h3>
      <p className="text-gray-700 font-body mb-6">Defining your global clinic identity.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            General Settings establish the baseline operational identity of your organization. These settings provide data consistency across all branches and modules within Malasakit.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Standard configurations found in this section include:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Clinic Information:</strong> Default master clinic name, global contact details, and organization logo.</li>
            <li><strong>Localization:</strong> The system-wide Timezone, which ensures all appointment bookings and automated reminders sync perfectly regardless of where a user logs in.</li>
            <li><strong>Formatting:</strong> Global defaults for Date format (e.g., MM/DD/YYYY vs DD/MM/YYYY) and Time format (12-hour vs 24-hour).</li>
            <li><strong>Language:</strong> Default user-interface language (if supported).</li>
          </ul>

          <ScreenshotPlaceholder label="Screenshot 33.1: General Settings Page. Highlight: General Settings section, Date and time configuration, Timezone selection, Default clinic settings, Save Changes button." />
        </div>
      </div>


      {/* SECTION 33.3 — Branch Settings */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        33.3 Branch Settings
      </h3>
      <p className="text-gray-700 font-body mb-6">Configuring individual location operations.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            While General Settings apply to the whole organization, Branch Settings allow clinics with multiple physical locations to operate independently while remaining integrated into the same central system.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Administrators can select a specific branch and define its unique operational parameters:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Branch Information:</strong> Specific address, local phone number, and branch manager details.</li>
            <li><strong>Operating Hours:</strong> The exact days and times this specific location is open, which directly restricts when appointments can be booked.</li>
            <li><strong>Booking Preferences:</strong> Branch-specific constraints for online booking lead times or cancellation windows.</li>
            <li><strong>Public Links:</strong> Accessing the unique, branch-specific Patient Portal link.</li>
          </ul>

          <ScreenshotPlaceholder label="Screenshot 33.2: Branch Settings Configuration. Highlight: Branch selection, Branch configuration form, Operating hours, Booking preferences, Save button." />
          
          <DocCallout type="important">
            Modifying a configuration within Branch Settings only affects the actively selected clinic branch. The changes do <em>not</em> automatically cascade or apply to other branches in your organization.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 33.4 — System Preferences */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        33.4 System Preferences
      </h3>
      <p className="text-gray-700 font-body mb-6">Customizing daily workflows and automation.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            System Preferences allow administrators to fine-tune the granular behavior of specific Malasakit modules to match the clinic's preferred workflows.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Examples of common customizable preferences include:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Appointment Defaults:</strong> Default duration for new appointments or default service types.</li>
            <li><strong>Calendar Preferences:</strong> Setting the default calendar view (Day vs Week) or defining the starting day of the week.</li>
            <li><strong>Communication Behavior:</strong> Global toggles for enabling/disabling SMS or Email automation.</li>
            <li><strong>Dashboard Layout:</strong> Which metrics or widgets appear by default on the home screen.</li>
          </ul>

          <ScreenshotPlaceholder label="Screenshot 33.3: System Preferences. Highlight: Preference toggles, Configuration switches, Default system options, Save Preferences button." />
        </div>
      </div>


      {/* SECTION 33.5 — Saving Changes */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        33.5 Saving Changes
      </h3>
      <p className="text-gray-700 font-body mb-6">Applying configurations securely.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Because settings affect the entire clinic, the system requires explicit confirmation before applying updates. The typical workflow is:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Navigate to the desired tab within System Settings.</li>
            <li>Modify the required configuration fields or toggles.</li>
            <li>Carefully review the changes.</li>
            <li>Click the explicit <strong>Save Changes</strong> button at the bottom of the section.</li>
            <li>Wait for the green success notification to confirm the backend has accepted the update.</li>
          </ol>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Note: While most settings (like operating hours) take effect immediately across the server, visual preferences (like Date Formatting) may require currently active staff users to refresh their browser page to see the changes.
          </p>

          <ScreenshotPlaceholder label="Screenshot 33.4: Successful Settings Update. Highlight: Success notification, Updated settings, Save confirmation message." />
        </div>
      </div>


      {/* SECTION 33.6 — Best Practices */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        33.6 Best Practices
      </h3>
      
      <DocCallout type="tip" title="Administration Tips">
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Check Timezones:</strong> Ensure the global Timezone is completely accurate, as this dictates the timing of all automated reminders and calendar slots.</li>
          <li><strong>Audit Operating Hours:</strong> Review branch operating hours before public holidays to prevent patients from booking online when the clinic is closed.</li>
          <li><strong>Test Major Changes:</strong> If you fundamentally alter appointment booking preferences, test the workflow yourself on the Patient Portal before informing staff.</li>
          <li><strong>Review New Features:</strong> Whenever Malasakit releases a major system update, check System Preferences for newly added configuration toggles.</li>
        </ul>
      </DocCallout>

    </>
  );
};

export default Chapter33;
