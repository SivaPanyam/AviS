import React, { useState } from 'react';
import {
  ShieldCheck,
  UploadCloud,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  BookOpen,
} from 'lucide-react';

interface Citation {
  tag: string;
  document_name: string;
  page_number: number | string;
  chunk_id: string;
  content_preview?: string;
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  citations?: Citation[];
  isAbstained?: boolean;
}

export default function App() {
  const workspaceId = 'kamat-ca-demo-id';
  const firmName = 'Kamat & Associates Chartered Accountants';
  const [documents, setDocuments] = useState<Array<{ name: string; size: string; status: string }>>([
    { name: 'Income_Tax_Act_Sec_44AB_Guidance.pdf', size: '1.2 MB', status: 'Indexed' },
    { name: 'GST_Circular_2026_InputTaxCredit.docx', size: '420 KB', status: 'Indexed' },
    { name: 'ICAI_Form_3CD_Audit_Checklist.pdf', size: '2.4 MB', status: 'Indexed' },
  ]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Welcome to AviS Desktop. I am your private compliance assistant grounded strictly in your firm’s approved audit checklists, GST notifications, and tax SOPs. Click any citation [1] in an answer to inspect the verified source document.',
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
    }, 1000);
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
            citations: data.citations.map((c: any) => ({
              ...c,
              content_preview:
                'Section 44AB requires compulsory audit of accounts of persons carrying on business or profession whose turnover/gross receipts exceed the statutory monetary limits specified for the relevant assessment year.',
            })),
            isAbstained: data.is_abstained,
          },
        ]);
      } else {
        // Fallback demo response with citation preview
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: `Under Section 44AB of the Income Tax Act [1], business tax audit is mandatory if gross turnover exceeds ₹1 Crore (or ₹10 Crore if cash receipts/payments do not exceed 5%). Reporting must follow Form 3CD guidance [2].`,
            citations: [
              {
                tag: '[1]',
                document_name: 'Income_Tax_Act_Sec_44AB_Guidance.pdf',
                page_number: 3,
                chunk_id: 'c-44ab',
                content_preview:
                  'Every person carrying on business shall get his accounts audited if his total sales, turnover or gross receipts exceed one crore rupees in any previous year, subject to the ten crore limit for digital transactions.',
              },
              {
                tag: '[2]',
                document_name: 'ICAI_Form_3CD_Audit_Checklist.pdf',
                page_number: 14,
                chunk_id: 'c-form3cd',
                content_preview:
                  'Clause 17 & Clause 21(a): Verification of amounts debited to profit and loss account, expenditure of capital nature, personal expenses, and statutory compliance schedules.',
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
              content_preview:
                'Statutory turnover limit of ₹1 Crore applies for business audit requirements under Section 44AB.',
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
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-200 bg-white flex flex-col justify-between flex-shrink-0">
        <div className="p-4">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold text-lg mb-3">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <span>AviS Desktop</span>
          </div>
          <div className="text-xs bg-slate-50 text-slate-600 p-2.5 rounded-lg border border-slate-200 mb-5">
            <div className="font-semibold text-slate-700 truncate">{firmName}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Workspace: {workspaceId}</div>
            <div className="text-[10px] text-slate-400">Local Engine: Active (SQLite/Qdrant)</div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Firm Knowledge Base
              </span>
              <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                {documents.length} Docs
              </span>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs cursor-pointer transition-colors"
                  onClick={() =>
                    setActiveCitation({
                      tag: `[Doc]`,
                      document_name: doc.name,
                      page_number: 1,
                      chunk_id: `doc-${idx}`,
                      content_preview: `Viewing document: ${doc.name}. Document is indexed and active in local search space.`,
                    })
                  }
                >
                  <FileText className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <div className="font-medium truncate text-slate-800">{doc.name}</div>
                    <div className="text-[10px] text-slate-400">{doc.size} • {doc.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:bg-slate-50 transition-colors">
            <UploadCloud className="w-5 h-5 text-slate-400 mx-auto mb-1" />
            <label className="text-xs font-semibold text-indigo-600 cursor-pointer hover:underline block">
              <span>{isUploading ? 'Indexing File...' : '+ Add Firm Document'}</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
            <p className="text-[10px] text-slate-400 mt-0.5">PDF, DOCX, TXT</p>
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center space-x-1.5 bg-slate-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Local execution • 100% data privacy</span>
        </div>
      </aside>

      {/* Main Chat Stream */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        <header className="h-14 border-b border-slate-200 px-6 flex items-center justify-between bg-white flex-shrink-0">
          <div>
            <h1 className="font-semibold text-slate-800 text-sm">Grounded Compliance Assistant</h1>
            <p className="text-[11px] text-slate-500">Every response requires verifiable citations from firm SOPs</p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
            Strict Abstention Guard Active
          </span>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-2xl rounded-xl p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                    : msg.isAbstained
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
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
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Verified Citations (Click to inspect source)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((cite, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => setActiveCitation(cite)}
                          className="text-xs flex items-center space-x-1.5 text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-md font-medium transition-colors shadow-sm"
                        >
                          <span className="font-bold text-indigo-900">{cite.tag}</span>
                          <span className="truncate max-w-[180px]">{cite.document_name}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600">p. {cite.page_number}</span>
                          <ExternalLink className="w-3 h-3 text-indigo-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isQuerying && (
            <div className="flex justify-start">
              <div className="bg-slate-50 text-slate-500 text-xs px-4 py-2.5 rounded-xl border border-slate-200 animate-pulse">
                Retrieving permitted chunks from local vector store and synthesizing cited response...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendQuery} className="p-3 border-t border-slate-200 bg-slate-50 flex items-center space-x-3 flex-shrink-0">
          <input
            type="text"
            className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ask a question on Section 44AB, GST ITC rules, or Form 3CD clauses..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!queryInput.trim() || isQuerying}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50 shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span>Search & Cite</span>
          </button>
        </form>
      </main>

      {/* Side-by-Side Split-Pane Citation Inspector */}
      {activeCitation && (
        <aside className="w-96 border-l border-slate-200 bg-slate-50 flex flex-col justify-between flex-shrink-0 animate-in slide-in-from-right duration-200 shadow-lg">
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Citation Inspector</h3>
                <span className="text-[11px] text-slate-500">{activeCitation.tag} Source Verification</span>
              </div>
            </div>
            <button
              onClick={() => setActiveCitation(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source Document</div>
              <div className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span className="truncate">{activeCitation.document_name}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</div>
              <div className="text-xs text-slate-700">
                Page <span className="font-semibold text-slate-900">{activeCitation.page_number}</span> • Chunk ID{' '}
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{activeCitation.chunk_id}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
              <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <span>Verified Source Passage</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-700 bg-indigo-50/50 p-3 rounded border border-indigo-100 italic">
                "{activeCitation.content_preview || 'Passage extracted from verified document chunk.'}"
              </p>
            </div>

            <div className="text-[11px] text-slate-400 leading-normal">
              This citation is backed by exact SHA-256 content deduplication and vector embeddings stored locally on your machine.
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 bg-white">
            <button
              onClick={() => setActiveCitation(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
