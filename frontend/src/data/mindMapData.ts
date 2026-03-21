export const mindMapData = {
  meetingTitle: "Nakamoto Investment Deep Dive",
  results: [
    {
      keyword: "Bitcoin",
      speakers: {
        "Stephen Lubka": [
          { timestamp: 39.42, text: "to a new fiscal regime, and I fully expect Bitcoin to follow that." },
          { timestamp: 45.78, text: "drop 70% from here? I simply can't see it." },
          { timestamp: 119.54, text: "my name is Stephen Lubka. I'm the VP of Investor Relations for Nakamoto." },
          { timestamp: 3807.86, text: "not a real scenario. If Bitcoin is successful, it will be securitized." },
          { timestamp: 2467.44, text: "I think part of that is evidenced by gold." },
        ],
      },
    },
    {
      keyword: "leverage",
      speakers: {
        "Pierre Ortega": [
          { timestamp: 623.52, text: "That and they want exposure to leverage as well." },
        ],
        "Stephen Lubka": [
          { timestamp: 882.4, text: "access a leverage profile and financial tools that you just can't access otherwise." },
          { timestamp: 896.1, text: "leverage to be defined as intelligence in this market." },
          { timestamp: 1019.8, text: "MicroStrategy certainly would." },
        ],
      },
    },
    {
      keyword: "preferreds",
      speakers: {
        "Stephen Lubka": [
          { timestamp: 1053.78, text: "Originally, it was convertible bonds." },
          { timestamp: 1059.68, text: "his solution has been the preferreds." },
          { timestamp: 1065.1, text: "completely non-callable. It's completely long term." },
        ],
        "Pierre Ortega": [
          { timestamp: 1116.96, text: "you mentioned on the preferreds that it's perpetual." },
        ],
      },
    },
    {
      keyword: "MicroStrategy",
      speakers: {
        "Stephen Lubka": [
          { timestamp: 304.58, text: "Is there value in another one? Can you do it again?" },
          { timestamp: 1019.8, text: "MicroStrategy certainly would." },
          { timestamp: 1169.8, text: "Let's assume MicroStrategy is trading at a 1XM now." },
        ],
      },
    },
    {
      keyword: "MNAVs",
      speakers: {
        "Stephen Lubka": [
          { timestamp: 682.4, text: "the MNAVs on Treasury companies are a function of the current demand for leverage." },
          { timestamp: 704.18, text: "we've seen MNAVs contract." },
          { timestamp: 1363.32, text: "Do I think there's obviously some distance between here and seven to 10 X MNAV?" },
          { timestamp: 2576.66, text: "treasury companies went all the way up to five to seven to eight." },
        ],
      },
    },
    {
      keyword: "DATs",
      speakers: {
        "Pierre Ortega": [
          { timestamp: 2776.1, text: "What do you make of the non-digital?" },
        ],
        "Stephen Lubka": [
          { timestamp: 2863.18, text: "Wanted to throw that out there on DATs." },
          { timestamp: 2868.34, text: "they struggled with an MNAV." },
        ],
      },
    },
    {
      keyword: "treasury company",
      speakers: {
        "Stephen Lubka": [
          { timestamp: 119.54, text: "We are a Bitcoin treasury company." },
          { timestamp: 411.94, text: "company playbook, investing in international first movers." },
          { timestamp: 1007.58, text: "leverage has been the most challenging part to crack for Treasury companies." },
          { timestamp: 1276.38, text: "if Bitcoin continues to go up over time and publicly traded entities continue to have access to financing options." },
        ],
      },
    },
    {
      keyword: "volatility",
      speakers: {
        "Stephen Lubka": [
          { timestamp: 2517.04, text: "the volatility has gone down." },
          { timestamp: 2536.34, text: "where's that early volatility at?" },
          { timestamp: 4023.92, text: "this is just volatility, have the fundamentals changed." },
        ],
      },
    },
    {
      keyword: "spot ETFs",
      speakers: {
        "Stephen Lubka": [
          { timestamp: 2387.68, text: "the launch of the spot ETFs, which not only were the things themselves." },
        ],
      },
    },
  ],
} as const;

export type MentionEntry = { timestamp: number; text: string };
export type SpeakerMentions = Record<string, MentionEntry[]>;
export type KeywordResult = { keyword: string; speakers: SpeakerMentions };
