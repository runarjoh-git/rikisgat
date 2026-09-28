import React, { useState } from 'react';
import { X, ShieldAlert, Lock, Send, CheckCircle2, AlertTriangle, Building2, HelpCircle, EyeOff } from 'lucide-react';

interface WhistleblowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledInstitution?: string;
  prefilledSupplier?: string;
  prefilledInvoice?: string;
}

export const WhistleblowerModal: React.FC<WhistleblowerModalProps> = ({
  isOpen,
  onClose,
  prefilledInstitution = '',
  prefilledSupplier = '',
  prefilledInvoice = ''
}) => {
  const [institution, setInstitution] = useState(prefilledInstitution);
  const [supplier, setSupplier] = useState(prefilledSupplier);
  const [invoiceNumber, setInvoiceNumber] = useState(prefilledInvoice);
  const [category, setCategory] = useState<'radgjof' | 'ferdir' | 'hugbunadur' | 'nefndir' | 'annad'>('radgjof');
  const [details, setDetails] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Sync props if modal reopens with prefilled data
  React.useEffect(() => {
    if (prefilledInstitution) setInstitution(prefilledInstitution);
    if (prefilledSupplier) setSupplier(prefilledSupplier);
    if (prefilledInvoice) setInvoiceNumber(prefilledInvoice);
  }, [prefilledInstitution, prefilledSupplier, prefilledInvoice, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setDetails('');
      setContactEmail('');
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs transition-opacity" 
      />

      {/* Modal Dialog */}
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-neutral-900 text-white p-5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm tracking-tight">Ábendingar ríkisstarfsmanna</h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-mono font-bold px-1.5 py-0.2 rounded border border-amber-400/30">
                  100% Trúnaður
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Bentu á grunsamleg útgjöld, reikninga eða óeðlilegt bruðl
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Protection Banner */}
        <div className="bg-amber-50/80 border-b border-amber-200/80 px-5 py-2.5 flex items-start gap-2.5 text-xs text-amber-900">
          <EyeOff className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-snug text-[11px]">
            <strong>Algjör nafnleynd:</strong> Engum IP-tölum né vafraupplýsingum er safnað. 
            Lög nr. 40/2020 vernda starfsmenn sem benda á brot eða ámælisverða stjórnsýsluhætti.
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm">Ábending móttekin</h4>
              <p className="text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
                Kærar þakkir fyrir að leggja þitt af mörkum til gagnsæis og aðhalds í ríkisrekstri. 
                Ábendingin verður rýnd án tengingar við persónugreinanleg gögn.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Hvers eðlis er ábendingin?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'radgjof', label: '💼 Ráðgjafakaup' },
                    { id: 'ferdir', label: '✈️ Ferðir / risna' },
                    { id: 'hugbunadur', label: '💻 Kerfi & hugbúnaður' },
                    { id: 'nefndir', label: '🏛️ Nefndagreiðslur' },
                    { id: 'annad', label: '📦 Óeðlileg innkaup' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      className={`p-2 rounded-xl text-left font-bold transition cursor-pointer border text-[11px] ${
                        category === cat.id
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Institution and Supplier (Optional / Flexible) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Stofnun / Ráðuneyti
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                    placeholder="T.d. Orkustofnun eða Vegagerðin"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Birgir / Fyrirtæki
                  </label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    placeholder="T.d. Ráðgjafafélag ehf."
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              {/* Invoice Number if available */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Reikningsnúmer eða tímabil (valfrjálst)
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  placeholder="T.d. Reikningur nr. 102948 eða febrúar 2025"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* Description textarea */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Hvað finnst þér skrýtið eða óeðlilegt við þennan kostnað? *
                </label>
                <textarea
                  rows={4}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  required
                  placeholder="Lýstu því sem þér þykir athugavert (t.d. verkefni sem aldrei var klárað, óhóflegir reikningar miðað við vinnu, eða duldar aukagreiðslur)..."
                  className="w-full p-3 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 leading-relaxed"
                />
              </div>

              {/* Optional Email */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Netfang (valfrjálst — aðeins ef þú vilt fá staðfestingu eða spurningar)
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="nafnlaus@proton.me eða skildu eftir tómt"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Senda inn trúnaðarábendingu</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
