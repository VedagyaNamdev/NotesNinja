import { NextResponse } from 'next/server';

// List of API endpoints we can test
const endpoints = [
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp:generateContent',
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent'
];

export async function GET() {
  try {
    // Get API key
    const apiKey = process.env.GEMINI_API_KEY || '';
    
    // Simple test prompt
    const testPrompt = "Hello, just say hi.";
    
    // Test results
    const results = [];
    
    // Test each endpoint
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`);
        
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
        
        const status = response.status;
        let data = null;
        let error = null;
        
        try {
          data = await response.json();
        } catch (e) {
          error = 'Failed to parse JSON response';
        }
        
        results.push({
          endpoint,
          status,
          success: response.ok,
          data: data ? (response.ok ? 'Response OK' : data) : null,
          error: error
        });
      } catch (endpointError) {
        results.push({
          endpoint,
          status: 'Error',
          success: false,
          data: null,
          error: endpointError instanceof Error ? endpointError.message : 'Unknown error'
        });
      }
    }
    
    // Test environment variables
    const envCheck = {
      apiKeySet: !!apiKey,
      apiKeyLength: apiKey.length,
      apiKeyFirstFourChars: apiKey.substring(0, 4),
      nodeEnv: process.env.NODE_ENV,
    };
    
    return NextResponse.json({
      diagnostics: {
        environment: envCheck,
        endpoints: results
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 