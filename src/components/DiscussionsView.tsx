import React, { useState } from 'react';
import { MessageSquare, ArrowLeft, Send, Sparkles, User, ThumbsUp, Landmark, FileText, CheckCircle2 } from 'lucide-react';

interface DiscussionsViewProps {
  onBackToPortal: () => void;
  onOpenStats: () => void;
}

export const DiscussionsView: React.FC<DiscussionsViewProps> = ({
  onBackToPortal,
  onOpenStats
}) => {
  const [newComment, setNewComment] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<'all' | 'nefndir' | 'sjavarutvegur' | 'styrkir' | 'brudl'>('all');

  const topics = [
    { id: 'all', title: 'Öll málefni' },
    { id: 'brudl', title: '⚠️ Ábendingar & bruðl' },
    { id: 'nefndir', title: '🏛️ Nefndir & starfshópar' },
    { id: 'styrkir', title: '💰 Opinberir styrkir' },
    { id: 'sjavarutvegur', title: '🐟 Sjávarútvegur & kvóti' }
  ];

  const [posts, setPosts] = useState([
    {
      id: 0,
      author: 'Ríkisstarfsmaður (Trúnaður)',
      badge: 'Bending',
      topic: 'brudl',
      topicLabel: 'Ábendingar & bruðl',
      time: 'Í dag',
      title: 'Hvar er restin af peningunum? Ekki vera föst í stærstu tölunum',
      text: 'Í umræðunni horfa allir á Landspítalann eða stærstu lyfjafyrirtækin. En restin af peningunum dreifist á ótal smærri ráðgjafareikninga, ónotuð hugbúnaðarleyfi og risnukostnað sem aldrei er skoðaður. Við þurfum að rýna í millistærðirnar!',
      likes: 19
    },
    {
      id: 1,
      author: 'Rúnar & krakkarnir',
      badge: 'Verkefnisstjóri',
      topic: 'nefndir',
      topicLabel: 'Nefndir & starfshópar',
      time: 'Í dag',
      title: 'Hvað kosta allar nefndir ríkisins á ári hverju?',
      text: 'Við vorum að spá í hve margir sitja í launuðum nefndum og starfshópum á vegum ráðuneytanna. Væri ekki frábært að hafa sérstaka síðu hér sem dregur allar nefndagreiðslur saman?',
      likes: 8
    },
    {
      id: 2,
      author: 'Notandi á innra neti',
      badge: 'Notandi',
      topic: 'sjavarutvegur',
      topicLabel: 'Sjávarútvegur & kvóti',
      time: 'Í gær',
      title: 'Opnu skjölin í sjávarútvegi',
      text: 'Fiskistofa og Matvælaráðuneytið eru með mikið af opnum gögnum um veiðigjöld og úthlutanir. Spennandi að tengja það saman við kaup og reikninga ríkisins.',
      likes: 5
    },
    {
      id: 3,
      author: 'Gagnagátt',
      badge: 'Rýnir',
      topic: 'styrkir',
      topicLabel: 'Opinberir styrkir',
      time: 'Fyrir 2 dögum',
      title: 'Flokkun á styrkjum vs. vörukaupum',
      text: 'Þegar við skoðum bókhaldslínur í reikningum ríkisins væri mjög gagnlegt að geta hakað við „Sýna aðeins styrki“ til að sjá hvert stuðningur ríkisins fer.',
      likes: 12
    }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setPosts(prev => [
      {
        id: Date.now(),
        author: 'Þú (Gestur)',
        badge: 'Notandi',
        topic: selectedTopic === 'all' ? 'nefndir' : selectedTopic,
        topicLabel: selectedTopic === 'sjavarutvegur' ? 'Sjávarútvegur' : selectedTopic === 'styrkir' ? 'Opinberir styrkir' : 'Nefndir & starfshópar',
        time: 'Rétt í þessu',
        title: 'Athugasemd um útgjöld ríkisins',
        text: newComment,
        likes: 1
      },
      ...prev
    ]);
    setNewComment('');
  };

  const filteredPosts = selectedTopic === 'all'
    ? posts
    : posts.filter(p => p.topic === selectedTopic);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
              💬 Tjatt & Umræður
            </h1>
            <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Lifandi samtal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl">
            Vettvangur fyrir notendur til að rýna í reikninga, nefndakostnað, sjávarútvegsmálefni og styrki.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToPortal}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-neutral-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Aftur í reikninga</span>
          </button>

          <button
            onClick={onOpenStats}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Ríkið í tölum</span>
          </button>
        </div>
      </div>

      {/* Topic Switcher */}
      <div className="flex flex-wrap gap-2">
        {topics.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTopic(t.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              selectedTopic === t.id
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Post creation box */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
        <form onSubmit={handleSend} className="space-y-3">
          <label className="block text-xs font-bold text-neutral-700">
            Hvaða línu, reikning eða málefnasvið viltu ræða?
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Skrifaðu athugasemd, pælingu eða hugmynd hér (t.d. um nefndir, styrki eða áhugaverð kaup)..."
              className="w-full p-3 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] text-neutral-400">
              Sýnilegt öllum á innra neti
            </span>
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Senda inn umræðu</span>
            </button>
          </div>
        </form>
      </div>

      {/* Discussion List */}
      <div className="space-y-4">
        {filteredPosts.map(p => (
          <div key={p.id} className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-neutral-900">{p.author}</span>
                <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-mono font-semibold">
                  {p.badge}
                </span>
                <span className="text-[11px] text-neutral-400">• {p.time}</span>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {p.topicLabel}
              </span>
            </div>

            <h3 className="font-bold text-sm text-neutral-900">{p.title}</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">{p.text}</p>

            <div className="pt-2 flex items-center gap-3 text-xs text-neutral-500 border-t border-neutral-100">
              <button 
                onClick={() => {
                  setPosts(prev => prev.map(item => item.id === p.id ? { ...item, likes: item.likes + 1 } : item));
                }}
                className="flex items-center gap-1 hover:text-neutral-900 transition cursor-pointer font-mono"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{p.likes} sammála</span>
              </button>
              <span>•</span>
              <button 
                onClick={() => setNewComment(`@${p.author}: `)}
                className="hover:text-neutral-900 transition cursor-pointer"
              >
                Svara
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
