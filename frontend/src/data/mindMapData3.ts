export const mindMapData3 = {
  meetingTitle: "AI & Capital Markets Forum",
  results: [
    {
      keyword: "AI agents",
      speakers: {
        "Leila Marsh": [
          { timestamp: 22.1, text: "AI agents will displace entire categories of knowledge work within three years." },
          { timestamp: 134.7, text: "The bottleneck isn't intelligence — it's the tools and memory systems around agents." },
          { timestamp: 290.4, text: "Multi-agent frameworks are where the emergent capability really starts to show." },
        ],
        "Tom Reyes": [
          { timestamp: 88.3, text: "AI agents in finance need strict guardrails — the liability question is still unresolved." },
          { timestamp: 350.0, text: "We're already using agent pipelines for earnings call summarization and it's transformative." },
        ],
      },
    },
    {
      keyword: "volatility",
      speakers: {
        "Leila Marsh": [
          { timestamp: 510.2, text: "Market volatility is actually a feature for AI trading systems — more signal, more opportunity." },
          { timestamp: 640.8, text: "The regime shift in volatility post-2022 has made historical backtests less reliable." },
        ],
        "Tom Reyes": [
          { timestamp: 575.4, text: "Volatility clustering is one of the most exploitable patterns AI has identified at scale." },
          { timestamp: 700.1, text: "When volatility spikes, the liquidity withdrawal is what kills most algorithmic strategies." },
        ],
      },
    },
    {
      keyword: "LLMs",
      speakers: {
        "Leila Marsh": [
          { timestamp: 820.6, text: "LLMs are surprisingly good at parsing unstructured financial documents and extracting signals." },
          { timestamp: 910.0, text: "Fine-tuned LLMs on 10-K filings outperform general-purpose models for financial reasoning." },
        ],
      },
    },
    {
      keyword: "leverage",
      speakers: {
        "Tom Reyes": [
          { timestamp: 1050.3, text: "AI models have a dangerous tendency to recommend leverage without fully modeling tail risk." },
          { timestamp: 1140.7, text: "Leverage amplifies both the returns and the fragility in AI-driven portfolios." },
        ],
        "Leila Marsh": [
          { timestamp: 1095.5, text: "Intelligent leverage management is actually where AI adds the most risk-adjusted alpha." },
        ],
      },
    },
    {
      keyword: "regulation",
      speakers: {
        "Leila Marsh": [
          { timestamp: 1280.0, text: "Regulatory frameworks are two cycles behind the actual technology being deployed." },
          { timestamp: 1360.4, text: "The EU's AI Act will slow European capital markets innovation relative to the US." },
        ],
        "Tom Reyes": [
          { timestamp: 1310.8, text: "Regulation is inevitable and honestly necessary — systemic risk from black-box AI is real." },
          { timestamp: 1420.2, text: "The firms that get ahead of compliance now will have a structural advantage later." },
        ],
      },
    },
    {
      keyword: "data quality",
      speakers: {
        "Tom Reyes": [
          { timestamp: 1580.5, text: "Garbage in, garbage out — data quality is the silent failure mode of most AI finance projects." },
          { timestamp: 1660.0, text: "Alternative data sets are only valuable if they're clean, consistent, and exclusive." },
        ],
      },
    },
    {
      keyword: "Bitcoin",
      speakers: {
        "Leila Marsh": [
          { timestamp: 1800.3, text: "Bitcoin's on-chain data is actually one of the richest real-time financial signal sources available." },
        ],
        "Tom Reyes": [
          { timestamp: 1845.6, text: "AI-driven Bitcoin position sizing based on on-chain metrics has been quietly profitable." },
        ],
      },
    },
    {
      keyword: "MicroStrategy",
      speakers: {
        "Tom Reyes": [
          { timestamp: 2010.4, text: "MicroStrategy's balance sheet approach is a fascinating macro hedge, not just a Bitcoin bet." },
          { timestamp: 2090.1, text: "The options market around MicroStrategy tells you a lot about institutional sentiment." },
        ],
      },
    },
  ],
} as const;

export type MentionEntry3 = { timestamp: number; text: string };
export type SpeakerMentions3 = Record<string, MentionEntry3[]>;
export type KeywordResult3 = { keyword: string; speakers: SpeakerMentions3 };
