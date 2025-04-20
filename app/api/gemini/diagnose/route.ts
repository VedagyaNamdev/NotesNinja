import { NextResponse } from 'next/server';

const API_KEY = process.env.GEMINI_API_KEY || '';

export async function GET() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Gemini API Diagnostics</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.5;
    }
    h1, h2, h3 {
      color: #333;
    }
    button {
      background-color: #0070f3;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      cursor: pointer;
      margin-right: 8px;
      margin-bottom: 8px;
    }
    button:hover {
      background-color: #0051cc;
    }
    pre {
      background-color: #f1f1f1;
      padding: 1rem;
      border-radius: 0.25rem;
      overflow: auto;
      max-height: 400px;
    }
    .card {
      border: 1px solid #ddd;
      border-radius: 0.25rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .error {
      color: red;
    }
    .success {
      color: green;
    }
  </style>
</head>
<body>
  <h1>Gemini API Diagnostics</h1>
  
  <div class="card">
    <h2>1. API Key Check</h2>
    <div>
      <p>API Key Status: <span id="keyStatus">Checking...</span></p>
      <p>API Key: <span id="apiKeyInfo">Checking...</span></p>
    </div>
  </div>

  <div class="card">
    <h2>2. Available Models</h2>
    <button id="listModelsBtn">List Available Models</button>
    <pre id="modelsResult">Click the button to list models</pre>
  </div>

  <div class="card">
    <h2>3. Test API Endpoints</h2>
    <div>
      <button id="testEndpointsBtn">Test All Endpoints</button>
    </div>
    <pre id="endpointsResult">Click the button to test endpoints</pre>
  </div>

  <div class="card">
    <h2>4. Test Specific Model</h2>
    <div style="margin-bottom: 10px;">
      <select id="modelSelect" style="padding: 5px; min-width: 300px;">
        <option value="">Select a model</option>
      </select>
    </div>
    <button id="testModelBtn">Test Selected Model</button>
    <pre id="modelTestResult">Select a model and click the button to test</pre>
  </div>

  <script>
    // Check API key
    (async function() {
      try {
        const response = await fetch('/api/gemini/debug');
        const data = await response.json();
        
        if (data.diagnostics && data.diagnostics.environment) {
          const env = data.diagnostics.environment;
          
          if (env.apiKeySet) {
            document.getElementById('keyStatus').textContent = 'Set ✅';
            document.getElementById('keyStatus').className = 'success';
            document.getElementById('apiKeyInfo').textContent = 
              \`Length: \${env.apiKeyLength}, Starts with: \${env.apiKeyFirstFourChars}...\`;
          } else {
            document.getElementById('keyStatus').textContent = 'Not Set ❌';
            document.getElementById('keyStatus').className = 'error';
            document.getElementById('apiKeyInfo').textContent = 'API key is not configured';
          }
        }
      } catch (error) {
        document.getElementById('keyStatus').textContent = 'Error checking API key';
        document.getElementById('keyStatus').className = 'error';
      }
    })();

    // List models button
    document.getElementById('listModelsBtn').addEventListener('click', async () => {
      const resultEl = document.getElementById('modelsResult');
      resultEl.textContent = 'Loading...';
      
      try {
        const response = await fetch('/api/gemini/list-models');
        const data = await response.json();
        resultEl.textContent = JSON.stringify(data, null, 2);
        
        // Populate model select dropdown
        const selectEl = document.getElementById('modelSelect');
        // Clear existing options except the first one
        while (selectEl.options.length > 1) {
          selectEl.remove(1);
        }
        
        // Add models to dropdown
        if (data.models && Array.isArray(data.models)) {
          data.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.name;
            option.textContent = model.name.split('/').pop();
            selectEl.appendChild(option);
          });
        }
      } catch (error) {
        resultEl.textContent = 'Error: ' + error.message;
      }
    });

    // Test endpoints
    document.getElementById('testEndpointsBtn').addEventListener('click', async () => {
      const resultEl = document.getElementById('endpointsResult');
      resultEl.textContent = 'Testing endpoints...';
      
      try {
        const response = await fetch('/api/gemini/debug');
        const data = await response.json();
        resultEl.textContent = JSON.stringify(data.diagnostics.endpoints, null, 2);
      } catch (error) {
        resultEl.textContent = 'Error: ' + error.message;
      }
    });

    // Test specific model
    document.getElementById('testModelBtn').addEventListener('click', async () => {
      const resultEl = document.getElementById('modelTestResult');
      const selectEl = document.getElementById('modelSelect');
      const selectedModel = selectEl.value;
      
      if (!selectedModel) {
        resultEl.textContent = 'Please select a model first';
        return;
      }
      
      resultEl.textContent = \`Testing model \${selectedModel}...\`;
      
      try {
        // Extract the model ID from the full name (e.g., "models/gemini-pro" -> "gemini-pro")
        const modelId = selectedModel.split('/').pop();
        
        // Try both v1 and v1beta
        const endpoints = [
          \`https://generativelanguage.googleapis.com/v1beta/models/\${modelId}:generateContent\`,
          \`https://generativelanguage.googleapis.com/v1/models/\${modelId}:generateContent\`
        ];
        
        const results = [];
        
        for (const endpoint of endpoints) {
          try {
            const apiKey = '${API_KEY}'; // This will be server-side rendered
            const response = await fetch(\`\${endpoint}?key=\${apiKey}\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: "Hello, please respond with a short greeting."
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
            let responseData = null;
            
            try {
              responseData = await response.json();
            } catch (e) {
              responseData = "Could not parse response as JSON";
            }
            
            results.push({
              endpoint,
              status,
              success: response.ok,
              response: response.ok ? "Success" : responseData
            });
            
            // If this endpoint worked, no need to try the other
            if (response.ok) break;
          } catch (endpointError) {
            results.push({
              endpoint,
              status: 'Error',
              success: false,
              error: endpointError.message
            });
          }
        }
        
        resultEl.textContent = JSON.stringify(results, null, 2);
      } catch (error) {
        resultEl.textContent = 'Error: ' + error.message;
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