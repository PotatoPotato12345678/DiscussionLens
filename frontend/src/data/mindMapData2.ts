export const mindMapData2 = {
  meetingTitle: "Web3 Infrastructure Roundtable",
  results: [
    {
      keyword: "Ethereum",
      speakers: {
        "Rina Okafor": [
          { timestamp: 12.3, text: "Ethereum's transition to proof-of-stake fundamentally changed the energy conversation." },
          { timestamp: 88.5, text: "The Merge was the single most important technical event in the last five years." },
          { timestamp: 241.0, text: "Ethereum's roadmap with danksharding is ambitious but achievable." },
        ],
        "Marcus Veld": [
          { timestamp: 55.2, text: "Ethereum faces serious competition from faster L1s, but the network effect is hard to beat." },
          { timestamp: 310.8, text: "I think Ethereum still leads when it comes to DeFi composability." },
        ],
      },
    },
    {
      keyword: "layer 2",
      speakers: {
        "Rina Okafor": [
          { timestamp: 402.6, text: "Layer 2 solutions are where the real user experience improvements are happening." },
          { timestamp: 588.1, text: "Optimistic rollups and ZK rollups represent two different bets on the future." },
        ],
        "Marcus Veld": [
          { timestamp: 470.3, text: "Layer 2 fragmentation is real — users are confused about which network to use." },
          { timestamp: 620.9, text: "We'll need unified liquidity layers to solve the L2 fragmentation problem." },
        ],
      },
    },
    {
      keyword: "ZK proofs",
      speakers: {
        "Rina Okafor": [
          { timestamp: 734.2, text: "ZK proofs are the cryptographic breakthrough that makes trustless computation possible." },
          { timestamp: 801.5, text: "The proof generation time is still a bottleneck, but it's improving rapidly." },
          { timestamp: 900.0, text: "I see ZK proofs eventually moving into identity verification and private voting." },
        ],
      },
    },
    {
      keyword: "validators",
      speakers: {
        "Marcus Veld": [
          { timestamp: 1100.4, text: "Running a validator requires 32 ETH which is a high bar for retail participants." },
          { timestamp: 1188.7, text: "Liquid staking protocols have democratized validator participation significantly." },
        ],
      },
    },
    {
      keyword: "MEV",
      speakers: {
        "Rina Okafor": [
          { timestamp: 1350.0, text: "MEV extraction is essentially a hidden tax on regular users." },
          { timestamp: 1420.6, text: "Proposer-builder separation is the right step toward fair ordering." },
        ],
        "Marcus Veld": [
          { timestamp: 1395.2, text: "MEV isn't all bad — it creates efficiency in certain arbitrage scenarios." },
          { timestamp: 1500.0, text: "The ethical framing of MEV really depends on which side of the trade you're on." },
        ],
      },
    },
    {
      keyword: "stablecoins",
      speakers: {
        "Marcus Veld": [
          { timestamp: 1620.3, text: "Stablecoins are the killer app — they're the bridge between crypto and real commerce." },
          { timestamp: 1710.8, text: "Algorithmic stablecoins are a cautionary tale we shouldn't forget." },
        ],
      },
    },
    {
      keyword: "DeFi",
      speakers: {
        "Rina Okafor": [
          { timestamp: 1880.2, text: "DeFi TVL recovery after the bear market signals genuine resilience in the ecosystem." },
          { timestamp: 1960.5, text: "The composability of DeFi protocols is its greatest strength and greatest attack surface." },
        ],
        "Marcus Veld": [
          { timestamp: 1920.4, text: "DeFi needs better UX or it will remain a niche product for technical users." },
        ],
      },
    },
    {
      keyword: "Bitcoin",
      speakers: {
        "Rina Okafor": [
          { timestamp: 2200.0, text: "Bitcoin's scripting limitations are a feature, not a bug, for its store-of-value thesis." },
        ],
      },
    },
  ],
} as const;

export type MentionEntry2 = { timestamp: number; text: string };
export type SpeakerMentions2 = Record<string, MentionEntry2[]>;
export type KeywordResult2 = { keyword: string; speakers: SpeakerMentions2 };
