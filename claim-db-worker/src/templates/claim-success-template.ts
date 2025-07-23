import { footer } from './footer-template';
import { navbar } from './navbar-template';

export function getClaimSuccessHtml(projectID: string) {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="shortcut icon" type="image/png" href="/favicon.png"/>
  <link rel="preload" as="image" href="/hero-background.svg" type="image/svg+xml" />
  <title>Congratulations!</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;700&display=swap');
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
  		backdrop-filter: blur(12px);
				background: radial-gradient(circle at 30% 30%, rgba(0, 128, 128, 0.2), transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(0, 128, 128, 0.2), transparent 50%),
            #050d0f;
			background-size: cover;
      background-size: cover;
      color: #fff;
      font-family: 'Barlow', system-ui, sans-serif;
      display: flex;
			overscroll-behavior: none;
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

    .title {
      font-size: 4rem;
      font-weight: 700;
      margin-bottom: 1.2rem;
      letter-spacing: -1px;
      color: #fff;
    }
    .message {
      font-size: 1.5rem;
      font-weight: 400;
      color: #b5c6d6;
      margin-bottom: 2.2rem;
    }
    .success-btn {
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
      margin-bottom: 2.5rem;
      text-decoration: none;
      justify-content: center;
    }
    .success-btn:hover {
      background: #16A394;
    }
    .arrow-up-icon {
      width: 24px;
      height: 24px;
      display: inline-block;
      vertical-align: middle;
    }
    .db-img-container {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 2.5rem;
    }
    .db-img {
      width: 120px;
      height: 120px;
      filter: drop-shadow(0 0 24px #5eead4cc);
      display: block;
    }
    .checkmark-icon {
      position: absolute;
      right: 50%;
      bottom: 50%;
      transform: translate(150%, 50%);
      width: 48px;
      height: 48px;
      display: block;
    }
    @media (max-width: 600px) {
      .title {
        font-size: 2rem;
      }
      .success-btn {
        font-size: 1rem;
        padding: 0.7em 1.2em;
      }
      .db-img {
        width: 80px;
        height: 80px;
      }
      .checkmark-icon {
        width: 32px;
        height: 32px;
        right: 8px;
        bottom: 8px;
        transform: none;
      }
    }
  </style>
</head>
<body>
  ${navbar()}
  <div class="container">
		<div class="content">
      <div>
        <img src="/prisma-postgres-logo.svg" alt="Prisma Postgres Logo" width="250" height="100">
      </div>
      <div class="title">Congratulations!</div>
      <div class="message">You have successfully claimed your database</div>
      <a class="success-btn" href="https://console.prisma.io/" target="_blank" rel="noopener">
        Go use your database
        <img src="/arrow-up.svg" alt="Arrow up" class="arrow-up-icon">
      </a>
      <div class="db-img-container">
        <img src="/db-img.svg" alt="Database Success" class="db-img">
        <span class="checkmark-icon">
            <svg width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <circle cx="32" cy="32" r="28" fill="#5eead4"/>
              <path d="M20 34l8 8 16-16" stroke="#222B32" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </span>
      </div>
    </div>
  </div>
  ${footer()}
</body>
</html>
	`;
}
