import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, X, HardDrive, Terminal, ShieldAlert, Check } from 'lucide-react';
import { DbStatusResponse, updateDbConfig, checkDbStatus } from '../services/api';

interface DbConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DbStatusResponse | null;
  onStatusChange: (newStatus: DbStatusResponse) => void;
}

export const DbConnectionModal: React.FC<DbConnectionModalProps> = ({
  isOpen,
  onClose,
  status,
  onStatusChange
}) => {
  const [host, setHost] = useState(status?.host || 'localhost');
  const [port, setPort] = useState(String(status?.port || 5432));
  const [database, setDatabase] = useState(status?.database || 'opnir_reikningar');
  const [user, setUser] = useState(status?.user || 'postgres');
  const [password, setPassword] = useState('');
  
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsTesting(true);
    setFeedback(null);

    try {
      const updateRes = await updateDbConfig({
        host,
        port: parseInt(port, 10) || 5432,
        database,
        user,
        password
      });

      const freshStatus = await checkDbStatus();
      onStatusChange(freshStatus);

      if (freshStatus.connected) {
        setFeedback({
          type: 'success',
          message: freshStatus.message || `Tenging tókst! Fann ${freshStatus.totalRows?.toLocaleString('is-IS') || 0} færslur í gagnagrunninum.`
        });
      } else {
        setFeedback({
          type: 'error',
          message: updateRes.error || freshStatus.error || 'Ekki náðist samband við PostgreSQL. Athugaðu hvort PostgreSQL 18 sé í gangi á tölvunni þinni.'
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Villa: ${err.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-300 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-neutral-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">PostgreSQL Gagnagrunnstenging</h2>
              <p className="text-xs text-neutral-400">
                Tengdu viðmótið beint við PostgreSQL á localhost (D:\PostgreSQL)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-neutral-800 text-xs">
          {/* Status banner */}
          <div className={`p-3.5 rounded-lg border flex items-start gap-3 ${
            status?.connected 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            {status?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold text-sm">
                {status?.connected ? '🟢 Tengt við PostgreSQL (Alvöru gögn virk)' : '🟡 Ekki tengt við PostgreSQL (Sýndarhamur)'}
              </div>
              <p className="text-xs leading-relaxed">
                {status?.connected 
                  ? `Forritið les núna beint úr töflunni '${status.activeTable}' með ${status.totalRows?.toLocaleString('is-IS')} raunverulegum færslum úr Excel skránum þínum.`
                  : 'Ef PostgreSQL er í gangi á vélbúnaði þínum geturðu stillt aðgangsupplýsingarnar hér að neðan og smellt á „Prófa & Vista tengingu“.'}
              </p>
              {status?.tables && status.tables.length > 0 && (
                <div className="pt-1 text-[11px] font-mono text-neutral-700">
                  Fundnar töflur í grunni: {status.tables.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Feedback alert if any */}
          {feedback && (
            <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              feedback.type === 'success' 
                ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-medium' 
                : 'bg-red-100 border-red-400 text-red-900'
            }`}>
              {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleTestConnection} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Host (Vefhýsill)
                </label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="localhost"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded px-2.5 py-1.5 font-mono text-xs focus:bg-white focus:border-neutral-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Port
                </label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="5432"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded px-2.5 py-1.5 font-mono text-xs focus:bg-white focus:border-neutral-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Gagnagrunnur (Database)
                </label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  placeholder="opnir_reikningar"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded px-2.5 py-1.5 font-mono text-xs focus:bg-white focus:border-neutral-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Notandi (User)
                </label>
                <input
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="postgres"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded px-2.5 py-1.5 font-mono text-xs focus:bg-white focus:border-neutral-900 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-neutral-700 mb-1">
                  Lykilorð (Password)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sláðu inn lykilorð fyrir postgres (ef eitthvað)"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded px-2.5 py-1.5 font-mono text-xs focus:bg-white focus:border-neutral-900 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-neutral-700" />
                <span>Stillingar vistaðar í staðbundnum minniskjarna vefþjónsins.</span>
              </div>

              <button
                type="submit"
                disabled={isTesting}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Prófa tengingu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Prófa & Tengja gagnagrunn</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Troubleshooting Guide for Localhost */}
          <div className="bg-neutral-100 rounded-lg p-3.5 border border-neutral-200 space-y-2">
            <div className="font-bold text-neutral-800 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-neutral-900" />
              <span>Gátlisti fyrir PostgreSQL á Localhost:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-neutral-600">
              <li>
                <strong>Er PostgreSQL 18 ræstur?</strong> Í Windows: Opnaðu <em>Services</em> (services.msc) og athugaðu hvort <code>postgresql-x64-18</code> sé með stöðuna <em>Running</em>.
              </li>
              <li>
                <strong>Heiti á grunni:</strong> Gakktu úr skugga um að gagnagrunnurinn í pgAdmin heiti nákvæmlega það sama og skráð er hér (t.d. <code>opnir_reikningar</code>).
              </li>
              <li>
                <strong>Excel töflur:</strong> Kerfið leitar sjálfkrafa að töflum sem heita <code>reikningar</code>, <code>faerslur</code> eða <code>invoices</code> og tengir dálkana sjálfkrafa.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 p-3 border-t border-neutral-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded font-bold text-xs transition cursor-pointer"
          >
            Loka glugga
          </button>
        </div>
      </div>
    </div>
  );
};
