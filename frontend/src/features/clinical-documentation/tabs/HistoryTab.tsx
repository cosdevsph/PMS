import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Loader2, FileText, Mail, File as FileIcon, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePatientProfileContext } from '@/features/patients/context/PatientProfileContext';
import { getPatientActivityTimeline, type ActivityTimelineItem } from '@/features/patients/patient.api';
import { formatDate } from '@/features/patients/patientProfile.utils.tsx';
import type { ClinicalWorkspaceContext } from '../ClinicalDocumentationWorkspace';

const getIconForType = (type: string) => {
  switch (type) {
    case 'NOTE': return <FileText className="w-4 h-4 text-sky-500" />;
    case 'LETTER': return <Mail className="w-4 h-4 text-purple-500" />;
    case 'DOCUMENT': return <FileIcon className="w-4 h-4 text-indigo-500" />;
    case 'SESSION_LOG': return <History className="w-4 h-4 text-emerald-500" />;
    default: return <FileText className="w-4 h-4 text-gray-400" />;
  }
};

const getBgColorForType = (type: string) => {
  switch (type) {
    case 'NOTE': return 'bg-sky-50';
    case 'LETTER': return 'bg-purple-50';
    case 'DOCUMENT': return 'bg-indigo-50';
    case 'SESSION_LOG': return 'bg-emerald-50';
    default: return 'bg-gray-50';
  }
};

export const HistoryTab = () => {
  const { patient } = usePatientProfileContext();
  const { selectedCaseId } = useOutletContext<ClinicalWorkspaceContext>();
  const navigate = useNavigate();

  const [activities, setActivities] = useState<ActivityTimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTimeline = async () => {
    if (!patient?.id) return;
    try {
      setIsLoading(true);
      const data = await getPatientActivityTimeline(patient.id, selectedCaseId || undefined);
      setActivities(data);
    } catch (error) {
      toast.error('Failed to load activity timeline');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [patient?.id, selectedCaseId]);

  const handleNavigateToItem = (item: ActivityTimelineItem) => {
    if (item.type === 'NOTE') {
      navigate('../notes', { state: { openNoteId: item.metadata.note_id } });
    } else if (item.type === 'LETTER') {
      // Letters are in documents tab once generated
      navigate('../documents');
    } else if (item.type === 'DOCUMENT') {
      navigate('../documents');
    } else if (item.type === 'SESSION_LOG') {
      // Stay on history, or just open a generic modal
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <div className="p-6 border-b border-slate-200 bg-white">
        <h2 className="text-lg font-semibold text-slate-900">Case History</h2>
        <p className="text-sm text-slate-500 mt-1">
          {selectedCaseId ? 'Unified timeline of all clinical activities for the selected case.' : 'Unified timeline of all clinical activities.'}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {!selectedCaseId ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm mt-10">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-slate-900">Select a Case</h3>
            <p className="text-sm text-slate-500 mt-1">
              Please select a case from the dropdown above to view its history.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-slate-900">No activity yet</h3>
            <p className="text-sm text-slate-500 mt-1">
              Clinical activities related to this case will appear here.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
              {activities.map((item) => {
                return (
                  <div key={item.id} className="relative pl-6">
                    <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 border-slate-50 ${getBgColorForType(item.type)} flex items-center justify-center`}>
                      {getIconForType(item.type)}
                    </div>
                    <div 
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => handleNavigateToItem(item)}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                        <div className="text-xs text-slate-400 font-medium whitespace-nowrap pt-0.5">
                          {formatDate(item.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
