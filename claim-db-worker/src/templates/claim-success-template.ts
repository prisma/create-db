export function getClaimSuccessHtml(projectID: string) {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Congratulations!</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background: url('/hero-background.svg') no-repeat center center fixed;
      background-size: cover;
      color: #fff;
      font-family: 'Inter', system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
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
  <div class="container">
    <div class="logo">
      <img src="/prisma-postgres-logo.svg" alt="Prisma Postgres Logo" class="logo-icon">
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
</body>
</html>
	`;
}
