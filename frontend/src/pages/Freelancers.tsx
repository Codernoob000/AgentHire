import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Briefcase, Sparkles, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Freelancer {
  id: number;
  name: string;
  skills: string[];
  rating: number;
  experience: string;
  avatar: string;
  matchPercent?: number;
  aiRecommended?: boolean;
}

const freelancers: Freelancer[] = [
  {
    id: 1,
    name: "Sarah Chen",
    skills: ["React", "Solidity", "TypeScript"],
    rating: 4.9,
    experience: "6 years",
    avatar: "SC",
    matchPercent: 96,
    aiRecommended: true,
  },
  {
    id: 2,
    name: "Marcus Williams",
    skills: ["Python", "Smart Contracts", "Node.js"],
    rating: 4.7,
    experience: "4 years",
    avatar: "MW",
    matchPercent: 82,
  },
  {
    id: 3,
    name: "Aisha Patel",
    skills: ["Rust", "Blockchain", "DevOps"],
    rating: 4.8,
    experience: "5 years",
    avatar: "AP",
    matchPercent: 78,
  },
];

export default function Freelancers() {
  const [hireState, setHireState] = useState<{
    status: "idle" | "loading" | "success";
    freelancerId?: number;
    txId?: string;
  }>({ status: "idle" });

  const handleHire = async (f: Freelancer) => {
    setHireState({ status: "loading", freelancerId: f.id });

    // Simulate POST /hire
    await new Promise((r) => setTimeout(r, 2000));

    const txId = "ALGO-TX-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    setHireState({ status: "success", freelancerId: f.id, txId });
    toast.success(`${f.name} hired successfully!`);
  };

  const copyTxId = () => {
    if (hireState.txId) {
      navigator.clipboard.writeText(hireState.txId);
      toast("Transaction ID copied!");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Freelancers</h1>
        <p className="text-muted-foreground mt-1">Top talent matched to your project.</p>
      </div>

      {/* AI Recommendation Banner */}
      {freelancers.find((f) => f.aiRecommended) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card glow-primary p-5 border-primary/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary text-sm">AI Recommended Freelancer</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Based on your project requirements, <strong className="text-foreground">Sarah Chen</strong> is the best
            match with a <span className="text-primary font-semibold">96% compatibility score</span>.
          </p>
        </motion.div>
      )}

      {/* Freelancer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {freelancers.map((f, i) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-5 flex flex-col ${f.aiRecommended ? "border-primary/30 glow-primary" : ""}`}
          >
            {f.aiRecommended && (
              <Badge className="self-start mb-3 bg-primary/15 text-primary border-primary/30 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Pick · {f.matchPercent}% match
              </Badge>
            )}
            {!f.aiRecommended && f.matchPercent && (
              <Badge variant="secondary" className="self-start mb-3 text-xs">
                {f.matchPercent}% match
              </Badge>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-secondary-foreground">
                {f.avatar}
              </div>
              <div>
                <h3 className="font-semibold">{f.name}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 text-warning fill-warning" />
                  {f.rating} · <Briefcase className="h-3 w-3" /> {f.experience}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {f.skills.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs font-normal">
                  {s}
                </Badge>
              ))}
            </div>

            <div className="mt-auto">
              <Button
                className="w-full"
                variant={f.aiRecommended ? "default" : "secondary"}
                disabled={hireState.status === "loading" || hireState.status === "success"}
                onClick={() => handleHire(f)}
              >
                {hireState.status === "loading" && hireState.freelancerId === f.id
                  ? "Processing..."
                  : "Hire Freelancer"}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Payment Success */}
      <AnimatePresence>
        {hireState.status === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card glow-primary border-primary/30 p-6 text-center"
          >
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
            <h2 className="text-xl font-bold">Payment Successful</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Your freelancer has been hired and payment is confirmed on-chain.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <code className="bg-secondary px-3 py-1.5 rounded text-sm text-foreground">
                {hireState.txId}
              </code>
              <Button variant="ghost" size="icon" onClick={copyTxId} className="h-8 w-8">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Badge className="mt-3 bg-primary/15 text-primary border-primary/30">
              Algorand Testnet
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
