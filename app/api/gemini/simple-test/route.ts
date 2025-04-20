import { NextResponse } from 'next/server';

const API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function GET() {
  try {
    if (!API_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'API key not configured' 
      }, { status: 401 });
    }

    // Make a simple request to the Gemini API
    const response = await fetch(`${MODEL_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Say hello and confirm that the API is working correctly." }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ 
        success: false, 
        error: `API Error: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Extract the response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No text in response';
    
    return NextResponse.json({
      success: true,
      message: 'API is working!',
      response: responseText,
      modelUsed: 'gemini-2.0-flash'
    });
  } catch (error) {
    console.error('API test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 