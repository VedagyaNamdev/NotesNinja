import { NextResponse } from 'next/server';

// Get API key from environment variables
const apiKey = process.env.GEMINI_API_KEY || '';

// Try a more specific API endpoint and model
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent';

export async function GET() {
  try {
    // Log the censored API key for debugging (only showing the first 4 chars)
    const censoredKey = apiKey ? 
      `${apiKey.substring(0, 4)}${'*'.repeat(Math.max(0, apiKey.length - 4))}` : 
      'MISSING KEY';
    
    console.log(`Using Gemini API key: ${censoredKey}`);
    
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'API key is not set or using placeholder value' 
        },
        { status: 401 }
      );
    }
    
    // Simple test prompt
    const testPrompt = "Hello, this is a test request. Please respond with a short greeting.";
    
    // Log the full URL we're calling (with redacted API key)
    console.log(`Calling API: ${GEMINI_API_ENDPOINT}?key=REDACTED`);
    
    // Call Gemini API directly
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: testPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256,
        }
      }),
    });
    
    // Log response status
    console.log(`API Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API test error response:', errorData);
      
      // Return the complete error object for debugging
      return NextResponse.json(
        { 
          success: false, 
          error: `API error: ${errorData.error?.message || 'Unknown error'}`,
          rawError: errorData
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('API response data structure:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Extract the generated text from the response
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      
      const generatedText = data.candidates[0].content.parts[0].text;
      
      return NextResponse.json({ 
        success: true, 
        testResponse: generatedText
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid response format from Gemini API',
          rawResponse: data
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Gemini API check failed:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
} 