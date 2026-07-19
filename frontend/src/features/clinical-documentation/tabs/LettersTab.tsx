import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { FileText, Loader2, Plus, Search, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePatientProfileContext } from '@/features/patients/context/PatientProfileContext';
import { getActiveLetterTemplates, type LetterTemplate } from '../api/letterTemplates.api';
import { GenerateLetterModal } from '../components/GenerateLetterModal';
import type { ClinicalWorkspaceContext } from '../ClinicalDocumentationWorkspace';

export const LettersTab = () => {
  const { patient, cases: patientCases = [] } = usePatientProfileContext();
  const { selectedCaseId } = useOutletContext<ClinicalWorkspaceContext>();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>();

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await getActiveLetterTemplates();
      setTemplates(data);
    } catch (error) {
      toast.error('Failed to load letter templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleGenerate = (templateId: number) => {
    if (!selectedCaseId) {
      toast.error('Please select a case first');
      return;
    }
    setSelectedTemplateId(templateId);
    setIsGenerateModalOpen(true);
  };

  const handleGenerateSuccess = () => {
    setIsGenerateModalOpen(false);
    navigate('../documents');
  };

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Letter Templates</h2>
          {selectedCaseId && (
            <button
              onClick={() => {
                setSelectedTemplateId(undefined);
                setIsGenerateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Generate Custom Letter
            </button>
          )}
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {!selectedCaseId ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm mt-10">
            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-slate-900">Select a Case</h3>
            <p className="text-sm text-slate-500 mt-1">
              Please select a case from the dropdown above to generate letters.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-slate-900">No templates found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {searchQuery ? 'Try adjusting your search.' : 'No active letter templates available.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div 
                key={template.id} 
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer"
                onClick={() => handleGenerate(template.id)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate" title={template.name}>
                      {template.name}
                    </h3>
                    <p className="text-xs font-medium text-indigo-600 mt-0.5">
                      {template.category}
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">
                  {template.description || 'No description provided.'}
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerate(template.id);
                  }}
                  className="w-full py-2 px-4 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-sm font-medium rounded-lg transition-colors border border-slate-200 hover:border-indigo-200"
                >
                  Generate Letter
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isGenerateModalOpen && selectedCaseId && patient && (
        <GenerateLetterModal
          patientId={patient.id}
          cases={patientCases}
          preSelectedTemplateId={selectedTemplateId}
          preSelectedCaseId={selectedCaseId}
          onClose={() => setIsGenerateModalOpen(false)}
          onSuccess={handleGenerateSuccess}
        />
      )}
    </div>
  );
};
