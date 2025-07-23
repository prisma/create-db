import { footer } from "./footer-template";
import { navbar } from "./navbar-template";

// claim-db-worker/src/claim-template.ts
export function getClaimHtml(projectID: string, authUrl: string) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="shortcut icon" type="image/png" href="/favicon.png"/>
  <title>Claim Project</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;700&display=swap');
    body {
      font-family: 'Barlow', system-ui, sans-serif;
      background: url('/hero-background.svg') no-repeat center center fixed;
      background-size: cover;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex-direction: column;
      min-height: 100vh;
    }
    .container {
      text-align: center;
      display: flex;
      flex-direction: column;
      min-height: 50vh;
      height: 100%;
      align-items: center;
      justify-content: space-between;
    }
    .logo {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 2.5rem;
    }
    .logo-icon {
      margin-bottom: 1rem;
      width: 236px;
    }
    .container {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .title {
      font-size: 4rem;
      font-weight: 700;
      margin-bottom: 3rem;
      letter-spacing: -1px;
      color: #fff;
    }
    .message {
      font-size: 1.5rem;
      font-weight: 400;
      color: #b5c6d6;
      margin-bottom: 2.2rem;
    }
    .claim-btn {
      display: flex;
      align-items: center;
      gap: 0.75em;
      background: #24bfa7;
      color: #fff;
      font-size: 1.35rem;
      font-weight: 700;
      border: none;
      border-radius: 8px;
      padding: 0.9em 2.2em;
      cursor: pointer;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07);
      transition: background 0.2s;
      margin-bottom: 3rem;
    }
    .claim-btn:hover {
      background: #16A394;
    }
    .db-icon, .arrow-right-icon {
      width: 24px;
      height: 24px;
      display: inline-block;
      vertical-align: middle;
    }
    .subtext {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      font-style: italic;
    }
    @media (max-width: 600px) {
      .main-title {
        font-size: 2rem;
      }
      .claim-btn {
        font-size: 1rem;
        padding: 0.7em 1.2em;
      }
    }
  </style>
</head>
<body>
  <div class="logo">
    <img src="/prisma-postgres-logo.svg" alt="Prisma Postgres Logo" class="logo-icon">
  <div class="container">
    <div class="title">Claim your database<span style="color:#A0AEC0;font-size:0.7em;vertical-align:super;">*</span></div>
    <button class="claim-btn" id="claim-btn">
      <img src="/db-icon.svg" alt="Database Icon" class="db-icon">
      Claim database
      <img src="/arrow-right.svg" alt="Arrow Right" class="arrow-right-icon">
    </button>
    <div class="message subtext">*your <span style="font-weight:700;">database will expire after 24 hours</span> unless you <span style="text-decoration:underline;">authenticate</span></div>
  </div>
  <script>
    document.getElementById('claim-btn').addEventListener('click', function() {
      window.open('${authUrl}', '_blank');
    });
  </script>
</body>
</html>`;
}
