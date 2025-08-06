const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {OpenAI} = require("openai");
require("dotenv").config();

admin.initializeApp();
const db = admin.firestore();

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

exports.generateStudyPlan = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  try {
    const {language, level, goals, userId} = req.body;

    const prompt = `
You are a language tutor. Your student is learning ${language}, at a ${level} level.
Their goals are: ${goals.join(", ")}.
Create a 2-week study plan with daily tasks and tips. Include 3 cultural tips.`;

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{role: "user", content: prompt}],
      max_tokens: 500,
    });

    const studyPlan = gptResponse.choices[0].message.content;

    await db.collection("studyPlans").add({
      userId,
      language,
      level,
      goals,
      studyPlan,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({plan: studyPlan});
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({error: "Failed to generate study plan."});
  }
});
