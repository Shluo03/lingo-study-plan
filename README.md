# 🌍 Lingo AI Study Plan Generator

A subset of the AI-powered language learning platform that generates personalized 2-week study plans using OpenAI GPT-4 and Firebase.

## 🚀 Features

- **AI-Powered Study Plans**: Generate customized 2-week study plans based on language, proficiency level, and learning goals
- **Multiple Languages**: Support for Spanish, French, German, Italian, Portuguese, Japanese, Chinese, Korean, Arabic, and Russian
- **Personalized Learning**: Tailored daily tasks and cultural tips based on user's goals (Travel, Business, Culture, etc.)
- **Cloud Storage**: Automatically saves generated study plans to Firebase Firestore
- **RESTful API**: HTTP endpoint for easy integration with any frontend framework

## 🛠️ Tech Stack

- **Backend**: Firebase Functions (Node.js 18)
- **AI**: OpenAI GPT-4o API
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (ready for implementation)
- **Deployment**: Firebase Hosting

## 📁 Project Structure

```
lingo-study-plan/
├── functions/
│   ├── index.js           # Main cloud function
│   ├── package.json       # Dependencies
│   ├── .eslintrc.js       # Linting configuration
│   └── .env               # Environment variables (OpenAI API key)
├── firebase.json          # Firebase configuration
├── .firebaserc           # Firebase project settings
├── test-frontend.html    # Test page for API validation
└── README.md            # Project documentation
```

## 🔧 Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- Firebase CLI (`npm install -g firebase-tools`)
- OpenAI API key with billing enabled
- Firebase project on Blaze (pay-as-you-go) plan

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shluo03/lingo-study-plan.git
   cd lingo-study-plan
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions
   npm install
   ```

3. **Configure environment variables**
   
   Create `.env` file in the `functions` directory:
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. **Set up Firebase**
   ```bash
   firebase login
   firebase use --add
   # Select your Firebase project
   ```

5. **Deploy to Firebase**
   ```bash
   firebase deploy --only functions
   ```

## 📡 API Documentation

### Generate Study Plan

**Endpoint**: `POST https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/generateStudyPlan`

**Headers**:
```json
{
  "Content-Type": "application/json"
}
```

**Request Body**:
```json
{
  "language": "Spanish",
  "level": "Beginner",
  "goals": ["Travel", "Order food"],
  "userId": "user123"
}
```

**Response**:
```json
{
  "plan": "Week 1:\nDay 1: Basic Greetings...\n[Full 2-week study plan]"
}
```

**Supported Languages**:
- Spanish, French, German, Italian, Portuguese
- Japanese, Chinese (Mandarin), Korean
- Arabic, Russian

**Proficiency Levels**:
- Beginner
- Elementary
- Intermediate
- Upper-Intermediate
- Advanced

**Learning Goals**:
- Travel
- Business
- Culture
- Order food
- Daily conversation
- Pass exam

## 🧪 Testing

### Test with cURL
```bash
curl -X POST https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/generateStudyPlan \
  -H "Content-Type: application/json" \
  -d '{
    "language": "Spanish",
    "level": "Beginner",
    "goals": ["Travel", "Order food"],
    "userId": "test123"
  }'
```

### Test with Frontend
Open `test-frontend.html` in your browser to test the API integration with a simple UI.

## 🔐 Security

- API keys are stored in environment variables, ask owner for them
- CORS is configured for frontend access
- `.gitignore` includes sensitive files
- Firebase security rules should be configured for production

## 📊 Database Schema

### Firestore Collection: `studyPlans`

```javascript
{
  userId: "user123",
  language: "Spanish",
  level: "Beginner",
  goals: ["Travel", "Order food"],
  studyPlan: "Full study plan text...",
  createdAt: Timestamp
}
```

## 🚦 Development

### Run locally
```bash
firebase emulators:start --only functions
```

### Check logs
```bash
firebase functions:log
```

### Lint code
```bash
cd functions
npm run lint
```

## 📈 Monitoring

- **Firebase Console**: Monitor function invocations and errors
- **OpenAI Dashboard**: Track API usage and costs
- **Firestore Console**: View stored study plans

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.
