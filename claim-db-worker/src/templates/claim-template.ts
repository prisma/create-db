import { footer } from './footer-template';
import { navbar } from './navbar-template';

// claim-db-worker/src/claim-template.ts
export function getClaimHtml(projectID: string, authUrl: string) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="shortcut icon" type="image/png" href="/favicon.png"/>
  <link rel="preload" as="image" href="/hero-background.svg" type="image/svg+xml" />
  <title>Claim Database</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;700&display=swap');
    body {
      font-family: 'Barlow', system-ui, sans-serif;
			backdrop-filter: blur(12px);
				background: radial-gradient(circle at 30% 30%, rgba(0, 128, 128, 0.2), transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(0, 128, 128, 0.2), transparent 50%),
            #050d0f;
				background-size: cover;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      color: #fff;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
    }
    .container {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 24px;
      margin-top: 8rem;
      flex: 1;
    }
    .logo-icon {
      margin-bottom: 2rem;
      width: 236px;
      height: auto;
    }
    .title {
      font-size: 4rem;
      font-weight: 700;
      margin-bottom: 4rem;
      letter-spacing: -1px;
      color: #fff;
      line-height: 1.1;
    }
    .message {
      font-size: 1.5rem;
      font-weight: 400;
      color: #b5c6d6;
      margin-bottom: 3rem;
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
      margin-bottom: 4rem;
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
      color: #a0aec0;
    }

    /* Mobile Styles */
    @media (max-width: 768px) {
      .container {
        padding: 0 20px;
        min-height: 40vh;
      }
      
      .logo-icon {
        width: 200px;
        margin-bottom: 0.4rem;
      }
      
      .title {
        font-size: 2.5rem;
        margin-bottom: 2rem;
        line-height: 1.2;
      }
      
      .message {
        font-size: 1.25rem;
        margin-bottom: 1.8rem;
      }
      
      .claim-btn {
        font-size: 1.1rem;
        padding: 0.8em 1.8em;
        margin-bottom: 2.5rem;
      }
      
      .db-icon, .arrow-right-icon {
        width: 20px;
        height: 20px;
      }
      
      .subtext {
        font-size: 0.8rem;
      }
    }

    /* Small Mobile Styles */
    @media (max-width: 480px) {
      .container {
        padding: 0 16px;
        min-height: 35vh;
      }
      
      .logo-icon {
        width: 180px;
        margin-bottom: 0.3rem;
      }
      
      .title {
        font-size: 2rem;
        margin-bottom: 1.5rem;
      }
      
      .message {
        font-size: 1.1rem;
        margin-bottom: 1.5rem;
      }
      
      .claim-btn {
        font-size: 1rem;
        padding: 0.7em 1.5em;
        margin-bottom: 2rem;
      }
      
      .db-icon, .arrow-right-icon {
        width: 18px;
        height: 18px;
      }
      
      .subtext {
        font-size: 0.75rem;
      }
    }

    /* Touch-friendly improvements */
    @media (hover: none) and (pointer: coarse) {
      .claim-btn {
        min-height: 44px;
        padding: 12px 24px;
      }
    }
  </style>
</head>
<body>
${navbar()}
  <div class="container">
    <img src="/prisma-postgres-logo.svg" alt="Prisma Postgres Logo" class="logo-icon">
    <div class="title">Claim your database<span style="color:#A0AEC0;font-size:0.7em;vertical-align:super;">*</span></div>
    <button class="claim-btn" id="claim-btn">
      <img src="/db-icon.svg" alt="Database Icon" class="db-icon">
      Claim database
      <img src="/arrow-right.svg" alt="Arrow Right" class="arrow-right-icon">
    </button>
    <div class="message subtext">*your <b>database will be deleted 24 hours after creation</b> unless you claim it</div>
  </div>
  ${footer()}
  <script>
    document.getElementById('claim-btn').addEventListener('click', function() {
      window.open('${authUrl}', '_blank');
    });
  </script>
</body>
</html>`;
}
