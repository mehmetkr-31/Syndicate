import React, { useState } from "react";
import { api } from "../api";

export default function Deposit({ state, onSuccess }) {
  const members = state?.members ?? [];
  const humans = members.filter(m => !m.isAgent);
  const totalBalance = state?.totalBalance ?? 0;

  const [selectedMember, setSelectedMember] = useState(humans[0]?.address || "");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleDeposit() {
    if (!selectedMember || !amount || isNaN(amount) || Number(amount) <= 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const member = members.find(m => m.address === selectedMember);
      await api.deposit(selectedMember, member?.name ?? "Unknown", parseFloat(amount));
      if (onSuccess) onSuccess();
      setAmount("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      
      {/* Page Header */}
      <section className="space-y-1">
        <h1 className="font-headline font-extrabold text-4xl tracking-tighter-2 uppercase text-on-surface">
          Deposit Terminal
        </h1>
        <p className="font-label text-[10px] tracking-widest uppercase text-gray-500">Execute sovereign capital injection to syndicate treasury.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT — Manual Deposit Form */}
        <div className="bg-surface-container-low border-l-2 border-primary p-6 flex flex-col gap-6 glow-primary">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
            <span className="font-mono text-[10px] tracking-widest uppercase text-primary font-bold">Protocol Section: 01</span>
            <span className="font-mono text-[10px] tracking-widest uppercase text-gray-500">Manual_Deposit_v1.0</span>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase">Select Member Identity</label>
              <div className="relative">
                <select 
                  value={selectedMember}
                  onChange={e => setSelectedMember(e.target.value)}
                  className="input-tactical appearance-none pr-8 cursor-pointer"
                >
                  {humans.map(m => (
                    <option key={m.address} value={m.address}>{m.name} ({m.address.slice(0, 6)}...{m.address.slice(-4)})</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">expand_more</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase">Injection Amount (ETH)</label>
              <div className="grid grid-cols-3 gap-2">
                {[1.0, 2.5, 5.0].map(val => (
                  <button 
                    key={val}
                    onClick={() => setAmount(String(val))}
                    className={`py-2 font-mono text-[10px] tracking-widest uppercase border transition-all duration-150 ${amount === String(val) ? "bg-primary text-on-primary border-primary" : "bg-surface-container-highest border-outline-variant/20 hover:bg-primary hover:text-on-primary hover:border-primary"}`}
                  >
                    {val.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase">Custom Manual Override</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="input-tactical text-2xl font-bold font-mono pr-16 placeholder:text-gray-800" 
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-gray-500 uppercase">ETH</span>
              </div>
            </div>

            {error && <p className="font-mono text-xs text-error border-l-2 border-error pl-3 mb-4">{error}</p>}
          </div>

          <button 
            onClick={handleDeposit}
            disabled={isSubmitting || !selectedMember || !amount}
            className="w-full bg-primary text-on-primary py-4 font-headline font-extrabold text-sm tracking-widest uppercase hover:brightness-110 glow-primary transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>►</span>
            <span>{isSubmitting ? "Processing..." : "Deposit ETH"}</span>
          </button>
        </div>

        {/* RIGHT — MoonPay */}
        <div className="bg-surface-container-low border-l-2 border-secondary p-6 flex flex-col justify-between glow-secondary">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
              <span className="font-mono text-[10px] tracking-widest uppercase text-secondary font-bold">Protocol Section: 02</span>
              <span className="font-mono text-[10px] tracking-widest uppercase text-gray-500">Fiat_Onramp_Interface</span>
            </div>

            <div className="flex flex-col items-center py-8 gap-6">
              <div className="w-20 h-20 bg-white flex items-center justify-center shadow-glow-secondary">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUQqw1ybsFSdBszLQ56DjKGILVyepgWBICo3uUOO3QUl2wt5Yctn20pe8dX_QXPgX4Ws1UbnqrRBHK2LxztKFLf2YYeOFx972U3KVCUm9SOzVas146Me8YtY8gVWCQCzX6LBm-puiSJgPkRCPTqIOOvrfqtCATYpcXwoGwuDl7ghpUMYGVw-EkmAWl5zAUxizrrotxnrLPdQmXsHWHTt47k6Dp048n18Kb3VUBiR5ATRMI27G6PE5ghBRcq_13ForTMm9paTDt0PnU" 
                  alt="MoonPay" 
                  className="w-12 h-12" 
                />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-headline font-bold text-xl uppercase text-on-surface">Fund with MoonPay</h3>
                <p className="font-body text-sm text-on-surface-variant max-w-xs mx-auto italic">
                  Deposit any crypto → <span className="text-secondary">auto-converts to ETH</span> → Base Sepolia
                </p>
              </div>
            </div>

            <div className="bg-surface-container-highest p-4 border border-outline-variant/20 space-y-2">
              <div className="flex justify-between font-mono text-[10px] uppercase">
                <span className="text-gray-500">Network Fee</span>
                <span className="text-on-surface">~0.0012 ETH</span>
              </div>
              <div className="flex justify-between font-mono text-[10px] uppercase">
                <span className="text-gray-500">Service Fee</span>
                <span className="text-on-surface">0.00% SYNDICATE_FREE</span>
              </div>
            </div>
          </div>

          <button 
            className="w-full py-4 mt-6 font-headline font-extrabold text-sm tracking-widest uppercase text-white flex items-center justify-center gap-2 hover:brightness-110 transition-all" 
            style={{ background: "#7d32ff", boxShadow: "0 0 20px rgba(125,50,255,0.35)" }}
          >
            🌙 Fund with MoonPay
          </button>
        </div>
      </div>

      {/* Balances Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-lg tracking-tighter uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_balance</span>
            Current Syndicate Balances
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary animate-pulse inline-block"></span>
            <span className="font-mono text-[10px] tracking-widest uppercase text-gray-500">Live_Feed_Enabled</span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/10 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container font-mono text-[10px] tracking-widest uppercase text-gray-500 border-b border-outline-variant/20">
                <th className="px-6 py-4">MEMBER_ID</th>
                <th className="px-6 py-4 font-medium">WALLET_ADDRESS</th>
                <th className="px-6 py-4 text-right font-medium">BALANCE_ETH</th>
                <th className="px-6 py-4 text-right font-medium">VOTING_POWER</th>
                <th className="px-6 py-4 text-center font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {members.map(m => (
                <tr key={m.address} className="border-b border-outline-variant/10 hover:bg-surface-container-high transition-colors">
                  <td className="px-6 py-4 text-on-surface">{m.name}</td>
                  <td className="px-6 py-4 text-gray-500">{m.address.slice(0, 6)}...{m.address.slice(-4)}</td>
                  <td className="px-6 py-4 text-right font-bold text-primary">{m.balance.toFixed(4)} ETH</td>
                  <td className="px-6 py-4 text-right text-on-surface">{m.votingPower.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-center">
                    {m.balance < 10 
                      ? <span className="inline-flex items-center text-[10px] px-2 py-0.5 border border-error text-error uppercase font-bold">Idle</span>
                      : <span className="inline-flex items-center text-[10px] px-2 py-0.5 border border-primary text-primary uppercase font-bold">Active</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
