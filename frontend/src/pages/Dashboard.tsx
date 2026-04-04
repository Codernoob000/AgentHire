import { Link } from "react-router-dom";
import { FileText, Users, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { label: "Active Projects", value: "3", icon: FileText },
  { label: "Freelancers Available", value: "24", icon: Users },
  { label: "AI Matches", value: "7", icon: Sparkles },
];

const quickLinks = [
  { title: "Post a Project", desc: "Describe your project and set a budget", to: "/post-project", icon: FileText },
  { title: "Browse Freelancers", desc: "View top-rated talent for your needs", to: "/freelancers", icon: Users },
  { title: "AI Recommendations", desc: "Get smart matches powered by AI", to: "/recommend", icon: Sparkles },
];

export default function Dashboard() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's your hiring overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </div>
              <s.icon className="h-8 w-8 text-primary opacity-60" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map((l, i) => (
          <motion.div
            key={l.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <Link
              to={l.to}
              className="glass-card p-5 block group hover:border-primary/40 transition-colors"
            >
              <l.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-semibold">{l.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{l.desc}</p>
              <div className="flex items-center gap-1 text-primary text-sm mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                Go <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
