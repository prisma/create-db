// claim-db-worker/src/claim-template.ts
export function getClaimHtml(projectID: string, authUrl: string) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claim Project</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: #f6f8fa;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      background: #fff;
      padding: 2rem 2.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07);
      text-align: center;
    }
    h1 {
      margin-bottom: 1rem;
      color: #222;
    }
    code {
      background: #f0f1f3;
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-size: 1.1em;
    }
    button {
      margin-top: 1.5rem;
      padding: 0.7em 2em;
      font-size: 1.1em;
      border: none;
      border-radius: 6px;
      background: #0070f3;
      color: #fff;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #0059c1;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Claim your database</h1>
    <button id="claim-btn">Claim</button>
  </div>
  <script>
    document.getElementById('claim-btn').addEventListener('click', function() {
      window.open('${authUrl}', '_blank');
    });
  </script>
</body>
</html>`;
}
