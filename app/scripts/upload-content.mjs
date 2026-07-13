// scripts/upload-content.mjs
// Run: node scripts/upload-content.mjs

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS = join(__dirname, "../content");

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

// Helper to read file
function read(filename) {
  try {
    return readFileSync(join(UPLOADS, filename), "utf-8");
  } catch {
    console.warn(`⚠️  File not found: ${filename}`);
    return "";
  }
}

const content = {
  science: {
    id: "science",
    icon: "🔬",
    name: "বিজ্ঞান",
    order: 1,
    featuredAyah: {
      arabic: "أَوَلَمْ يَرَ الَّذِينَ كَفَرُوا أَنَّ السَّمَاوَاتِ وَالْأَرْضَ كَانَتَا رَتْقًا فَفَتَقْنَاهُمَا",
      bangla: "কাফেররা কি দেখে না যে আকাশ ও পৃথিবী একত্রিত ছিল, তারপর আমি তাদের পৃথক করলাম?",
      ref: "সূরা আম্বিয়া ২১:৩০",
    },
    articles: [
      { id: "astronomy", title: "জ্যোতির্বিজ্ঞান", subtitle: "মহাকাশ ও মহাবিশ্ব", order: 1, content: read("research-astronomy.md") },
      { id: "embryology", title: "ভ্রূণবিদ্যা", subtitle: "মানব সৃষ্টির ধাপ", order: 2, content: read("research-embryology.md") },
      { id: "oceanography", title: "সমুদ্রবিজ্ঞান", subtitle: "সমুদ্রের গভীর রহস্য", order: 3, content: read("research-oceanography.md") },
      { id: "geography", title: "ভূগোল", subtitle: "পৃথিবী ও ভূমির বিজ্ঞান", order: 4, content: read("research-geography.md") },
      { id: "geography_v2", title: "ভূগোল — বিস্তারিত", subtitle: "আপডেটেড গবেষণা", order: 5, content: read("research-geography-v2.md") },
      { id: "mountain", title: "পাহাড়ের রহস্য", subtitle: "পৃথিবীর খুঁটি", order: 6, content: read("sample-mountain.md") },
      { id: "medicine", title: "চিকিৎসাবিজ্ঞান", subtitle: "কুরআনে স্বাস্থ্য ও চিকিৎসা", order: 7, content: read("research-medicine.md") },
      { id: "botany", title: "উদ্ভিদবিজ্ঞান", subtitle: "গাছপালা ও কৃষি", order: 8, content: read("research-botany.md") },
    ],
  },

  economy: {
    id: "economy",
    icon: "💰",
    name: "অর্থনীতি",
    order: 2,
    featuredAyah: {
      arabic: "وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا",
      bangla: "আল্লাহ ব্যবসাকে হালাল করেছেন এবং সুদকে হারাম করেছেন।",
      ref: "সূরা বাকারা ২:২৭৫",
    },
    articles: [
      { id: "overview", title: "অর্থনীতি — ওভারভিউ", subtitle: "কুরআনে অর্থনৈতিক নীতি", order: 1, content: read("research-economics.md") },
      { id: "part1_problem", title: "পর্ব ১ — বর্তমান সংকট", subtitle: "বর্তমান অর্থনীতির রোগ", order: 2, content: read("islamic-economics-01-problem.md") },
      { id: "part2_riba", title: "পর্ব ২ — সুদের বিকল্প", subtitle: "সুদ ছাড়া অর্থনীতি কীভাবে?", order: 3, content: read("islamic-economics-02-riba-solution.md") },
      { id: "part3_vision", title: "পর্ব ৩ — বাংলাদেশ ভিশন", subtitle: "নতুন বাংলাদেশের স্বপ্ন", order: 4, content: read("islamic-economics-03-vision.md") },
      { id: "part4_zakat", title: "পর্ব ৪ — যাকাত সিস্টেম", subtitle: "দারিদ্র্যমুক্তির রোডম্যাপ", order: 5, content: read("islamic-economics-04-zakat-system.md") },
      { id: "part5_business", title: "পর্ব ৫ — ব্যবসা ও প্রযুক্তি", subtitle: "ইসলামী ব্যবসার নীতি", order: 6, content: read("islamic-economics-05-business-ethics-tech.md") },
      { id: "part6_complete", title: "পর্ব ৬ — পূর্ণাঙ্গ সিস্টেম", subtitle: "সম্পূর্ণ ইসলামী অর্থনীতি", order: 7, content: read("islamic-economics-06-complete-system.md") },
    ],
  },

  psychology: {
    id: "psychology",
    icon: "🧠",
    name: "মনোবিজ্ঞান",
    order: 3,
    featuredAyah: {
      arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
      bangla: "জেনে রাখো, আল্লাহর স্মরণেই হৃদয় শান্ত হয়।",
      ref: "সূরা রাদ ১৩:২৮",
    },
    articles: [
      { id: "part1_mental_health", title: "পর্ব ১ — মানসিক স্বাস্থ্য", subtitle: "উদ্বেগ ও বিষণ্নতার সমাধান", order: 1, content: read("research-psychology-01-mental-health.md") },
      { id: "part2_nafs", title: "পর্ব ২ — নফস", subtitle: "আপনি আসলে কে?", order: 2, content: read("research-psychology-02-nafs.md") },
      { id: "part3_forgiveness", title: "পর্ব ৩ — ক্ষমা", subtitle: "মনের মুক্তির পথ", order: 3, content: read("research-psychology-03-forgiveness.md") },
    ],
  },

  politics: {
    id: "politics",
    icon: "⚖️",
    name: "রাজনীতি",
    order: 4,
    featuredAyah: {
      arabic: "وَأَمْرُهُمْ شُورَىٰ بَيْنَهُمْ",
      bangla: "তাদের কার্যাবলী পরস্পর পরামর্শের মাধ্যমে পরিচালিত হয়।",
      ref: "সূরা শূরা ৪২:৩৮",
    },
    articles: [
      { id: "overview", title: "খিলাফত — ওভারভিউ", subtitle: "ইসলামী শাসনব্যবস্থা", order: 1, content: read("research-politics-khilafah.md") },
      { id: "part2_election", title: "পর্ব ২ — খলিফা নির্বাচন", subtitle: "যোগ্যতা ও মজলিসে শুরা", order: 2, content: read("research-politics-02-khalifa-election.md") },
      { id: "part3_ministries", title: "পর্ব ৩ — মন্ত্রণালয়", subtitle: "সরকার কাঠামো", order: 3, content: read("research-politics-03-ministries.md") },
      { id: "part4_economy", title: "পর্ব ৪ — অর্থনৈতিক শাসন", subtitle: "বায়তুলমাল থেকে বাজেট", order: 4, content: read("research-politics-04-economy.md") },
      { id: "part5_foreign", title: "পর্ব ৫ — পররাষ্ট্রনীতি", subtitle: "ইসলামী কূটনীতি", order: 5, content: read("research-politics-05-foreign-policy.md") },
      { id: "part6_women", title: "পর্ব ৬ — নারী ও সংখ্যালঘু", subtitle: "খিলাফতে তাদের অধিকার", order: 6, content: read("research-politics-06-women-minorities.md") },
      { id: "part7_western", title: "পর্ব ৭ — পশ্চিমের বাধা", subtitle: "ষড়যন্ত্র মোকাবেলা", order: 7, content: read("research-politics-07-western-resistance.md") },
      { id: "part8_rasul", title: "পর্ব ৮ — রাসূল ২০২৬ এ", subtitle: "আধুনিক যুগে নবীজি", order: 8, content: read("research-politics-08-rasul-2026.md") },
      { id: "part10_world", title: "পর্ব ১০ — বিশ্ব খিলাফত", subtitle: "সম্ভব কিনা, কীভাবে?", order: 9, content: read("research-politics-10-world-khilafah.md") },
      { id: "part11_nonmuslims", title: "পর্ব ১১ — বিধর্মীদের অধিকার", subtitle: "শুধু মুসলিমদের জন্য নয়", order: 10, content: read("research-politics-11-non-muslims.md") },
    ],
  },

  sociology: {
    id: "sociology",
    icon: "👥",
    name: "সমাজবিজ্ঞান",
    order: 5,
    featuredAyah: {
      arabic: "يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُم مِّن ذَكَرٍ وَأُنثَىٰ",
      bangla: "হে মানুষ! আমি তোমাদের পুরুষ ও নারী থেকে সৃষ্টি করেছি এবং বিভিন্ন জাতি ও গোত্রে বিভক্ত করেছি।",
      ref: "সূরা হুজুরাত ৪৯:১৩",
    },
    articles: [
      { id: "part1_family", title: "পর্ব ১ — পরিবার", subtitle: "সমাজের মূল ভিত্তি", order: 1, content: read("research-sociology-01-family.md") },
      { id: "part2_justice", title: "পর্ব ২ — ন্যায়বিচার", subtitle: "ইসলামে সামাজিক সমতা", order: 2, content: read("research-sociology-02-justice.md") },
      { id: "part3_women", title: "পর্ব ৩ — নারীর অধিকার", subtitle: "ইসলামের দৃষ্টিভঙ্গি", order: 3, content: read("research-sociology-03-women.md") },
      { id: "part4_hudud", title: "পর্ব ৪ — হুদুদ", subtitle: "কঠোর শাস্তি কেন?", order: 4, content: read("research-sociology-04-hudud.md") },
      { id: "part5_coexistence", title: "পর্ব ৫ — সহাবস্থান", subtitle: "ভিন্নতার মধ্যে ঐক্য", order: 5, content: read("research-sociology-05-coexistence.md") },
      { id: "part6_social_diseases", title: "পর্ব ৬ — সামাজিক রোগ", subtitle: "মাদক, দুর্নীতি, পর্নোগ্রাফি", order: 6, content: read("research-sociology-06-social-diseases.md") },
    ],
  },

  philosophy: {
    id: "philosophy",
    icon: "🌌",
    name: "দর্শন",
    order: 6,
    featuredAyah: {
      arabic: "أَمْ خُلِقُوا مِنْ غَيْرِ شَيْءٍ أَمْ هُمُ الْخَالِقُونَ",
      bangla: "তারা কি কোনো কিছু ছাড়াই সৃষ্টি হয়েছে, নাকি তারা নিজেরাই স্রষ্টা?",
      ref: "সূরা তূর ৫২:৩৫",
    },
    articles: [
      { id: "overview", title: "দর্শন — ওভারভিউ", subtitle: "জীবনের বড় প্রশ্নগুলো", order: 1, content: read("research-philosophy.md") },
      { id: "part2_tawhid", title: "পর্ব ২ — তাওহীদ", subtitle: "একত্ববাদের দর্শন", order: 2, content: read("research-philosophy-02-tawhid.md") },
      { id: "part3_epistemology", title: "পর্ব ৩ — জ্ঞানতত্ত্ব", subtitle: "আমরা কীভাবে জানি?", order: 3, content: read("research-philosophy-03-epistemology.md") },
      { id: "part4_ethics", title: "পর্ব ৪ — নৈতিকতা", subtitle: "ভালো ও মন্দ কে নির্ধারণ করে?", order: 4, content: read("research-philosophy-04-ethics.md") },
    ],
  },
};

async function upload() {
  console.log("🚀 FURQAN — Content Firebase এ upload শুরু...\n");

  for (const [catId, category] of Object.entries(content)) {
    const { articles, ...categoryMeta } = category;

    // Upload category metadata
    await setDoc(doc(db, "research", catId), {
      ...categoryMeta,
      articleCount: articles.length,
      updatedAt: new Date().toISOString(),
    });

    // Upload each article
    for (const article of articles) {
      await setDoc(doc(db, "research", catId, "articles", article.id), {
        ...article,
        categoryId: catId,
        updatedAt: new Date().toISOString(),
      });
    }

    console.log(`✅ ${category.icon} ${category.name} — ${articles.length}টি article uploaded`);
  }

  const total = Object.values(content).reduce((sum, cat) => sum + cat.articles.length, 0);
  console.log(`\n🎉 সম্পন্ন! মোট ${total}টি article Firebase এ আপলোড হয়েছে।`);
  console.log("📱 এখন FURQAN app এ সব content দেখা যাবে।");
  process.exit(0);
}

upload().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
