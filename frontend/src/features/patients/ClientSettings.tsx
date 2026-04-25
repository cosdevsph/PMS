import { useEffect, useState } from 'react';
import { Bell, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updatePatient } from './patient.api';
import { usePatientProfileContext } from './context/PatientProfileContext';
import type { CreatePatientData } from '@/types';

interface SettingsDraft {
  send_email_notifications: boolean;
  sms_notifications_enabled: boolean;
  allow_push_notifications: boolean;
  data_sharing_preferences: Record<string, unknown>;
}

const buildDraft = (patient?: {
  send_email_notifications?: boolean;
  sms_notifications_enabled?: boolean;
  allow_push_notifications?: boolean;
  data_sharing_preferences?: Record<string, unknown>;
}): SettingsDraft => ({
  send_email_notifications: patient?.send_email_notifications ?? true,
  sms_notifications_enabled: patient?.sms_notifications_enabled ?? false,
  allow_push_notifications: patient?.allow_push_notifications ?? false,
  data_sharing_preferences: patient?.data_sharing_preferences ?? {},
});

const ToggleRow = ({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) => (
  <div className="flex items-start justify-between gap-3">
    <div>
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-sky-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:bg-white after:border after:border-gray-300 after:rounded-full after:transition-all" />
    </label>
  </div>
);

export const ClientSettings = () => {
  const { patient, loadingPatient, refreshPatient } = usePatientProfileContext();

  const [settings,         setSettings]         = useState<SettingsDraft>(() => buildDraft());
  const [originalSettings, setOriginalSettings] = useState<SettingsDraft>(() => buildDraft());
  const [isSaving,         setIsSaving]         = useState(false);

  useEffect(() => {
    if (!patient) return;
    const next = buildDraft(patient);
    setSettings(next);
    setOriginalSettings(next);
  }, [patient]);

  const hasChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const handleSave = async () => {
    if (!patient) return;
    setIsSaving(true);
    try {
      await updatePatient(patient.id, settings as unknown as Partial<CreatePatientData>);
      toast.success('Settings saved successfully');
      setOriginalSettings(settings);
      await refreshPatient();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingPatient || !patient) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-sky-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h1 className="text-xl font-heading text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage notification preferences for {patient.first_name} {patient.last_name}.
        </p>
      </div>

      {/* Notification Settings */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-4 h-4 text-sky-600" />
          <h2 className="text-sm font-semibold text-gray-700">Notification Settings</h2>
        </div>

        <div className="space-y-5">
          <ToggleRow
            label="Email notifications"
            description="Send automatic email reminders for appointments."
            checked={settings.send_email_notifications}
            onChange={(v) => setSettings((prev) => ({ ...prev, send_email_notifications: v }))}
          />

          <ToggleRow
            label="SMS notifications"
            description="Receive appointment reminders via text message."
            checked={settings.sms_notifications_enabled}
            onChange={(v) => setSettings((prev) => ({ ...prev, sms_notifications_enabled: v }))}
          />

          <ToggleRow
            label="Push notifications"
            description="Coming soon."
            checked={settings.allow_push_notifications}
            disabled
          />

          <div className="pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasChanged}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                hasChanged
                  ? 'text-white bg-sky-600 hover:bg-sky-700'
                  : 'text-gray-500 bg-gray-100 cursor-not-allowed'
              } ${isSaving ? 'opacity-60' : ''}`}
            >
              {isSaving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : <><CheckCircle className="w-4 h-4" /> Save Changes</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;
