import React, { useState } from 'react';

const parseIntent = (text) => {
  // 0x ile başlayan 40 karakterlik ETH adresini bulur
  const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
  // Noktalı veya düz sayıları bulur (örnek: 0.5, 12, 1.25)
  const amountMatch = text.match(/(\d+(\.\d+)?)\s*(ETH|USDC|token)/i);

  if (addressMatch && amountMatch) {
    return {
      to: addressMatch[0],
      amount: amountMatch[1]
    };
  }
  return null;
};

export default function IntentPrompt({ onIntentParsed }) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");

  const handleExecute = () => {
    const parsedData = parseIntent(prompt);
    
    if (parsedData) {
      setError("");
      onIntentParsed(parsedData); 
    } else {
      setError("Sistem anlayamadı. Lütfen tam bir ETH adresi ve miktar (örn: 0.5 ETH) girdiğinizden emin olun.");
    }
  };

  return (
    <div className="bg-black border border-green-500/50 rounded-lg p-4 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
      <div className="flex items-center gap-2 mb-2 text-green-400 font-mono text-sm">
        <span className="animate-pulse">_</span>
        <span>Syndicate AI Terminal</span>
      </div>
      
      <textarea
        className="w-full bg-gray-900 text-gray-100 font-mono p-3 rounded border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none resize-none"
        rows="3"
        placeholder="Örn: Hazine'den 0x71C...976 adresine 1.5 ETH gönder."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      
      {error && <div className="text-red-400 text-xs mt-2 font-mono">{error}</div>}
      
      <div className="mt-3 flex justify-end">
        <button 
          onClick={handleExecute}
          className="bg-green-600/20 text-green-400 border border-green-500/50 px-4 py-2 rounded hover:bg-green-600/40 transition-colors font-mono text-sm flex items-center gap-2"
        >
          <span>⚡</span> Otonom İşlemi Başlat
        </button>
      </div>
    </div>
  );
}
