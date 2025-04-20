import { NextResponse } from 'next/server';

const API_KEY = process.env.GEMINI_API_KEY || '';

// URL for the models API
const MODELS_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function GET() {
  try {
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 401 });
    }

    // Fetch list of models
    const response = await fetch(`${MODELS_API_URL}?key=${API_KEY}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching models:', errorData);
      return NextResponse.json({ error: errorData }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 