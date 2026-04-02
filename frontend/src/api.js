const BASE = "/pool";

async function req(path, method = "GET", body) {
  const opts = {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  };
  const res = await fetch(BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  getState:  ()                     => req("/state"),
  getHistory:()                     => req("/history"),
  deposit:   (address, name, amount)=> req("/deposit",  "POST", { address, name, amount }),
  propose:   (proposer, to, amount, description) =>
                                        req("/propose",  "POST", { proposer, to, amount, description }),
  vote:      (proposalId, member, vote) =>
                                        req("/vote",     "POST", { proposalId, member, vote }),
};
