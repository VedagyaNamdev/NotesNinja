import { NextResponse } from 'next/server';

export async function GET() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Gemini API Test</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    .button {
      background-color: #0070f3;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      cursor: pointer;
    }
    .button:hover {
      background-color: #0051cc;
    }
    .result {
      margin-top: 1rem;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 0.25rem;
      white-space: pre-wrap;
    }
    .error {
      color: red;
    }
  </style>
</head>
<body>
  <h1>Gemini API Test</h1>
  <button id="testButton" class="button">Test API Connection</button>
  <div id="result" class="result">Click the button to test the API</div>
  
  <script>
    document.getElementById('testButton').addEventListener('click', async () => {
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = 'Testing API connection...';
      resultDiv.className = 'result';
      
      try {
        const response = await fetch('/api/gemini/check');
        const data = await response.json();
        
        if (data.success) {
          resultDiv.innerHTML = 'API connection successful! Response: ' + data.testResponse;
        } else {
          resultDiv.innerHTML = 'API connection failed: ' + data.error;
          resultDiv.className = 'result error';
        }
      } catch (error) {
        resultDiv.innerHTML = 'Error testing API: ' + error.message;
        resultDiv.className = 'result error';
      }
    });
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
} 