import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Clock, FileText, Users, Check, Lock, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { createBlockAppointment } from '../appointment.api';
import { useClinicBranches } from '@/features/clinics/hooks/useClinicBranches';
import { useBlockConflictDetection } from '../hooks/useBlockConflictDetection';
import { useClinicUsers } from '../hooks/useClinicUsers';
import { ConflictModal } from './ConflictModal';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import type { BlockAppointment, Appointment, CreateBlockAppointmentData } from '@/types';
import { UserAvatar } from '@/components/UserAvatar';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (event: BlockAppointment) => void;
  selectedClinicBranchId?: number | null;
  initialDate?: Date;
  initialTime?: string;
  initialEndTime?: string;
  appointments?: Appointment[];
  /** Practitioner this block is scoped to. Comes from the column the user clicked/dragged in. */
  practitionerId?: number | null;
  /**
   * The user whose schedule the Calendar is showing (the filtered practitioner, or the clicked column).
   * They are ticked and cannot be unticked: you are adding the event to their calendar.
   */
  lockedUserId?: number | null;
  /** user id → practitioner id; lets the conflict check look only at the people being blocked. */
  practitionerIdByUserId?: Record<number, number>;
}

interface FormData {
  event_name: string;
  date: string;
  start_time: string;
  end_time: string;
  notes: string;
  location: string;
  selected_user_ids: number[];
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  selectedClinicBranchId,
  initialDate,
  initialTime,
  initialEndTime,
  appointments = [],
  practitionerId = null,
  lockedUserId = null,
  practitionerIdByUserId = {},
}) => {
  const { user: currentUser } = useAuthStore();
  const { branches } = useClinicBranches();
  const { users, loading: loadingUsers } = useClinicUsers(selectedClinicBranchId);

  // Filter to only active practitioners (excluding current user shown as "self")
  const availablePractitioners = useMemo(() => {
    return users.filter(user => user.id !== currentUser?.id);
  }, [users, currentUser?.id]);

  const [saving, setSaving] = useState(false);
  // The creator is blocked only when they say so; being the creator alone blocks nobody.
  const [includeMe, setIncludeMe] = useState(false);
  // The person whose calendar is open is locked in: someone else shows in the list, yourself in "Include me".
  const lockedIsMe = lockedUserId != null && lockedUserId === currentUser?.id;
  const lockedOtherId = lockedUserId != null && !lockedIsMe ? lockedUserId : null;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [category, setCategory] = useState('');
  const [categoryOther, setCategoryOther] = useState('');

  // Conflict detection
  const { getFirstConflict } = useBlockConflictDetection(appointments);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictingAppointment, setConflictingAppointment] = useState<{
    appointment: Appointment;
    blockStartTime: string;
    blockEndTime: string;
  } | null>(null);
  const [pendingBlockData, setPendingBlockData] = useState<{
    clinicId: number;
    event_name: string;
    date: string;
    start_time: string;
    end_time: string;
    notes: string;
    location: string;
    selected_user_ids: number[];
  } | null>(null);

  // Time interval generation (15-minute increments)
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 6; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        times.push({ value: time, label: `${displayHour}:${String(minute).padStart(2, '0')} ${period}` });
      }
    }
    return times;
  };
  const timeOptions = generateTimeOptions();

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const getInitialFormData = (): FormData => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const startTime = initialTime || '09:00';
    const endTime = initialEndTime || (initialTime ? calculateEndTime(initialTime, 60) : '10:00');

    return {
      event_name: '',
      date: initialDate ? format(initialDate, 'yyyy-MM-dd') : today,
      start_time: startTime,
      end_time: endTime,
      notes: '',
      location: '',
      selected_user_ids: [],
    };
  };

  const [formData, setFormData] = useState<FormData>(getInitialFormData);

  // Reset form when modal opens with new initial values
  useEffect(() => {
    if (isOpen) {
      const startTime = initialTime || '09:00';
      const endTime = initialEndTime || (initialTime ? calculateEndTime(initialTime, 60) : '10:00');
      setFormData({
        event_name: '',
        date: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: endTime,
        notes: '',
        location: '',
        selected_user_ids: lockedOtherId != null ? [lockedOtherId] : [],
      });
      setErrors({});
      setShowConflictModal(false);
      setConflictingAppointment(null);
      setPendingBlockData(null);
      setCategory('');
      setCategoryOther('');
      setIncludeMe(lockedIsMe);
    }
  }, [isOpen, initialDate, initialTime, initialEndTime, lockedOtherId, lockedIsMe]);

  // Available participants for selection
  const filteredParticipants = useMemo(() => {
    return availablePractitioners;
  }, [availablePractitioners]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleParticipant = (userId: number) => {
    if (userId === lockedOtherId) return;   // the calendar's practitioner stays selected
    setFormData(prev => {
      const isSelected = prev.selected_user_ids.includes(userId);
      return {
        ...prev,
        selected_user_ids: isSelected
          ? prev.selected_user_ids.filter(id => id !== userId)
          : [...prev.selected_user_ids, userId],
      };
    });
  };

  const selectAllParticipants = () => {
    const allIds = filteredParticipants.map(u => u.id);
    setFormData(prev => ({ ...prev, selected_user_ids: allIds }));
  };

  const clearAllParticipants = () => {
    setFormData(prev => ({ ...prev, selected_user_ids: lockedOtherId != null ? [lockedOtherId] : [] }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.event_name.trim()) {
      newErrors.event_name = 'Event name is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }
    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }
    if (formData.start_time && formData.end_time) {
      if (formData.end_time <= formData.start_time) {
        newErrors.end_time = 'End time must be after start time';
      }
    }
    if (formData.selected_user_ids.length === 0 && !includeMe && practitionerId == null) {
      newErrors.people = 'Select who to block, or tick "Include me in this event".';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Check for conflicts with existing appointments of the people being blocked, not everyone on screen:
    // the people ticked (plus "Include me"), or the clicked column when nobody is ticked.
    const blockedPractitionerIds = formData.selected_user_ids.length > 0 || includeMe
      ? [
          ...formData.selected_user_ids,
          ...(includeMe && currentUser?.id != null ? [currentUser.id] : []),
        ].map(userId => practitionerIdByUserId[userId]).filter((id): id is number => id != null)
      : (practitionerId != null ? [practitionerId] : []);

    const conflict = getFirstConflict({
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      practitionerIds: blockedPractitionerIds,
    });

    if (conflict) {
      setPendingBlockData({
        clinicId: selectedClinicBranchId || branches[0]?.id || 0,
        event_name: formData.event_name,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes,
        location: formData.location,
        selected_user_ids: formData.selected_user_ids,
      });
      setConflictingAppointment(conflict);
      setShowConflictModal(true);
      return;
    }

    // No conflict, proceed with creation
    await createBlockEvent();
  };

  const createBlockEvent = async () => {
    if (!pendingBlockData && !formData.event_name) return;

    setSaving(true);
    try {
      const clinicId = selectedClinicBranchId || branches[0]?.id;
      if (!clinicId) {
        toast.error('No clinic branch available');
        setSaving(false);
        return;
      }

      const blockData = pendingBlockData || {
        clinicId,
        event_name: formData.event_name,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes,
        location: formData.location,
        selected_user_ids: formData.selected_user_ids,
      };

      // Who is blocked:
      //  - people selected (and/or "Include me")  → exactly those people; no practitioner column is added,
      //    so the creator is never blocked just because they clicked a slot or are logged in;
      //  - nobody selected → only the practitioner column that was clicked.
      const hasSelectedUsers = blockData.selected_user_ids.length > 0;
      const blocksPeople = hasSelectedUsers || includeMe;

      const payload: CreateBlockAppointmentData = {
        clinic: blockData.clinicId,
        event_name: blockData.event_name,
        date: blockData.date,
        start_time: blockData.start_time,
        end_time: blockData.end_time,
        notes: blockData.notes,
        location: blockData.location.trim(),
        visibility_type: blocksPeople ? 'SELECTED' : 'SELF',
        practitioner: blocksPeople ? null : (practitionerId ?? null),
      };

      if (blocksPeople) {
        payload.visible_to_user_ids = blockData.selected_user_ids;
        payload.include_creator = includeMe;
      }

      const created = await createBlockAppointment(payload);

      toast.success('Event created successfully');
      onCreated?.(created);
      onClose();
      setPendingBlockData(null);
    } catch (err: unknown) {
      console.error('Failed to create event:', err);
      const data = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string; visible_to_user_ids?: string[] } } }).response?.data
        : undefined;
      toast.error(data?.detail ?? data?.visible_to_user_ids?.[0] ?? 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const allSelected = filteredParticipants.length > 0 && formData.selected_user_ids.length === filteredParticipants.length;
  const someSelected = formData.selected_user_ids.length > 0 && !allSelected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create Block Event</h2>
            <p className="text-sm text-gray-500">Block a time slot in the calendar</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-2 gap-4">
            {/* LEFT COLUMN - Details */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Details
              </h3>

              {/* Event Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.event_name}
                  onChange={(e) => handleChange('event_name', e.target.value)}
                  placeholder="e.g., Staff Meeting, Clinic Holiday"
                  className={`
                    w-full h-9 px-3 py-2 rounded-lg border text-sm transition-colors
                    focus:ring-2 focus:ring-offset-1 focus:outline-none
                    ${errors.event_name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-sky-500 focus:ring-sky-200'
                    }
                  `}
                />
                {errors.event_name && (
                  <p className="mt-1 text-xs text-red-500">{errors.event_name}</p>
                )}
              </div>

              {/* Category - Optional dropdown for common block event types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:ring-offset-1 focus:outline-none"
                >
                  <option value="">General (no category)</option>
                  <option value="MEETING">Meeting</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="TRAINING">Training</option>
                  <option value="HOLIDAY">Holiday</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Category Other - Show when OTHER is selected */}
              {category === 'OTHER' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specify Category
                  </label>
                  <input
                    type="text"
                    value={categoryOther}
                    onChange={(e) => setCategoryOther(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full h-9 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:ring-offset-1 focus:outline-none"
                  />
                </div>
              )}

              {/* Location - Where */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Where / Location <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  maxLength={200}
                  placeholder="e.g., Conference Room A"
                  className="w-full h-9 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:ring-offset-1 focus:outline-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className={`
                    w-full h-9 px-3 py-2 rounded-lg border text-sm transition-colors
                    focus:ring-2 focus:ring-offset-1 focus:outline-none
                    ${errors.date
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-sky-500 focus:ring-sky-200'
                    }
                  `}
                />
                {errors.date && (
                  <p className="mt-1 text-xs text-red-500">{errors.date}</p>
                )}
              </div>

              {/* Time Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Start Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.start_time}
                    onChange={(e) => handleChange('start_time', e.target.value)}
                    className={`
                      w-full h-9 px-3 py-2 rounded-lg border text-sm transition-colors
                      focus:ring-2 focus:ring-offset-1 focus:outline-none
                      ${errors.start_time
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-300 focus:border-sky-500 focus:ring-sky-200'
                      }
                    `}
                  >
                    <option value="">Select time</option>
                    {timeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.start_time && (
                    <p className="mt-1 text-xs text-red-500">{errors.start_time}</p>
                  )}
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.end_time}
                    onChange={(e) => handleChange('end_time', e.target.value)}
                    className={`
                      w-full h-9 px-3 py-2 rounded-lg border text-sm transition-colors
                      focus:ring-2 focus:ring-offset-1 focus:outline-none
                      ${errors.end_time
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-300 focus:border-sky-500 focus:ring-sky-200'
                      }
                    `}
                  >
                    <option value="">Select time</option>
                    {timeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.end_time && (
                    <p className="mt-1 text-xs text-red-500">{errors.end_time}</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Add any additional details..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:ring-offset-1 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* RIGHT COLUMN - Participants */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Who is blocked
              </h3>

              {/* Helper text */}
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                Only the people you select are blocked. The practitioner whose calendar is open is always included.
                Your own schedule is blocked only if you tick &ldquo;Include me&rdquo;.
              </div>

              <label className={`flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 ${lockedIsMe ? 'bg-sky-50/50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
                <input
                  type="checkbox"
                  checked={includeMe}
                  disabled={lockedIsMe}
                  onChange={(e) => { setIncludeMe(e.target.checked); if (errors.people) setErrors(prev => ({ ...prev, people: '' })); }}
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500 disabled:opacity-70"
                />
                <span className="text-sm font-medium text-gray-700">Include me in this event</span>
                {lockedIsMe && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-sky-700">
                    <Lock className="w-3 h-3" aria-hidden="true" /> You are viewing your own calendar
                  </span>
                )}
              </label>
              {errors.people && <p role="alert" className="text-xs text-rose-600">{errors.people}</p>}

              {/* Select All / Clear All */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded -ml-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={() => {
                      if (allSelected || someSelected) {
                        clearAllParticipants();
                      } else {
                        selectAllParticipants();
                      }
                    }}
                    className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {allSelected || someSelected ? 'Deselect All' : 'Select All'}
                  </span>
                </label>
                {formData.selected_user_ids.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {formData.selected_user_ids.length} selected
                  </span>
                )}
              </div>

              {/* Participant List - Scrollable */}
              <div className="border rounded-lg overflow-y-auto max-h-[420px]">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600"></div>
                  </div>
                ) : filteredParticipants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <UserIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">No practitioners found</p>
                    <p className="text-xs text-gray-500 mt-1">
                      No practitioners available in this clinic
                    </p>
                  </div>
                ) : (
                  filteredParticipants.map((user) => {
                    const isSelected = formData.selected_user_ids.includes(user.id);
                    const isLocked = user.id === lockedOtherId;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleParticipant(user.id)}
                        aria-disabled={isLocked}
                        title={isLocked ? 'The calendar is showing this practitioner' : undefined}
                        className={`
                          w-full px-3 py-2.5 text-left transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0
                          ${isLocked ? 'cursor-not-allowed' : 'hover:bg-gray-50'}
                          ${isSelected ? 'bg-sky-50' : ''}
                        `}
                      >
                        {/* Checkbox visual */}
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-sky-600 border-sky-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>

                        {isLocked && <Lock className="w-3.5 h-3.5 text-sky-600 shrink-0" aria-label="Locked" />}

                        {/* Avatar */}
                        <UserAvatar
                          avatarUrl={(user as any).avatar_url ?? user.avatar}
                          name={user.name}
                          className="w-9 h-9 shrink-0 border-2 border-white shadow-sm"
                        />

                        {/* User Info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {isLocked ? 'Open in the calendar' : user.email}
                          </p>
                        </div>

                        {/* Role badge */}
                        <span className={`
                          text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0
                          ${user.role === 'OWNER'
                            ? 'bg-rose-100 text-rose-700'
                            : user.role === 'PRACTITIONER'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                          }
                        `}>
                          {user.role}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Creating...' : 'Create Block Event'}
            </button>
          </div>
        </form>
      </div>

      {/* Conflict Modal */}
      <ConflictModal
        isOpen={showConflictModal}
        conflictingAppointment={conflictingAppointment}
        onBlockExisting={async () => {
          setShowConflictModal(false);
          await createBlockEvent();
        }}
        onRescheduleExisting={() => {
          setShowConflictModal(false);
          setConflictingAppointment(null);
          setPendingBlockData(null);
          toast('Please drag the existing appointment to a new time before creating the block appointment.', {
            icon: '📅',
            duration: 5000,
          });
        }}
        onCancel={() => {
          setShowConflictModal(false);
          setConflictingAppointment(null);
          setPendingBlockData(null);
        }}
      />
    </div>
  );
};