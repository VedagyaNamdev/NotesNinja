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
    const { text, type } = requestData;
    
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
    
    // Generate prompt based on content type
    let prompt = '';
    
    switch (contentType) {
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
        prompt = `Extract all key terms, formulas, and concepts from the following text. For each term, provide a brief definition or explanation. 

Format your response EXACTLY like this:
Term: Artificial Intelligence
Definition: The simulation of human intelligence processes by machines, especially computer systems.

Term: Machine Learning
Definition: A subset of AI focused on algorithms that improve automatically through experience.

Do not repeat "Term:" and "Definition:" multiple times in a row. Each pair should have exactly one Term: line followed by exactly one Definition: line.

If there are any formulas in the text, list them separately in a section called "Formulas:" after all the terms.

Text: ${text}`;
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported content type: ${type}` },
          { status: 400 }
        );
    }
    
    // Try each endpoint until one works
    let lastError = null;
    const endpointsToTry = [GEMINI_API_ENDPOINT, ...FALLBACK_ENDPOINTS];
    
    for (const endpoint of endpointsToTry) {
      try {
        // Log which endpoint we're trying
        console.log(`Trying Gemini API endpoint: ${endpoint}`);
        
        // Call Gemini API directly
        const response = await fetch(`${endpoint}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            }
          }),
        });
        
        // Log response status
        console.log(`API response status for ${endpoint}: ${response.status}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Error with endpoint ${endpoint}:`, errorData);
          lastError = errorData;
          // Continue to the next endpoint
          continue;
        }
        
        const data = await response.json();
        
        // Extract the generated text from the response
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
          
          const generatedText = data.candidates[0].content.parts[0].text;
          console.log(`Successfully generated ${contentType} content using endpoint ${endpoint}`);
          
          return NextResponse.json({ content: generatedText });
        } else {
          // Invalid response format, try the next endpoint
          console.error(`Invalid response format from ${endpoint}:`, data);
          lastError = { error: 'Invalid response format' };
          continue;
        }
      } catch (endpointError) {
        console.error(`Error with ${endpoint}:`, endpointError);
        lastError = endpointError;
        // Continue to the next endpoint
        continue;
      }
    }
    
    // If we get here, all endpoints failed
    console.error('All Gemini API endpoints failed - using mock data fallback');
    
    // Return mock data if available for this type
    if (isValidType(contentType) && contentType in MOCK_RESPONSES) {
      return NextResponse.json({ 
        content: MOCK_RESPONSES[contentType],
        isMock: true 
      });
    }
    
    return NextResponse.json(
      { 
        error: lastError?.error?.message || 'All API endpoints failed',
        details: 'Could not generate content using any available API endpoint. Please try again later.'
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 