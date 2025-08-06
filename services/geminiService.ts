
import { GoogleGenAI, Chat } from "@google/genai";

// IMPORTANT: Do NOT configure API Key here. It will be provided by the environment.
const API_KEY =  import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    // In a real app, you'd have a more robust way to handle this,
    // but for this context, we'll log an error.
    // The execution environment is expected to provide the API key.
    console.error("API_KEY environment variable not set. The app will not function.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const systemInstruction = `You are Zenith, a friendly, empathetic, and supportive AI companion for mental wellness. Your purpose is to provide a safe space for users to express their feelings, engage in gentle check-ins, and receive supportive guidance. You should be calming, patient, and understanding. You are NOT a therapist or a medical professional. You MUST NOT provide diagnoses, medical advice, or crisis intervention. If a user seems to be in crisis or expresses thoughts of self-harm, you must gently and immediately guide them to seek professional help by providing a resource like the National Suicide Prevention Lifeline number (988 in the US) or encouraging them to contact a local emergency service. Your responses should be conversational, encouraging, and focused on mindfulness, self-care, and positive coping strategies. Keep your responses concise and easy to understand. Start the first conversation by introducing yourself and asking how the user is feeling today.`;

// Create a single, persistent chat instance
const chat: Chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    systemInstruction,
    temperature: 0.8,
    topP: 0.9,
  },
});

export const sendMessageStream = async (message: string) => {
  if (!API_KEY) {
    // Simulate a response if the API key is not available.
    const stream = (async function* () {
      yield { text: "Hello! It seems my connection is not set up correctly. Please ensure the API key is configured by the developer." };
    })();
    return stream;
  }
  return chat.sendMessageStream({ message });
};
