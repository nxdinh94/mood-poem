import { getFirestore, collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

export interface PoemData {
  id: string;
  content: string;
  author: string;
  tags?: string[];
}

export const poemsData: PoemData[] = [
  {
    id: "poem-1",
    content: "Do not go gentle into that good night,\nOld age should burn and rave at close of day;\nRage, rage against the dying of the light.",
    author: "Dylan Thomas",
    tags: ["classic", "defiance"]
  },
  {
    id: "poem-2",
    content: "The woods are lovely, dark and deep,\nBut I have promises to keep,\nAnd miles to go before I sleep,\nAnd miles to go before I sleep.",
    author: "Robert Frost",
    tags: ["classic", "nature"]
  },
  {
    id: "poem-3",
    content: "Two roads diverged in a wood, and I—\nI took the one less traveled by,\nAnd that has made all the difference.",
    author: "Robert Frost",
    tags: ["classic", "choice"]
  },
  {
    id: "poem-4",
    content: "I wandered lonely as a cloud\nThat floats on high o'er vales and hills,\nWhen all at once I saw a crowd,\nA host, of golden daffodils.",
    author: "William Wordsworth",
    tags: ["classic", "nature"]
  },
  {
    id: "poem-5",
    content: "Hope is the thing with feathers\nThat perches in the soul,\nAnd sings the tune without the words,\nAnd never stops at all.",
    author: "Emily Dickinson",
    tags: ["classic", "hope"]
  },
  {
    id: "poem-6",
    content: "I was angry with my friend;\nI told my wrath, my wrath did end.\nI was angry with my foe:\nI told it not, my wrath did grow.",
    author: "William Blake"
  },
  {
    id: "poem-7",
    content: "Out of the night that covers me,\nBlack as the pit from pole to pole,\nI thank whatever gods may be\nFor my unconquerable soul.",
    author: "William Ernest Henley",
    tags: ["classic", "strength"]
  },
  {
    id: "poem-8",
    content: "When I have fears that I may cease to be\nBefore my pen has gleaned my teeming brain,\nBefore high-pilèd books, in charact'ry,\nHold like rich garners the full-ripened grain.",
    author: "John Keats",
    tags: ["classic", "mortality"]
  },
  {
    id: "poem-9",
    content: "The rain is full of ghosts tonight, that tap and sigh\nUpon the glass and listen for reply.",
    author: "Edna St. Vincent Millay",
    tags: ["modern", "rain"]
  },
  {
    id: "poem-10",
    content: "I measure every Grief I meet\nWith narrow, probing, Eyes –\nI wonder if It weighs like Mine –\nOr has an Easier size.",
    author: "Emily Dickinson",
    tags: ["classic", "emotion"]
  },
  {
    id: "poem-11",
    content: "How do I love thee? Let me count the ways.\nI love thee to the depth and breadth and height\nMy soul can reach, when feeling out of sight\nFor the ends of being and ideal grace.",
    author: "Elizabeth Barrett Browning",
    tags: ["classic", "love"]
  },
  {
    id: "poem-12",
    content: "The sun descending in the west,\nThe evening star does shine;\nThe birds are silent in their nest,\nAnd I must seek for mine.",
    author: "William Blake",
    tags: ["classic", "evening"]
  },
  {
    id: "poem-13",
    content: "I have spread my dreams under your feet;\nTread softly because you tread on my dreams.",
    author: "W.B. Yeats",
    tags: ["classic", "dreams"]
  },
  {
    id: "poem-14",
    content: "I celebrate myself, and sing myself,\nAnd what I assume you shall assume,\nFor every atom belonging to me as good belongs to you.",
    author: "Walt Whitman",
    tags: ["classic", "celebration"]
  },
  {
    id: "poem-15",
    content: "Laugh, and the world laughs with you;\nWeep, and you weep alone.\nFor the sad old earth must borrow its mirth,\nBut has trouble enough of its own.",
    author: "Ella Wheeler Wilcox"
  },
  {
    id: "poem-16",
    content: "The sun does arise,\nAnd make happy the skies;\nThe merry bells ring\nTo welcome the Spring.",
    author: "William Blake",
    tags: ["classic", "spring"]
  },
  {
    id: "poem-17",
    content: "My heart leaps up when I behold\nA rainbow in the sky:\nSo was it when my life began;\nSo is it now I am a man.",
    author: "William Wordsworth",
    tags: ["classic", "nature"]
  },
  {
    id: "poem-18",
    content: "Still I rise, still I'll rise\nLike dust, I'll rise.\nDoes my sassiness upset you?\nWhy are you beset with gloom?",
    author: "Maya Angelou",
    tags: ["modern", "strength"]
  },
  {
    id: "poem-19",
    content: "If you can dream—and not make dreams your master;\nIf you can think—and not make thoughts your aim;\nIf you can meet with Triumph and Disaster\nAnd treat those two impostors just the same.",
    author: "Rudyard Kipling",
    tags: ["classic", "wisdom"]
  },
  {
    id: "poem-20",
    content: "To be, or not to be, that is the question:\nWhether 'tis nobler in the mind to suffer\nThe slings and arrows of outrageous fortune,\nOr to take arms against a sea of troubles.",
    author: "William Shakespeare",
    tags: ["classic", "philosophy"]
  }
];

export const seedPoems = async (db: ReturnType<typeof getFirestore>) => {
  try {
    const poemsCollection = collection(db, "poem-poem");
    
    for (const poem of poemsData) {
      const poemRef = doc(poemsCollection, poem.id);
      await setDoc(poemRef, {
        id: poem.id,
        content: poem.content,
        author: poem.author,
        createdAt: serverTimestamp(),
        ...(poem.tags && { tags: poem.tags })
      });
      console.log(`✅ Seeded poem: ${poem.id}`);
    }
    
    console.log(`🎉 All ${poemsData.length} poems seeded successfully!`);
  } catch (error) {
    console.error("❌ Error seeding poems:", error);
  }
};
