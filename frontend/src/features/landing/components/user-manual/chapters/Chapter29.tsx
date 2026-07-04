import React from 'react';
import { DocCallout } from '../DocCallout';
import { ScreenshotPlaceholder } from '../ScreenshotPlaceholder';

const Chapter29: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to monitor clinic growth, track appointment history, and evaluate long-term patient loyalty using Patient Reports.
      </p>

      {/* IMPORTANT CONCEPT — Patient Analytics Workflow */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-4">Patient Analytics Workflow</h3>
        
        <p className="text-gray-700 font-body mb-4">
          The Patient Reports module transforms raw appointment data into meaningful business intelligence. By tracking how patients interact with your clinic over time—from their initial registration to their recurring follow-ups—these reports provide actionable insights to guide operational planning and marketing initiatives.
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] mb-6 text-center overflow-x-auto">
          <p className="text-sm font-semibold text-gray-800 mb-2">Patient Data Lifecycle</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[13px] text-gray-600 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded border border-gray-200">Patient Registration</span>
            <span className="text-sky-400">→</span>
            <span className="px-3 py-1.5 bg-gray-50 rounded border border-gray-200">Appointments</span>
            <span className="text-sky-400">→</span>
            <span className="px-3 py-1.5 bg-gray-50 rounded border border-gray-200">Visits</span>
            <span className="text-sky-400">→</span>
            <span className="px-3 py-1.5 bg-amber-50 rounded border border-amber-200">Patient Reports</span>
            <span className="text-sky-400">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200">Business Insights</span>
          </div>
        </div>

        <ScreenshotPlaceholder label="Diagram 29.1: Patient Analytics Workflow. Caption: 'Patient Reports transform patient activity into meaningful operational insights.'" />
      </div>


      {/* SECTION 29.1 — New Patients */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        29.1 New Patients
      </h3>
      <p className="text-gray-700 font-body mb-6">Measuring initial clinic growth and acquisition.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            New Patient Reports identify individuals who registered or completed their <em>very first</em> appointment during the selected reporting period. This report is critical for evaluating the success of marketing campaigns and tracking overall clinic growth.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Using the report filters (Date Range, Clinic Branch, Assigned Practitioner), staff can view specific insights such as:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Total New Patients:</strong> The aggregate volume of new acquisitions.</li>
            <li><strong>Registration Trends:</strong> Visual charts highlighting spikes or dips in new sign-ups.</li>
            <li><strong>First Appointment Date & Assigned Practitioner:</strong> Details on how new patients are entering the clinic's ecosystem.</li>
          </ul>

          <ScreenshotPlaceholder label="Screenshot 29.1: New Patient Report. Highlight New patient statistics. Caption: 'New Patient Reports summarize clinic growth through newly registered patients.'" />
          <ScreenshotPlaceholder label="Screenshot 29.2: New patient filters. Highlight Date range and branch filters. Caption: 'Filter new patient reports by reporting period, branch, or practitioner where applicable.'" />
          
          <div className="mt-8">
            <ScreenshotPlaceholder label="Diagram 29.2: Acquisition Workflow. Caption: 'New Patient Reports track clinic growth through first-time patient registrations.'" />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        Consistently monitoring new patient trends over weekly or monthly intervals helps management evaluate the direct impact of marketing efforts on clinic growth.
      </DocCallout>


      {/* SECTION 29.2 — Returning Patients */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        29.2 Returning Patients
      </h3>
      <p className="text-gray-700 font-body mb-6">Identifying repeat visits and continuity of care.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Acquiring new patients is only half the operational equation. The Returning Patient Report explicitly filters for individuals who have previously completed an appointment and are actively returning for follow-up care or new consultations.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            This report logs crucial relationship data, including the total Returning Patient Count, the time elapsed since their Last Visit Date, their Current Visit Date, and the specific Clinic Branch they attended.
          </p>

          <ScreenshotPlaceholder label="Screenshot 29.3: Returning Patient Report. Highlight Returning patient statistics. Caption: 'Returning Patient Reports identify patients who continue receiving care at the clinic.'" />
          
          <div className="mt-8">
            <ScreenshotPlaceholder label="Diagram 29.3: Repeat Workflow. Caption: 'Returning Patient Reports measure ongoing patient engagement.'" />
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        High returning patient rates are a key indicator of strong clinical outcomes, high patient satisfaction, and excellent continuity of care.
      </DocCallout>


      {/* SECTION 29.3 — Visits */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        29.3 Visit History
      </h3>
      <p className="text-gray-700 font-body mb-6">Summarizing total appointment activity.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            The Visit Report provides a high-level summary of raw appointment activity across the clinic during the selected timeframe. It tracks service utilization to help management adjust staffing and operational capacity.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            The report summarizes aggregate metrics such as <strong>Total Visits</strong>, <strong>Completed Appointments</strong>, <strong>Cancelled Appointments</strong>, and <strong>DNA (Did Not Attend)</strong> occurrences, segmented by specific practitioners or branches.
          </p>

          <ScreenshotPlaceholder label="Screenshot 29.4: Visit Report. Highlight Visit history table. Caption: 'Visit Reports summarize patient appointment activity over time.'" />
          <ScreenshotPlaceholder label="Screenshot 29.5: Visit statistics. Highlight Visit totals. Caption: 'Visit statistics help monitor clinic utilization and appointment activity.'" />
          
          <div className="mt-8">
            <ScreenshotPlaceholder label="Diagram 29.4: Visit Tracking. Caption: 'Visit Reports summarize patient appointment history.'" />
          </div>
        </div>
      </div>

      <DocCallout type="important">
        While Visit Reports are excellent for measuring raw appointment volume, they should be paired with Retention Reports to evaluate the actual quality of long-term patient relationships.
      </DocCallout>


      {/* SECTION 29.4 — Retention */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        29.4 Patient Retention
      </h3>
      <p className="text-gray-700 font-body mb-6">Evaluating long-term relationship success.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Patient Retention Reports look beyond simple appointment volume to evaluate how successfully the clinic maintains long-term patient engagement. 
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Retention analytics typically calculate metrics such as the ratio of <strong>Active Patients</strong> to inactive ones, the overarching <strong>Repeat Visit Rate</strong>, the <strong>Retention Percentage</strong>, and follow-up compliance. These metrics provide critical insight into clinical loyalty.
          </p>

          <ScreenshotPlaceholder label="Screenshot 29.6: Retention Report. Highlight Retention statistics. Caption: 'Retention Reports measure long-term patient engagement.'" />
          <ScreenshotPlaceholder label="Screenshot 29.7: Retention analytics. Highlight Patient retention trends. Caption: 'Retention analytics help clinics evaluate patient loyalty over time.'" />
          
          <div className="mt-8">
            <ScreenshotPlaceholder label="Diagram 29.5: Retention Logic. Caption: 'Retention Reports measure how successfully the clinic retains patients.'" />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        Patient retention is arguably the most critical indicator of long-term clinic success. Retaining existing patients is widely recognized as being significantly more cost-effective than constantly acquiring new ones.
      </DocCallout>


      {/* SECTION 29.5 — Role-Based Visibility */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        29.5 Role-Based Report Visibility
      </h3>
      <p className="text-gray-700 font-body mb-6">How permissions protect patient analytics.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            As with all analytical tools in Malasakit, Patient Reports are governed by strict Role-Based Access Control (RBAC):
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-5 bg-sky-50 rounded-xl border border-sky-200">
              <h4 className="font-bold text-sky-900 mb-2">Owner</h4>
              <p className="text-sm text-gray-700">Can select any branch filter to view and compare patient analytics across the entire organization.</p>
            </div>
            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2">Manager</h4>
              <p className="text-sm text-gray-700">Strictly limited to viewing patient reports and metrics for their explicitly assigned clinic branches.</p>
            </div>
            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 md:col-span-2">
              <h4 className="font-bold text-gray-900 mb-2">Practitioner & Front Desk</h4>
              <p className="text-sm text-gray-700">Staff roles typically have limited or specialized access to analytics reports depending on custom permissions granted by management.</p>
            </div>
          </div>

          <ScreenshotPlaceholder label="Screenshot 29.8: Owner Patient Report. Highlight Organization-wide patient analytics. Caption: 'Owners can analyze patient activity across every clinic branch.'" />
          <ScreenshotPlaceholder label="Screenshot 29.9: Manager Patient Report. Highlight Branch-specific analytics. Caption: 'Managers only access patient reports for their assigned clinic branches.'" />
          
          <div className="mt-8">
            <ScreenshotPlaceholder label="Diagram 29.6: Security Workflow. Caption: 'Role-Based Access Control protects patient reporting information.'" />
          </div>
        </div>
      </div>

      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to interpret patient behavior and loyalty using the Patient Reports module. You should now understand:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>How <strong>New Patient Reports</strong> measure initial acquisition and clinic growth.</li>
        <li>How <strong>Returning Patient Reports</strong> identify continuity of care and follow-up success.</li>
        <li>How <strong>Visit Reports</strong> summarize raw appointment volume and utilization.</li>
        <li>How <strong>Retention Reports</strong> evaluate the critical long-term engagement of your patient base.</li>
        <li>How <strong>Role Permissions</strong> determine branch-specific access to these operational analytics.</li>
      </ul>
    </>
  );
};

export default Chapter29;
