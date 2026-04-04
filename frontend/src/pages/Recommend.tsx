import { motion } from "framer-motion";
import { Sparkles, Star, Briefcase, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const recommended = {
  name: "Sarah Chen",
  skills: ["React", "Solidity", "TypeScript", "Web3.js"],
  rating: 4.9,
  experience: "6 years",
  avatar: "SC",
  matchPercent: 96,
  reasons: [
    "Expert in React and TypeScript — core stack for your project",
    "3+ years Solidity experience for smart contract integration",
    "Previously completed 12 similar DeFi projects",
    "98% on-time delivery rate",
  ],
};

export default function Recommend() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Recommendation</h1>
        <p className="text-muted-foreground mt-1">Our AI analyzed your project and found the perfect match.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card glow-primary border-primary/30 p-8"
      >
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-primary">AI Recommended</span>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-xl font-bold text-secondary-foreground">
            {recommended.avatar}
          </div>
          <div>
            <h2 className="text-xl font-bold">{recommended.name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Star className="h-4 w-4 text-warning fill-warning" />
              {recommended.rating} · <Briefcase className="h-4 w-4" /> {recommended.experience}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Match Score</span>
            <span className="text-primary font-semibold">{recommended.matchPercent}%</span>
          </div>
          <Progress value={recommended.matchPercent} className="h-2" />
        </div>

        <div className="flex flex-wrap gap-1.5 mb-6">
          {recommended.skills.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">
              {s}
            </Badge>
          ))}
        </div>

        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground">Why this match?</h3>
          {recommended.reasons.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-2 text-sm"
            >
              <span className="text-primary mt-0.5">✓</span>
              <span className="text-muted-foreground">{r}</span>
            </motion.div>
          ))}
        </div>

        <Link to="/freelancers">
          <Button className="w-full">
            View All Freelancers & Hire <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
