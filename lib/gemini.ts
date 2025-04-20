import { GoogleGenerativeAI } from '@google/generative-ai';

// Use client-side API key if available (browser environment), otherwise use server-side
const apiKey = typeof window !== 'undefined' 
  ? process.env.NEXT_PUBLIC_GEMINI_API_KEY 
  : process.env.GEMINI_API_KEY;

// Initialize the Gemini API with the API key
const genAI = new GoogleGenerativeAI(apiKey || '');

// Use a working model based on the diagnostic results
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Types of content that can be generated from notes
 */
export type ContentType = 'summary' | 'bullets' | 'flashcards' | 'quiz' | 'keyTerms';

/**
 * Alternative implementation that uses direct fetch API calls instead of the library
 * when the library version has issues
 */
export async function generateContentWithFetch(text: string, type: ContentType): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  // Generate prompt based on content type
  let prompt = '';
  
  switch (type) {
    case 'summary':
      prompt = `Please provide a comprehensive summary of the following text, capturing the main ideas and important details. Make sure the summary is clear, concise, and well-structured.\n\nText: ${text}`;
      break;
    case 'bullets':
      prompt = `Extract the key points from the following text and present them as bullet points. Each point should be clear and concise, capturing an important concept or fact.\n\nText: ${text}`;
      break;
    case 'flashcards':
      prompt = `Create a set of flashcards based on the following text. Each flashcard should have a question on one side and the answer on the other. Format as "Q: [question]\nA: [answer]" for each card. Focus on important concepts, definitions, and facts.\n\nText: ${text}`;
      break;
    case 'quiz':
      prompt = `Create a quiz with multiple-choice questions based on the following text. For each question, provide 4 options (A, B, C, D) with one correct answer. Format as "Q: [question]\nA: [option]\nB: [option]\nC: [option]\nD: [option]\nCorrect: [letter]" for each question.\n\nText: ${text}`;
      break;
    case 'keyTerms':
      prompt = `Extract all key terms, formulas, and concepts from the following text. For each term, provide a brief definition or explanation. Format the terms in a clear, organized manner.\n\nText: ${text}`;
      break;
    default:
      throw new Error(`Unsupported content type: ${type}`);
  }
  
  // Direct fetch to the API endpoint
  try {
    // Make a request to our own API endpoint instead
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, type }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate content');
    }
    
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
}

/**
 * Generates AI content from the provided notes text
 * @param text - The text to generate content from
 * @param type - The type of content to generate
 * @returns A promise that resolves to the generated content
 */
export async function generateContent(text: string, type: ContentType): Promise<string> {
  try {
    let prompt = '';
    
    switch (type) {
      case 'summary':
        prompt = `Please provide a comprehensive summary of the following text, capturing the main ideas and important details. Make sure the summary is clear, concise, and well-structured.\n\nText: ${text}`;
        break;
      case 'bullets':
        prompt = `Extract the key points from the following text and present them as bullet points. Each point should be clear and concise, capturing an important concept or fact.\n\nText: ${text}`;
        break;
      case 'flashcards':
        prompt = `Create a set of flashcards based on the following text. Each flashcard should have a question on one side and the answer on the other. Format as "Q: [question]\nA: [answer]" for each card. Focus on important concepts, definitions, and facts.\n\nText: ${text}`;
        break;
      case 'quiz':
        prompt = `Create a quiz with multiple-choice questions based on the following text. For each question, provide 4 options (A, B, C, D) with one correct answer. Format as "Q: [question]\nA: [option]\nB: [option]\nC: [option]\nD: [option]\nCorrect: [letter]" for each question.\n\nText: ${text}`;
        break;
      case 'keyTerms':
        prompt = `Extract all key terms, formulas, and concepts from the following text. For each term, provide a brief definition or explanation. Format the terms in a clear, organized manner.\n\nText: ${text}`;
        break;
      default:
        throw new Error(`Unsupported content type: ${type}`);
    }
    
    // Try with the library first
    try {
      // Generate content with Gemini
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();
      
      return generatedText;
    } catch (libraryError) {
      console.error('Gemini library error, trying alternative approach:', libraryError);
      
      // Fall back to using our API route
      return await generateContentWithFetch(text, type);
    }
  } catch (error) {
    console.error('Gemini AI error:', error);
    throw new Error(`Failed to generate ${type} content`);
  }
} 