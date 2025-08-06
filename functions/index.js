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
    const {
      language = "Spanish",
      level = "Beginner",
      goals = ["General learning"],
      userId = "anonymous",
    } = req.body;

    if (!language || !level || !goals || !Array.isArray(goals)) {
      return res.status(400).send({
        error: "Invalid request data. Please ensure all fields are provided.",
      });
    }

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

    // Parse the study plan text into structured format
    const weeks = [];
    for (let i = 1; i <= 2; i++) {
      const week = {
        weekNumber: i,
        theme: `Week ${i}: ${language} Learning`,
        days: [],
      };

      for (let j = 1; j <= 7; j++) {
        week.days.push({
          dayNumber: j,
          date: new Date(Date.now() + ((i - 1) * 7 + j - 1) * 86400000).toISOString(),
          tasks: [
            {
              id: `task-${i}-${j}-1`,
              title: "Vocabulary Practice",
              description: "Learn 10 new words",
              duration: 15,
              completed: false,
              category: "vocabulary",
            },
            {
              id: `task-${i}-${j}-2`,
              title: "Grammar Exercise",
              description: "Practice sentence structures",
              duration: 15,
              completed: false,
              category: "grammar",
            },
          ],
        });
      }
      weeks.push(week);
    }

    const planObject = {
      id: Date.now().toString(),
      language: {name: language, nativeName: language},
      level: level,
      goals: goals.map((g) => ({title: g, category: "General"})),
      duration: 2,
      timeCommitment: 30,
      weeks: weeks,
      resources: {
        apps: ["Duolingo", "Babbel"],
        websites: ["BBC Languages", "FluentU"],
        books: ["Language Learning Guide"],
        videos: ["YouTube Language Channels"],
      },
      tips: [
        "Practice daily for consistency",
        "Focus on speaking from day one",
        "Immerse yourself in the language",
        "Use spaced repetition for vocabulary",
        "Find a language partner",
      ],
      culturalNotes: [
        "Learn about cultural customs",
        "Watch movies in the target language",
        "Try authentic cuisine",
      ],
      aiGeneratedContent: studyPlan,
      createdAt: new Date().toISOString(),
    };

    res.status(200).send({
      success: true,
      plan: planObject,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({error: "Failed to generate study plan."});
  }
});

exports.chat = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const {
      message,
      conversationId,
      userId,
      language,
      coachingStyle = "encouraging",
      includeCorrections = true,
    } = req.body;

    if (!message || !userId || !language) {
      return res.status(400).send({
        error: "Missing required fields: message, userId, language",
      });
    }

    const conversationRef = conversationId ?
      db.collection("conversations").doc(conversationId) :
      db.collection("conversations").doc();

    const conversation = await conversationRef.get();
    let conversationData = {};

    if (!conversation.exists) {
      conversationData = {
        userId,
        language,
        coachingStyle,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        messageCount: 0,
      };
      await conversationRef.set(conversationData);
    } else {
      conversationData = conversation.data();
    }

    const recentMessages = await db
      .collection("messages")
      .where("conversationId", "==", conversationRef.id)
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    const contextMessages = [];
    recentMessages.docs.reverse().forEach((doc) => {
      const msgData = doc.data();
      contextMessages.push({
        role: msgData.type === "user" ? "user" : "assistant",
        content: msgData.content,
      });
    });

    const systemPrompts = {
      conversational: `You are a friendly ${language} conversation partner. ` +
        "Keep the conversation flowing naturally. Only correct major errors " +
        "that impede understanding. Focus on engaging topics and ask " +
        `follow-up questions. Respond naturally in ${language}.`,
      corrective: `You are a detailed ${language} tutor. Provide corrections ` +
        "for grammar, vocabulary, and syntax errors. Explain the rules behind " +
        "corrections. Always be constructive and educational. Respond in " +
        `${language} but provide explanations in English when correcting.`,
      encouraging: `You are a supportive ${language} tutor. Celebrate the ` +
        "user's progress and effort. Provide gentle corrections with positive " +
        `framing. Focus on building confidence. Respond in ${language} with ` +
        "encouraging tone.",
    };

    const messages = [
      {
        role: "system",
        content:
          systemPrompts[coachingStyle] || systemPrompts.encouraging,
      },
      ...contextMessages,
      {role: "user", content: message},
    ];

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply = gptResponse.choices[0].message.content;

    const messageId = db.collection("messages").doc().id;
    const assistantMessageId = db.collection("messages").doc().id;

    await db.collection("messages").doc(messageId).set({
      conversationId: conversationRef.id,
      userId,
      content: message,
      type: "user",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      language,
    });

    await db.collection("messages").doc(assistantMessageId).set({
      conversationId: conversationRef.id,
      userId,
      content: reply,
      type: "assistant",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      language,
      coachingStyle,
    });

    await conversationRef.update({
      messageCount: admin.firestore.FieldValue.increment(2),
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const response = {
      reply,
      conversationId: conversationRef.id,
      messageId: assistantMessageId,
      timestamp: new Date().toISOString(),
    };

    if (coachingStyle === "corrective" && includeCorrections) {
      const correctionPrompt = `Analyze this ${language} message for ` +
        `grammar, vocabulary, and syntax errors: "${message}". Return only ` +
        "a JSON array of corrections in this format: [{\"original\": \"text\", " +
        "\"corrected\": \"text\", \"type\": \"grammar/vocabulary/punctuation\", " +
        "\"explanation\": \"brief explanation\"}]. If no errors, return empty " +
        "array [].";

      const correctionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{role: "user", content: correctionPrompt}],
        max_tokens: 200,
        temperature: 0.1,
      });

      try {
        const corrections = JSON.parse(
          correctionResponse.choices[0].message.content,
        );
        response.corrections = corrections;
      } catch (e) {
        console.log("Could not parse corrections JSON");
        response.corrections = [];
      }
    }

    res.status(200).send(response);
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).send({
      error: "Failed to generate chat response.",
      details: error.message,
    });
  }
});
