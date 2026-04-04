import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Star, Briefcase, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

interface RecommendationResponse {
  recommended_freelancer: string;
  rating: number;
  experience: number;
  match_score: number;
}

export default function Recommend() {
  const [description, setDescription] = useState("");
  const [recommended, setRecommended] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHiring, setIsHiring] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);

  const handleRecommend = async () => {
    if (!description.trim()) {
      setError("Please enter a project description.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setRecommended(null);
    setTxId(null);
    
    try {
      const response = await fetch("http://127.0.0.1:8000/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch recommendation");
      }
      
      const data = await response.json();
      setRecommended(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHire = async () => {
    if (!recommended) return;
    
    setIsHiring(true);
    setError(null);
    
    try {
      const response = await fetch("http://127.0.0.1:8000/hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freelancer: recommended.recommended_freelancer }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to hire freelancer");
      }
      
      const data = await response.json();
      setTxId(data.tx_id);
    } catch (err: any) {
      setError(err.message || "An error occurred during hiring");
    } finally {
      setIsHiring(false);
    }
  };

  // Fallback data for UI elements not returned by the backend
  const fallbackSkills = ["React", "Solidity", "TypeScript", "Web3.js"];
  const fallbackReasons = [
    "Expert in required tech stack for your project",
    "Highly rated by previous clients",
    "Proven track record of on-time delivery",
  ];
  
  const getAvatarInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "FL";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Recommendation</h1>
        <p className="text-muted-foreground mt-1">Describe your project and let our AI find the perfect match.</p>
      </div>

      <div className="space-y-4">
        <Textarea 
          placeholder="e.g. I need a senior frontend engineer for a React and Web3 project..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <Button 
          onClick={handleRecommend} 
          disabled={isLoading || !description.trim()}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" /> Get Recommendation</>
          )}
        </Button>
        
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm mt-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-500">{error}</span>
          </div>
        )}
      </div>

      {recommended && (
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
              {getAvatarInitials(recommended.recommended_freelancer)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{recommended.recommended_freelancer}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Star className="h-4 w-4 text-warning fill-warning" />
                {recommended.rating} · <Briefcase className="h-4 w-4" /> {recommended.experience} years
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Match Score</span>
              <span className="text-primary font-semibold">{recommended.match_score}%</span>
            </div>
            <Progress value={recommended.match_score} className="h-2" />
          </div>

          <div className="flex flex-wrap gap-1.5 mb-6">
            {fallbackSkills.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>

          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground">Why this match?</h3>
            {fallbackReasons.map((r, i) => (
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

          {txId ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-md p-4 flex items-center gap-3"
            >
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <p className="font-medium text-sm">Successfully Hired!</p>
                <p className="text-xs opacity-80 font-mono mt-1">TX: {txId}</p>
              </div>
            </motion.div>
          ) : (
            <Button onClick={handleHire} disabled={isHiring} className="w-full">
              {isHiring ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing Hiring...</>
              ) : (
                <>Hire {recommended.recommended_freelancer} <ArrowRight className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}
