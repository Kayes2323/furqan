// scripts/upload-research.mjs
// Run: node scripts/upload-research.mjs

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1PCvioSmIYswJStU273uTxXQ8IIQ-FAc",
  authDomain: "furqan-82cb3.firebaseapp.com",
  projectId: "furqan-82cb3",
  storageBucket: "furqan-82cb3.firebasestorage.app",
  messagingSenderId: "1025091878159",
  appId: "1:1025091878159:web:01c7a98c527e1043c4127a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const researchData = [
  {
    id: "science",
    icon: "🔬",
    name: "বিজ্ঞান",
    order: 1,
    featuredAyah: {
      arabic: "أَوَلَمْ يَرَ الَّذِينَ كَفَرُوا أَنَّ السَّمَاوَاتِ وَالْأَرْضَ كَانَتَا رَتْقًا فَفَتَقْنَاهُمَا",
      bangla: "কাফেররা কি দেখে না যে আকাশ ও পৃথিবী একত্রিত ছিল, তারপর আমি তাদের পৃথক করলাম?",
      ref: "সূরা আম্বিয়া ২১:৩০",
    },
    topics: [
      { title: "বিগ ব্যাং — ১৪০০ বছর আগে কুরআনে", ref: "২১:৩০", order: 1 },
      { title: "ভ্রূণবিদ্যা — মানব সৃষ্টির ধাপ", ref: "২৩:১৩-১৪", order: 2 },
      { title: "সমুদ্রের অন্ধকার স্তর", ref: "২৪:৪০", order: 3 },
      { title: "পাহাড় — পৃথিবীর খুঁটি", ref: "৭৮:৭", order: 4 },
      { title: "মধু — সর্বোত্তম ওষুধ", ref: "১৬:৬৯", order: 5 },
      { title: "পানি — সব জীবনের উৎস", ref: "২১:৩০", order: 6 },
    ],
  },
  {
    id: "economy",
    icon: "💰",
    name: "অর্থনীতি",
    order: 2,
    featuredAyah: {
      arabic: "وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا",
      bangla: "আল্লাহ ব্যবসাকে হালাল করেছেন এবং সুদকে হারাম করেছেন।",
      ref: "সূরা বাকারা ২:২৭৫",
    },
    topics: [
      { title: "সুদ কেন হারাম? — সামাজিক বিজ্ঞান", ref: "২:২৭৫-২৭৯", order: 1 },
      { title: "যাকাত — দারিদ্র্যমুক্তির সিস্টেম", ref: "৯:৬০", order: 2 },
      { title: "ইসলামিক ব্যাংকিং মডেল", ref: "২:২৮২", order: 3 },
      { title: "সম্পদের সুষম বণ্টন", ref: "৫৯:৭", order: 4 },
      { title: "ব্যবসার নৈতিক নীতি", ref: "৮৩:১-৩", order: 5 },
      { title: "ওয়াকফ — সামাজিক বিনিয়োগ", ref: "২:২৬১", order: 6 },
    ],
  },
  {
    id: "psychology",
    icon: "🧠",
    name: "মনোবিজ্ঞান",
    order: 3,
    featuredAyah: {
      arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
      bangla: "জেনে রাখো, আল্লাহর স্মরণেই হৃদয় শান্ত হয়।",
      ref: "সূরা রাদ ১৩:২৮",
    },
    topics: [
      { title: "উদ্বেগ ও বিষণ্নতা — কুরআনের সমাধান", ref: "৯৪:৫-৬", order: 1 },
      { title: "রাগ নিয়ন্ত্রণ — নবীজির পদ্ধতি", ref: "৩:১৩৪", order: 2 },
      { title: "নফস — মানুষের তিন সত্তা", ref: "১২:৫৩", order: 3 },
      { title: "ক্ষমা — মনের মুক্তি", ref: "৪২:৪০", order: 4 },
      { title: "একাকীত্ব থেকে মুক্তি", ref: "৫৮:৭", order: 5 },
      { title: "Resilience — বিপদে মনোবল", ref: "২:২৮৬", order: 6 },
      { title: "আত্মহত্যা প্রতিরোধ — ইসলামের দৃষ্টি", ref: "৪:২৯", order: 7 },
    ],
  },
  {
    id: "politics",
    icon: "⚖️",
    name: "রাজনীতি",
    order: 4,
    featuredAyah: {
      arabic: "وَأَمْرُهُمْ شُورَىٰ بَيْنَهُمْ",
      bangla: "তাদের কার্যাবলী পরস্পর পরামর্শের মাধ্যমে পরিচালিত হয়।",
      ref: "সূরা শূরা ৪২:৩৮",
    },
    topics: [
      { title: "শূরা — ইসলামের পরামর্শ ব্যবস্থা", ref: "৪২:৩৮", order: 1 },
      { title: "ন্যায়বিচার — শাসকের দায়িত্ব", ref: "৪:১৩৫", order: 2 },
      { title: "মানবাধিকার — ইসলামের দৃষ্টিতে", ref: "১৭:৭০", order: 3 },
      { title: "বিচার বিভাগের স্বাধীনতা", ref: "৫:৮", order: 4 },
      { title: "দুর্নীতি — কুরআনের সতর্কতা", ref: "২:২০৫", order: 5 },
      { title: "আধুনিক রাষ্ট্র ও ইসলাম", ref: "৪:৫৮", order: 6 },
      { title: "খিলাফত — ইতিহাস ও বাস্তবতা", ref: "২৪:৫৫", order: 7 },
      { title: "বিধর্মীদের অধিকার", ref: "৬০:৮", order: 8 },
    ],
  },
  {
    id: "sociology",
    icon: "👥",
    name: "সমাজবিজ্ঞান",
    order: 5,
    featuredAyah: {
      arabic: "يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُم مِّن ذَكَرٍ وَأُنثَىٰ",
      bangla: "হে মানুষ! আমি তোমাদের পুরুষ ও নারী থেকে সৃষ্টি করেছি এবং বিভিন্ন জাতি ও গোত্রে বিভক্ত করেছি যাতে তোমরা পরিচিত হও।",
      ref: "সূরা হুজুরাত ৪৯:১৩",
    },
    topics: [
      { title: "পরিবার — সমাজের মূল ভিত্তি", ref: "৩০:২১", order: 1 },
      { title: "নারীর অধিকার — ইসলামের দৃষ্টিতে", ref: "৪:১", order: 2 },
      { title: "হুদুদ কেন? — সমাজরক্ষার বিজ্ঞান", ref: "২৪:২", order: 3 },
      { title: "বর্ণবাদ — ইসলামের অবস্থান", ref: "৪৯:১৩", order: 4 },
      { title: "সামাজিক দায়বদ্ধতা", ref: "১০৭:১-৭", order: 5 },
      { title: "মিডিয়া ও সত্য যাচাই", ref: "৪৯:৬", order: 6 },
    ],
  },
  {
    id: "philosophy",
    icon: "🌌",
    name: "দর্শন",
    order: 6,
    featuredAyah: {
      arabic: "أَمْ خُلِقُوا مِنْ غَيْرِ شَيْءٍ أَمْ هُمُ الْخَالِقُونَ",
      bangla: "তারা কি কোনো কিছু ছাড়াই সৃষ্টি হয়েছে, নাকি তারা নিজেরাই স্রষ্টা?",
      ref: "সূরা তূর ৫২:৩৫",
    },
    topics: [
      { title: "আল্লাহর অস্তিত্বের দার্শনিক প্রমাণ", ref: "৫২:৩৫", order: 1 },
      { title: "তাওহীদ — একত্ববাদের দর্শন", ref: "১১২:১-৪", order: 2 },
      { title: "জ্ঞানের উৎস — Epistemology", ref: "৯৬:১-৫", order: 3 },
      { title: "স্বাধীন ইচ্ছা বনাম নিয়তি", ref: "৮১:২৮-২৯", order: 4 },
      { title: "সময় — কুরআনের দৃষ্টিতে", ref: "১০৩:১", order: 5 },
      { title: "জীবনের উদ্দেশ্য", ref: "৫১:৫৬", order: 6 },
    ],
  },
];

async function upload() {
  console.log("🚀 Firebase এ upload শুরু হচ্ছে...");

  for (const category of researchData) {
    const { id, topics, ...categoryData } = category;

    // Upload category
    await setDoc(doc(db, "research", id), categoryData);
    console.log(`✅ Category uploaded: ${category.name}`);

    // Upload topics
    for (const topic of topics) {
      await setDoc(doc(db, "research", id, "topics", String(topic.order)), topic);
    }
    console.log(`   └── ${topics.length} topics uploaded`);
  }

  console.log("\n🎉 সব content Firebase এ upload হয়েছে!");
  process.exit(0);
}

upload().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
