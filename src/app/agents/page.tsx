"use client";
import React from "react";
import { Brain, Youtube, Globe as  BarChart3, MessageSquare, Newspaper, FileUser, Plane } from "lucide-react";
import { Globe } from "@/components/ui/globe";
import { useRouter } from "next/navigation";

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  slug: string;
}

const agents: Agent[] = [
  {
    id: "1",
    name: "News Summarizer Agent",
    description: "Takes a news URL or a keyword from the user and returns a summary of the news article or keyword",
    icon: <Newspaper className="w-8 h-8 text-yellow-400" />,
    slug: "news-summarizer"
  },
  {
    id: "2",
    name: "Youtube Agent",
    description: "This agent analyzes YouTube videos and provides detailed summaries, timestamps, and key points.",
    icon: <Youtube className="w-8 h-8 text-red-500" />,
    slug: "video-script-generator"
  },
  {
    id: "3",
    name: "Research Agent",
    description: "This agent conducts comprehensive research on a given topic and provides a detailed report.",
    icon: <Brain className="w-8 h-8 text-blue-400" />,
    slug: "research-agent"
  },
  {
    id: "4",
    name: "Resume & Cover Letter Enhancer",
    description: "Analyze and grade website designs",
    icon: <FileUser className="w-8 h-8 text-green-400" />,
    slug: "web-design-grader"
  },
  {
    id: "5",
    name: "Travel Itinerary Planner",
    description: "Provide a a destination, travel dates, and user preferences and get a detailed travel itinerary",
    icon: <Plane  className="w-8 h-8 text-purple-400" />,
    slug: "analytics-interpreter"
  },
  
];

export default function AgentsPage() {
  const router = useRouter();

  const handleAgentClick = (slug: string) => {
    router.push(`/agents/${slug}`);
  };

  return (
    <div className="relative min-h-screen bg-[#060606] text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-gray-800">
        <div className="w-full px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-[#02ece9] font-semibold text-lg">Agent Marketplace</h1>
            <a 
              href="/" 
              className="flex items-center gap-2 text-white hover:text-[#02ece9] transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Back to MultiChat</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-8">
        {/* Hero Section with Title and Globe */}
        <div className="flex flex-col items-center justify-center">
          {/* Title Section */}
          <div className="text-center mb-16 px-4">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-[#02ece9] to-[#70ec00] text-transparent bg-clip-text leading-normal py-2">
              AI Agents
            </h1>
            <p className="text-2xl text-gray-400 max-w-xl">
              Discover powerful AI agents to help you with your tasks
            </p>
          </div>

          {/* Globe Section */}
          <div className="relative h-[500px] w-full mb-20">
            <Globe />
            <div className="absolute inset-0 from-transparent via-transparent to-[#060606]" />
          </div>
        </div>

        {/* Agent Cards */}
        <div className="px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-[#1a1a1a]/90 backdrop-blur-sm rounded-lg p-6 border border-gray-800 hover:border-[#02ece9]/50 transition-colors"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-gray-800 flex items-center justify-center mb-4">
                    {agent.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{agent.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{agent.description}</p>
                  <button 
                    onClick={() => handleAgentClick(agent.slug)}
                    className="mt-4 w-full bg-gradient-to-r from-[#02ece9] to-[#70ec00] text-black font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Go
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 