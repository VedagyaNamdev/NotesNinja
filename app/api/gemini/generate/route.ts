import { NextRequest, NextResponse } from 'next/server';

// Get API key from environment variables
const apiKey = process.env.GEMINI_API_KEY || '';

// Use the working model from the diagnostic results (gemini-2.0-flash)
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Fallback endpoints in case the primary one fails
const FALLBACK_ENDPOINTS = [
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp:generateContent',
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent'
];

// Define content type for better type safety
type ContentType = 'bullets' | 'summary' | 'keyTerms' | 'flashcards' | 'quiz';

// Interface for quiz options
interface QuizOptions {
  difficulty?: 'easy' | 'medium' | 'hard';
  numQuestions?: number;
}

// Mock responses for when the API fails
const MOCK_RESPONSES: Record<ContentType, string> = {
  bullets: `- AI technology continues to advance rapidly in various domains
- Large language models like GPT and Gemini can process and generate human-like text
- Machine learning algorithms improve with more training data
- Natural language processing enables computers to understand human communication
- Computer vision systems can now recognize objects and scenes with high accuracy
- Reinforcement learning helps AI learn through trial and error
- Ethical considerations are becoming increasingly important in AI development`,

  summary: `The document discusses various aspects of artificial intelligence and its applications in modern technology. It explores how machine learning algorithms have evolved over time and their impact on different industries including healthcare, finance, and transportation. The text highlights both the benefits of AI adoption, such as increased efficiency and new capabilities, as well as potential concerns around privacy, security, and ethical implementation. Several case studies are presented demonstrating successful AI integration in real-world scenarios, along with frameworks for responsible AI development and deployment.`,

  keyTerms: `Term: Artificial Intelligence
Definition: The simulation of human intelligence processes by machines, especially computer systems.

Term: Machine Learning
Definition: A subset of AI focused on algorithms that improve automatically through experience.

Term: Neural Networks
Definition: Computing systems inspired by biological neural networks that form the basis for deep learning.

Term: Deep Learning
Definition: A subset of machine learning using multiple layers of neural networks to process complex data.

Term: Natural Language Processing
Definition: AI technology that enables computers to understand and generate human language.

Formulas:
Sigmoid Activation Function: f(x) = 1 / (1 + e^(-x))
Cost Function: J(θ) = -1/m * Σ[y*log(h(x)) + (1-y)*log(1-h(x))]
Backpropagation: ∂E/∂w = ∂E/∂o * ∂o/∂n * ∂n/∂w`,

  flashcards: `Q: What is Artificial Intelligence?
A: The simulation of human intelligence processes by machines, especially computer systems.

Q: What is Machine Learning?
A: A subset of AI focused on algorithms that improve automatically through experience.

Q: What are Neural Networks?
A: Computing systems inspired by biological neural networks that form the basis for deep learning.

Q: What is Deep Learning?
A: A subset of machine learning using multiple layers of neural networks to process complex data.

Q: What is Natural Language Processing?
A: AI technology that enables computers to understand and generate human language.

Q: What is a Sigmoid Activation Function?
A: A mathematical function defined as f(x) = 1 / (1 + e^(-x)) commonly used in neural networks.

Q: What is Supervised Learning?
A: A type of machine learning where the algorithm is trained on labeled data.`,

  quiz: `Q: Which of the following is NOT a subset of AI?
A: Machine Learning
B: Deep Learning
C: Quantum Computing
D: Natural Language Processing
Correct: C

Q: What is the main characteristic of machine learning algorithms?
A: They require human supervision at all times
B: They improve automatically through experience
C: They only work with numerical data
D: They cannot process unstructured data
Correct: B

Q: Which activation function outputs values between 0 and 1?
A: ReLU
B: Tanh
C: Sigmoid
D: Linear
Correct: C

Q: What does NLP stand for in AI?
A: Natural Language Programming
B: Neural Learning Process
C: New Learning Paradigm
D: Natural Language Processing
Correct: D

Q: Which of these is a common application of computer vision?
A: Text translation
B: Object recognition
C: Speech synthesis
D: Financial forecasting
Correct: B`
};

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const requestData = await request.json();
    const { text, type, quizOptions } = requestData;
    
    // Validate request body
    if (!text || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters: text and type' },
        { status: 400 }
      );
    }
    
    // Check if the type is valid
    const contentType = type as string;
    const isValidType = (t: string): t is ContentType => 
      ['bullets', 'summary', 'keyTerms', 'flashcards', 'quiz'].includes(t);
    
    // Check if API key is configured
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      console.warn('API key not set, using mock response');
      
      // Return mock data if available for this type
      if (isValidType(contentType) && contentType in MOCK_RESPONSES) {
        return NextResponse.json({ 
          content: MOCK_RESPONSES[contentType],
          isMock: true 
        });
      }
      
      return NextResponse.json(
        { error: 'Gemini API key is not configured properly or invalid content type' },
        { status: 500 }
      );
    }
    
    // Extract quiz options if provided
    const options: QuizOptions = quizOptions || {};
    const difficulty = options.difficulty || 'medium';
    const numQuestions = options.numQuestions || 5;
    
    // Generate prompt based on content type
    let prompt = '';
    
    switch (type) {
      case "bullets":
        prompt = `${text}\n\nCreate bullet point notes from the above text.`;
        break;
      case "summary":
        prompt = `${text}\n\nWrite a comprehensive summary of the above text.`;
        break;
      case "keyTerms":
        prompt = `${text}\n\nExtract the key terms and definitions from the text above. For each key term, provide a definition. Format the result as follows:

Term: [term name]
Definition: [definition]

Term: [term name]
Definition: [definition]

And so on. Make sure each term and definition appears only once and follows the exact format shown above. Do not repeat the words "Term:" or "Definition:" multiple times in succession.`;
        break;
      case "flashcards":
        prompt = `${text}\n\nCreate flashcards based on the text above. Format each flashcard EXACTLY as follows:

Q: [question text]
A: [answer text]

Q: [question text]
A: [answer text]

Make sure each flashcard follows this exact format with 'Q:' at the start of the question line and 'A:' at the start of the answer line, and have one blank line between flashcards.`;
        break;
      case "quiz":
        prompt = `${text}\n\nCreate a ${difficulty} difficulty quiz with exactly ${numQuestions} multiple choice questions based on the text above. 

For ${difficulty} difficulty:
${difficulty === 'easy' ? '- Include straightforward questions that test basic understanding and recall.' : 
  difficulty === 'medium' ? '- Include questions that require some analysis and deeper understanding.' : 
  '- Include challenging questions that require critical thinking and advanced understanding.'}

Format each question exactly as follows:

Q: [question text]
A: [option A]
B: [option B]
C: [option C]
D: [option D]
Correct: [correct letter]

Make sure each question follows this exact format, with each option on a new line. Use only A, B, C, or D as the correct answer. Make sure there are no extra blank lines between questions, options, or answers. Each question should test understanding of important concepts from the text.`;
        break;
      default:
        prompt = `${text}\n\nSummarize the key points from the above text.`;
    }
    
    // Try each endpoint until one works
    let lastError = null;
    
    // Start with the primary endpoint
    let endpoints = [GEMINI_API_ENDPOINT, ...FALLBACK_ENDPOINTS];
    
    for (const endpoint of endpoints) {
      try {
        const requestBody = {
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: type === 'quiz' ? 0.7 : 0.4,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 4096
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        };
        
        const response = await fetch(`${endpoint}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Error from ${endpoint}:`, errorData);
          lastError = errorData;
          continue; // Try the next endpoint
        }
        
        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
          console.error(`No content in response from ${endpoint}:`, data);
          lastError = { error: 'No content in response' };
          continue; // Try the next endpoint
        }
        
        // Extract the generated text
        const generatedContent = data.candidates[0].content.parts[0].text;
        
        // Return the generated content
        return NextResponse.json({ content: generatedContent });
      } catch (error) {
        console.error(`Error with ${endpoint}:`, error);
        lastError = error;
        // Continue to the next endpoint
      }
    }
    
    // If we've tried all endpoints and none worked
    console.error('All API endpoints failed:', lastError);
    return NextResponse.json(
      { error: 'Failed to generate content', details: lastError },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error in generate route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 