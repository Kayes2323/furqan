<div align="center">

# 📖 FURQAN

**কুরআন পড়ো না, বোঝো** — understand the Quran, in Bangla.

[**Open the app →**](https://furqan-tan.vercel.app)

</div>

Furqan helps Bengali-speaking readers move from *reading* the Quran to *understanding* it. It brings together tafsir, guided research articles, the life of the Prophet ﷺ, and an AI companion called **NUR**.

## ✨ Features

| | Feature | What it does |
|---|---|---|
| 📚 | **Tafsir** | Browse surah by surah with Bangla explanation. |
| 💬 | **NUR** | Ask questions in Bangla and get answers grounded in the Quran and Hadith (AI, powered by Gemini). |
| 🔬 | **Research** | Long-form Bangla articles on themes such as science, economics, psychology and society. |
| 🕌 | **Sirah journey** | Read the life of the Prophet ﷺ part by part, chapter by chapter. |
| 🔖 | **Bookmarks and profile** | Save what matters and pick up where you left off. |
| 📱 | **Installable** | Mobile-first, works as a PWA, with light and dark themes. |

## 🛠️ Tech stack

- **Next.js** (App Router) + **TypeScript**
- **Firebase** for data
- **Google Gemini** for NUR, called from a server route so the API key never reaches the browser
- **Tailwind CSS**
- Deployed on **Vercel**

## 🚀 Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

NUR needs a `GEMINI_API_KEY` environment variable on the server. Put it in `.env.local` locally and in your Vercel project settings for production. Never commit it.

## 👤 Author

Built by **[Abdul Aziz Kayes](https://github.com/Kayes2323)**.
