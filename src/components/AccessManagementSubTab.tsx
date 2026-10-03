import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Lock, CheckCircle2, XCircle, Clock, 
  Bell, BellOff, UserPlus, RefreshCw, KeyRound, Mail, Check, AlertCircle
} from 'lucide-react';

interface BetaSignupItem {
  id: string | number;
  name: string;
  email: string;
  role: string;
  note?: string;
  wants_notifications?: boolean;
  status?: 'pending' | 'approved' | 'rejected' | string;
  created_at: string;
}

interface FounderItem {
  id: string | number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
  last_login?: string;
}

export const AccessManagementSubTab: React.FC = () => {
  const [signups, setSignups] = useState<BetaSignupItem[]>([]);
  const [founders, setFounders] = useState<FounderItem[]>([]);
  const [isLoadingSignups, setIsLoadingSignups] = useState(false);
  const [isLoadingFounders, setIsLoadingFounders] = useState(false);

  // New Founder Form State
  const [showAddFounderModal, setShowAddFounderModal] = useState(false);
  const [newFounderName, setNewFounderName] = useState('');
  const [newFounderEmail, setNewFounderEmail] = useState('');
  const [newFounderRole, setNewFounderRole] = useState('Stofnandi');
  const [newFounderCode, setNewFounderCode] = useState('');
  const [addFounderError, setAddFounderError] = useState<string | null>(null);
  const [isSubmittingFounder, setIsSubmittingFounder] = useState(false);

  // Success notifications
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchSignups = async () => {
    setIsLoadingSignups(true);
    try {
      const res = await fetch('/api/beta-signup');
      const data = await res.json();
      if (data.success && Array.isArray(data.signups)) {
        setSignups(data.signups);
      }
    } catch (err) {
      console.error('Failed to fetch signups', err);
    } finally {
      setIsLoadingSignups(false);
    }
  };

  const fetchFounders = async () => {
    setIsLoadingFounders(true);
    try {
      const res = await fetch('/api/founders/list');
      const data = await res.json();
      if (data.success && Array.isArray(data.founders)) {
        setFounders(data.founders);
      }
    } catch (err) {
      console.error('Failed to fetch founders', err);
    } finally {
      setIsLoadingFounders(false);
    }
  };

  useEffect(() => {
    fetchSignups();
    fetchFounders();
  }, []);

  const handleUpdateSignupStatus = async (id: string | number, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      const res = await fetch(`/api/beta-signup/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setSignups(prev => prev.map(s => String(s.id) === String(id) ? { ...s, status: newStatus } : s));
        setActionSuccessMessage(`Staða uppfærð í: ${newStatus === 'approved' ? 'Samþykkt' : newStatus === 'rejected' ? 'Hafnað' : 'Í bið'}`);
        setTimeout(() => setActionSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleToggleNotifications = async (id: string | number, current: boolean) => {
    try {
      const nextVal = !current;
      const res = await fetch(`/api/beta-signup/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wants_notifications: nextVal })
      });
      if (res.ok) {
        setSignups(prev => prev.map(s => String(s.id) === String(id) ? { ...s, wants_notifications: nextVal } : s));
      }
    } catch (err) {
      console.error('Failed to toggle notifications', err);
    }
  };

  const handleCreateFounder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFounderName.trim() || !newFounderEmail.trim() || !newFounderCode.trim()) {
      setAddFounderError('Öll svæði eru nauðsynleg');
      return;
    }

    setIsSubmittingFounder(true);
    setAddFounderError(null);

    try {
      const res = await fetch('/api/founders/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFounderName.trim(),
          email: newFounderEmail.trim(),
          role: newFounderRole.trim(),
          access_code: newFounderCode.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddFounderModal(false);
        setNewFounderName('');
        setNewFounderEmail('');
        setNewFounderCode('');
        setActionSuccessMessage('Nýr stofnandi skráður með aðgang að stjórnborði!');
        setTimeout(() => setActionSuccessMessage(null), 3000);
        fetchFounders();
      } else {
        setAddFounderError(data.error || 'Ekki tókst að vista stofnanda');
      }
    } catch (err: any) {
      setAddFounderError(err.message || 'Villa kom upp');
    } finally {
      setIsSubmittingFounder(false);
    }
  };

  const notificationSubscribersCount = signups.filter(s => s.wants_notifications).length;
  const approvedCount = signups.filter(s => s.status === 'approved').length;

  return (
    <div className="space-y-8">
      
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* SECTION 1: STOFNENDUR & LOKAÐUR AÐGANGUR AÐ STJÓRNBOÐI */}
      <section className="bg-white border-2 border-neutral-900 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-neutral-900" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-neutral-900">
                Stofnendur Félagsins — Aðgangur að Stjórnborði
              </h2>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              Aðeins skráðir stofnendur og stjórnendur í töflunni <code>founders_access</code> hafa aðgang að Innra Stjórnborði.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchFounders}
              className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition cursor-pointer"
              title="Endurhlaða stofnendur"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingFounders ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowAddFounderModal(true)}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Bæta við stofnanda</span>
            </button>
          </div>
        </div>

        {/* Founders List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {founders.map((founder) => (
            <div 
              key={founder.id}
              className="p-4 rounded-xl border border-neutral-300 bg-neutral-50/60 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-sm text-neutral-900">{founder.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200 text-neutral-800 font-bold">
                  {founder.role}
                </span>
              </div>

              <div className="text-xs text-neutral-600 font-mono">
                {founder.email}
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-200">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-neutral-500" />
                  <span>Aðgangur virkur</span>
                </span>
                {founder.last_login && (
                  <span>Síðast inn: {new Date(founder.last_login).toLocaleDateString('is-IS')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: PRUFUNOTENDUR & TILKYNNINGALISTI */}
      <section className="bg-white border-2 border-neutral-900 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-neutral-900" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-neutral-900">
                Óskir um Prufuaðgang & Tilkynningar ({signups.length})
              </h2>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              Fólk sem hefur skráð sig á lendingarsíðunni <strong>rikisgat.is</strong> til að fá prufuaðgang eða tilkynningar um ný gögn.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1">
                <Bell className="w-3 h-3" />
                <span>{notificationSubscribersCount} vilja tilkynningar</span>
              </span>
              <span className="px-2.5 py-1 rounded bg-neutral-100 text-neutral-800 border border-neutral-200 font-bold">
                {approvedCount} samþykktir
              </span>
            </div>

            <button
              type="button"
              onClick={fetchSignups}
              className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition cursor-pointer"
              title="Endurhlaða skráningar"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingSignups ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Signups Table */}
        {signups.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
            Engar skráningar hafa borist enn. Þær munu birtast hér um leið og notendur skrá sig á forsíðu rikisgat.is.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-300 bg-neutral-50 text-[11px] font-black uppercase text-neutral-700 tracking-wider">
                  <th className="py-2.5 px-3">Dagsetning</th>
                  <th className="py-2.5 px-3">Nafn</th>
                  <th className="py-2.5 px-3">Netfang</th>
                  <th className="py-2.5 px-3">Hlutverk / Áhugi</th>
                  <th className="py-2.5 px-3">Tilkynningar</th>
                  <th className="py-2.5 px-3">Staða</th>
                  <th className="py-2.5 px-3 text-right">Aðgerðir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {signups.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/80 transition">
                    <td className="py-3 px-3 text-neutral-500 font-mono">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('is-IS') : '—'}
                    </td>
                    <td className="py-3 px-3 font-bold text-neutral-900">
                      {s.name}
                      {s.note && (
                        <span className="block text-[11px] text-neutral-500 font-normal italic">
                          „{s.note}“
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-neutral-700">
                      {s.email}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 text-[10px] font-semibold">
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleNotifications(s.id, Boolean(s.wants_notifications))}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                          s.wants_notifications
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                        }`}
                        title="Smelltu til að breyta tilkynningastillingu"
                      >
                        {s.wants_notifications ? (
                          <>
                            <Bell className="w-3 h-3 text-emerald-700" />
                            <span>Já (Tilkynna)</span>
                          </>
                        ) : (
                          <>
                            <BellOff className="w-3 h-3 text-neutral-400" />
                            <span>Nei</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-900'
                          : s.status === 'rejected'
                          ? 'bg-rose-100 text-rose-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {s.status === 'approved' ? 'Samþykkt' : s.status === 'rejected' ? 'Hafnað' : 'Í bið'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5">
                      {s.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateSignupStatus(s.id, 'approved')}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition cursor-pointer"
                        >
                          Samþykkja
                        </button>
                      )}
                      {s.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateSignupStatus(s.id, 'rejected')}
                          className="px-2 py-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded text-[10px] font-bold transition cursor-pointer"
                        >
                          Hafna
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Bæta við stofnanda */}
      {showAddFounderModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-neutral-900 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-neutral-900" />
                <h3 className="text-base font-black uppercase text-neutral-900">
                  Bæta við nýjum stofnanda
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFounderModal(false)}
                className="text-neutral-500 hover:text-neutral-900 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFounder} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-neutral-700">Fullt nafn: *</label>
                <input
                  type="text"
                  required
                  value={newFounderName}
                  onChange={(e) => setNewFounderName(e.target.value)}
                  placeholder="t.d. Jónína Jónsdóttir"
                  className="w-full p-2 border border-neutral-300 rounded-lg text-sm bg-white outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-neutral-700">Netfang: *</label>
                <input
                  type="email"
                  required
                  value={newFounderEmail}
                  onChange={(e) => setNewFounderEmail(e.target.value)}
                  placeholder="nafn@dæmi.is"
                  className="w-full p-2 border border-neutral-300 rounded-lg text-sm bg-white outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-neutral-700">Hlutverk: *</label>
                <select
                  value={newFounderRole}
                  onChange={(e) => setNewFounderRole(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-sm bg-white outline-none focus:border-neutral-900"
                >
                  <option value="Stofnandi">Stofnandi félagsins</option>
                  <option value="Stjórnarmaður">Stjórnarmaður</option>
                  <option value="Endurskoðandi">Endurskoðandi / Sérfræðingur</option>
                  <option value="Kerfisstjóri">Kerfisstjóri / Tæknimaður</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-neutral-700">Aðgangskóði / Lykilorð: *</label>
                <input
                  type="text"
                  required
                  value={newFounderCode}
                  onChange={(e) => setNewFounderCode(e.target.value)}
                  placeholder="Veldu sterkt lykilorð..."
                  className="w-full p-2 border border-neutral-300 rounded-lg text-sm font-mono bg-neutral-50 focus:bg-white outline-none focus:border-neutral-900"
                />
              </div>

              {addFounderError && (
                <p className="text-xs font-bold text-red-600">{addFounderError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowAddFounderModal(false)}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-neutral-700 hover:bg-neutral-100"
                >
                  Hætta við
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFounder}
                  className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs disabled:opacity-50"
                >
                  {isSubmittingFounder ? 'Vistar...' : 'Vista stofnanda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
