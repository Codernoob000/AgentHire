import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function PostProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Simulate POST /post-project
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    toast.success("Project posted successfully!");
    navigate("/freelancers");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Post a Project</h1>
        <p className="text-muted-foreground mt-1">Describe what you need and we'll find the best talent.</p>

        <form onSubmit={handleSubmit} className="glass-card p-6 mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input id="title" placeholder="e.g. Build a DeFi Dashboard" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              placeholder="Describe your project requirements, timeline, and deliverables..."
              rows={5}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Budget (USD)</Label>
            <Input id="budget" type="number" placeholder="5000" min={1} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Posting..." : "Post Project"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
