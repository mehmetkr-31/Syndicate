import express from "express";
import cors from "cors";
import poolRouter from "./routes/pool.js";
import { seedDemo } from "./lib/store.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/pool", poolRouter);

app.get("/health", (_, res) => res.json({ ok: true, service: "syndicate-backend" }));

// Seed demo members so the UI starts with something interesting
seedDemo();

app.listen(PORT, () => {
  console.log(`\n🏛  Syndicate backend running on http://localhost:${PORT}`);
  console.log(`   OWS Wallet : syndicate-treasury`);
  console.log(`   OWS Policy : withdrawal-policy (51% threshold)`);
  console.log(`   Chain      : Base Sepolia (eip155:84532)\n`);
});
