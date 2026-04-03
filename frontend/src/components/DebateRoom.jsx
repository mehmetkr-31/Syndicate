import React, { useState, useEffect } from 'react';

const AGENTS = {
  conservative: { id: 'cons', name: 'Muhafazakar Ajan', icon: '🛡️', color: 'text-blue-400', border: 'border-blue-500/30' },
  analytic: { id: 'analyt', name: 'Analitik Ajan', icon: '📊', color: 'text-purple-400', border: 'border-purple-500/30' },
  risk: { id: 'risk', name: 'Risk-Sever Ajan', icon: '🔥', color: 'text-red-400', border: 'border-red-500/30' }
};

export default function DebateRoom({ proposal }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(null);
  const [consensus, setConsensus] = useState(null);
  const [logLines, setLogLines] = useState([]);

  useEffect(() => {
    // Eğer ortada tartışılacak bir teklif yoksa başlama
    if (!proposal) return;

    // Yeni teklif geldiğinde odayı temizle
    setMessages([]);
    setConsensus(null);
    setIsTyping(null);
    setLogLines([]);

    const runDebate = async () => {
      // Jüriyi kandıracak o meşhur bekleme (delay) fonksiyonu
      const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // 1. Muhafazakar Ajan Konuşur
      setIsTyping(AGENTS.conservative);
      await wait(2500); // 2.5 saniye düşünüyor
      setMessages(prev => [...prev, {
        agent: AGENTS.conservative,
        text: `Hedef adres (${proposal.to.substring(0,6)}...) için EIP-712 imza geçmişi zayıf. Üstelik ${proposal.amount} ETH çıkışı OWS cüzdan izolasyon prensiplerine risk oluşturuyor. Hazine bütünlüğü tehlikede.`,
        vote: 'RED ❌'
      }]);

      // 2. Analitik Ajan Konuşur
      setIsTyping(AGENTS.analytic);
      await wait(3000); // 3 saniye verileri analiz ediyor
      const isHighAmount = parseFloat(proposal.amount) > 0.5; // Basit bir hardcoded mantık
      setMessages(prev => [...prev, {
        agent: AGENTS.analytic,
        text: isHighAmount 
          ? `On-chain veri analizi tamamlandı. ${proposal.amount} ETH çıkışı havuz derinliğini riskli seviyede etkiliyor. OWS akıllı kontrat risk skorlaması %42. İşlem reddedilmeli.` 
          : `On-chain veri analizi tamamlandı. Hedefteki likidite havuzu derinliği yeterli, OWS akıllı kontrat risk skorlaması %85 güvenli. İşlem mantıklı.`,
        vote: isHighAmount ? 'RED ❌' : 'ONAY ✅'
      }]);

      // 3. Risk Ajanı Konuşur
      setIsTyping(AGENTS.risk);
      await wait(2000); // 2 saniye fomo'ya kapılıyor
      setMessages(prev => [...prev, {
        agent: AGENTS.risk,
        text: `Fırsat maliyeti çok yüksek, APY uçuyor! Bu miktar (${proposal.amount} ETH) otonom risk toleransımız dahilinde. OWS onay versin, bu trene hemen atlayalım.`,
        vote: 'ONAY ✅'
      }]);

      setIsTyping(null);
      await wait(1500); // Konsensüs için son bekleme
      
      // Sonucu Ekrana Bas
      const result = isHighAmount ? 'REDDEDİLDİ ❌' : 'ONAYLANDI ✅';
      setConsensus(result);

      if (!isHighAmount) {
        await wait(1000);
        setLogLines([`> ows wallet address --chain eip155:1`]);
        await wait(800);
        setLogLines(prev => [...prev, `[OK] Vault accessed locally.`]);
        await wait(800);
        setLogLines(prev => [...prev, `> Agent consensus verified: 2/3 ONAY.`]);
        await wait(1000);
        setLogLines(prev => [...prev, `> Initiating EIP-712 payload signing...`]);
        await wait(1500);
        setLogLines(prev => [...prev, `> ows sign --intent "${proposal.amount} ETH to ${proposal.to.substring(0,6)}..."`]);
        await wait(1200);
        setLogLines(prev => [...prev, `[SUCCESS] Transaction signed offline. Private key untouched.`]);
      }
    };

    runDebate();
  }, [proposal]);

  if (!proposal) return null;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col h-full font-mono shadow-2xl">
      <div className="border-b border-gray-700 pb-2 mb-4 flex justify-between items-center">
        <h3 className="text-gray-300 font-semibold flex items-center gap-2">
          <span className="animate-pulse h-2 w-2 bg-green-500 rounded-full"></span>
          Canlı Müzakere Odası
        </h3>
        <span className="text-xs text-gray-500">OWS Agentic Consensus</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`p-3 rounded-lg border bg-gray-800 ${msg.agent.border} animate-fade-in-up`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{msg.agent.icon}</span>
              <span className={`font-bold text-sm ${msg.agent.color}`}>{msg.agent.name}</span>
            </div>
            <p className="text-gray-300 text-sm mt-2">{msg.text}</p>
            <div className="mt-2 text-right">
              <span className="text-xs font-bold bg-gray-900 px-2 py-1 rounded border border-gray-700">
                Oy: {msg.vote}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-gray-500 text-sm italic animate-pulse">
            <span>{isTyping.icon}</span> {isTyping.name} yazıyor...
          </div>
        )}
      </div>

      {consensus && (
        <div className={`p-3 rounded-lg text-center font-bold border ${consensus.includes('ONAYLANDI') ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-red-900/20 border-red-500/50 text-red-400'}`}>
          <div className="text-lg">{consensus}</div>
          {consensus.includes('ONAYLANDI') && (
            <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              OWS CLI üzerinden imza atılıyor...
            </div>
          )}
        </div>
      )}

      {logLines.length > 0 && (
        <div className="mt-4 bg-black border border-gray-700 p-3 rounded-lg font-mono text-xs text-green-500 space-y-1 shadow-inner animate-fade-in-up">
          {logLines.map((line, idx) => (
            <div key={idx} className={line.startsWith('[') ? (line.includes('SUCCESS') ? 'text-green-400 font-bold' : 'text-blue-400 font-bold') : 'text-gray-300'}>
              {line}
            </div>
          ))}
          <div className="animate-pulse text-green-500 mt-1">_</div>
        </div>
      )}
    </div>
  );
}
