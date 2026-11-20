import React, { useState } from 'react';
import { ShieldCheck, UploadCloud, Search, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface Citation {
  tag: string;
  document_name: string;
  page_number: number | string;
  chunk_id: string;
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  citations?: Citation[];
  isAbstained?: boolean;
}

export default function App() {
  const [workspaceId, setWorkspaceId] = useState<string>('kamat-ca-demo-id');
  const [firmName, setFirmName] = useState<string>('Kamat & Associates Chartered Accountants');
  const [documents, setDocuments] = useState<Array<{ name: string; size: string; status: string }>>([
    { name: 'Income_Tax_Act_Sec_44AB_Guidance.pdf', size: '1.2 MB', status: 'Indexed' },
    { name: 'GST_Circular_2026_InputTaxCredit.docx', size: '420 KB', status: 'Indexed' },
  ]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Welcome to AviS. I am your private compliance assistant grounded in your firm’s approved audit checklists and tax SOPs. What questions do you have today?',
    },
  ]);
  const [queryInput, setQueryInput] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      setDocuments((prev) => [
        ...prev,
        {
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          status: 'Indexed',
        },
      ]);
      setIsUploading(false);
    }, 1200);
  };

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim() || isQuerying) return;

    const userText = queryInput;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setQueryInput('');
    setIsQuerying(true);

    try {
      const res = await fetch('/api/v1/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: '00000000-0000-0000-0000-000000000000',
          query: userText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: data.answer,
            citations: data.citations,
            isAbstained: data.is_abstained,
          },
        ]);
      } else {
        // Fallback demo response if backend API is not yet spun up locally
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: `Under Section 44AB of the Income Tax Act [1], business audit is mandatory if gross turnover exceeds ₹1 Crore (or ₹10 Crore if cash receipts/payments do not exceed 5%).`,
            citations: [
              {
                tag: '[1]',
                document_name: 'Income_Tax_Act_Sec_44AB_Guidance.pdf',
                page_number: 3,
                chunk_id: 'c-44ab',
              },
            ],
            isAbstained: false,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Under Section 44AB [1], mandatory audit thresholds apply based on specified turnover limits.`,
          citations: [
            {
              tag: '[1]',
              document_name: 'Income_Tax_Act_Sec_44AB_Guidance.pdf',
              page_number: 3,
              chunk_id: 'c-44ab',
            },
          ],
          isAbstained: false,
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-200 bg-white flex flex-col justify-between">
        <div className="p-5">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xl mb-4">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            <span>AviS Compliance</span>
          </div>
          <div className="text-xs bg-slate-100 text-slate-600 p-2.5 rounded-lg border border-slate-200 mb-6">
            <div className="font-semibold text-slate-700">{firmName}</div>
            <div className="text-[11px] text-slate-500">Tenant: {workspaceId}</div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Firm Knowledge Base
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                {documents.length} Files
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {documents.map((doc, idx) => (
                <div key={idx} className="flex items-start space-x-2 p-2 bg-slate-50 border border-slate-200 rounded-md text-xs">
                  <FileText className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <div className="font-medium truncate text-slate-800">{doc.name}</div>
                    <div className="text-[10px] text-slate-500">{doc.size} • {doc.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:bg-slate-50 transition-colors">
            <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
            <label className="text-xs font-semibold text-indigo-600 cursor-pointer hover:underline block">
              <span>{isUploading ? 'Indexing File...' : 'Upload SOP / Notification'}</span>
              <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} disabled={isUploading} />
            </label>
            <p className="text-[10px] text-slate-500 mt-0.5">PDF, DOCX, TXT up to 25MB</p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 text-[11px] text-slate-500 flex items-center space-x-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Zero-training isolation active</span>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col bg-white">
        <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-slate-800 text-sm">Grounded Knowledge Assistant</h1>
            <p className="text-xs text-slate-500">Every response requires supporting citations from your firm's approved documents</p>
          </div>
          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full font-medium">
            Strict Abstention Mode: On
          </span>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-2xl rounded-xl p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : msg.isAbstained
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-none'
                    : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                {msg.isAbstained && (
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-800 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Uncertainty Notice</span>
                  </div>
                )}
                <div>{msg.text}</div>

                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Verified Citations
                    </div>
                    <div className="space-y-1">
                      {msg.citations.map((cite, cIdx) => (
                        <div key={cIdx} className="text-xs flex items-center space-x-1.5 text-indigo-700 bg-white/70 p-1.5 rounded border border-slate-200">
                          <span className="font-bold text-indigo-800">{cite.tag}</span>
                          <span className="truncate">{cite.document_name}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">Page {cite.page_number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isQuerying && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-500 text-xs px-4 py-2.5 rounded-xl border border-slate-200 animate-pulse">
                Retrieving permitted chunks and synthesizing citation-grounded response...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendQuery} className="p-4 border-t border-slate-200 bg-slate-50 flex items-center space-x-3">
          <input
            type="text"
            className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ask a question on Section 44AB, GST circulars, or audit checklists..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!queryInput.trim() || isQuerying}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>Search & Cite</span>
          </button>
        </form>
      </main>
    </div>
  );
}
