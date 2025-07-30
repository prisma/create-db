import { footer } from './footer-template';
import { navbar } from './navbar-template';

export function getHomepageHtml() {
	return `
<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta property="og:title" content="Want a free, instant Prisma Postgres database?" />
		<meta
			property="og:description"
			content="Get a temporary Prisma Postgres database instantly. No account or config needed. Just run npx create-db."
		/>
		<meta property="og:image" content="/og-image.png" />
		<meta property="og:type" content="website" />
		<meta property="og:url" content="https://create-db.prisma.io/" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content="Want a free, instant Prisma Postgres database?" />
		<meta
			name="twitter:description"
			content="Get a temporary Prisma Postgres database instantly. No account or config needed. Just run npx create-db."
		/>
		<meta name="twitter:image" content="/og-image.png" />
		<link rel="shortcut icon" type="image/png" href="/favicon.png" />
		<link rel="preload" as="image" href="/hero-background.svg" type="image/svg+xml" />
		<title>Prisma Postgres Create DB</title>
		<style>
			@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;700&display=swap');
			* {
				margin: 0;
				padding: 0;
				box-sizing: border-box;
			}
			body {
				backdrop-filter: blur(12px);
				background: radial-gradient(circle at 30% 30%, rgba(0, 128, 128, 0.2), transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(0, 128, 128, 0.2), transparent 50%),
            #050d0f;
				background-size: cover;
				font-family: 'Barlow', system-ui, sans-serif;
				color: #e2e8f0;
				padding: 0;
				display: flex;
				align-items: center;
				justify-content: center;
				overscroll-behavior: none;
				flex-direction: column;
				min-height: 100vh;
			}
			.header-container {
				display: flex;
				align-items: center;
				justify-content: center;
				flex-direction: column;
				max-width: 800px;
				text-align: center;
				width: 100%;
				padding: 0 24px;
			}
			.header-subtitle {
				margin-bottom: 32px;
			}
			.header-subtitle img {
				width: 250px;
				height: auto;
			}
			.title {
				font-size: 4rem;
				font-weight: 700;
				letter-spacing: -0.02em;
				color: #fff;
				line-height: 1.1;
				margin-bottom: 24px;
			}
			.pill {
				position: relative;
				background-color: #161d2b;
				border-radius: 100px;
				padding: 8px 12px;
				display: flex;
				align-items: center;
				gap: 10px;
				z-index: 1;
				margin-bottom: 32px;
			}

			.pill::before {
				content: '';
				position: absolute;
				inset: 0;
				border-radius: 100px;
				padding: 1px;
				background: linear-gradient(0deg, #71e8df 0%, #3f827d 100%);
				-webkit-mask:
					linear-gradient(#fff 0 0) content-box,
					linear-gradient(#fff 0 0);
				-webkit-mask-composite: xor;
				mask-composite: exclude;
				z-index: -1;
			}
			.pill > p {
				text-transform: uppercase;
				font-size: 1rem;
				font-weight: 700;
				color: #fff;
			}
			.pill img {
				width: 20px;
				height: 20px;
			}
			.code-snippet {
				background: #181b23;
				border-radius: 20px;
				box-shadow:
					0 0 0 2px #71e8df,
					0 0 16px #71e8df33;
				display: flex;
				align-items: center;
				gap: 1.2rem;
				padding: 1rem 1.5rem;
				font-family: 'JetBrains Mono', monospace;
				font-size: 18px;
				color: #e2e8f0;
				margin: 32px 0 1rem 0;
				position: relative;
				width: 100%;
				max-width: 600px;
			}
			.code-icon {
				color: #3f4b5b;
				font-size: 18px;
				font-weight: 500;
				flex-shrink: 0;
			}
			.code-text {
				font-size: 18px;
				white-space: nowrap;
			}
			.copy-btn {
				background: #232634;
				border: none;
				border-radius: 8px;
				padding: 8px 12px;
				margin-left: auto;
				cursor: pointer;
				display: flex;
				align-items: center;
				color: #a0aec0;
				transition:
					background 0.2s,
					color 0.2s;
				flex-shrink: 0;
			}
			.copy-btn:hover {
				background: #2d3748;
				color: #71e8df;
			}
			.copy-btn img {
				width: 20px;
				height: 20px;
			}
			.description {
				font-family: 'Barlow', system-ui, sans-serif;
				font-size: 14px;
				color: #a0aec0;
				font-style: italic;
				margin-top: 0.5rem;
				text-align: center;
				max-width: 600px;
			}

			.section-container {
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: center;
				gap: 75px;
				padding: 133px 24px;
				width: 100%;
			}
			.steps-options {
				display: flex;
				flex-direction: column;
				gap: 24px;
				align-items: center;
				margin: 40px 0 32px 0;
				width: 100%;
				max-width: 700px;
			}
			.steps-list {
				display: flex;
				flex-direction: column;
				gap: 16px;
				width: 100%;
				text-wrap: pretty;
				max-width: 700px;
			}
			.step {
				display: flex;
				flex-direction: column;
				gap: 12px;
				text-align: left;
			}
			.step-header {
				display: flex;
				align-items: center;
				gap: 12px;
			}
			.step-number {
				background: #090a15;
				border-radius: 4px;
				color: #fff;
				font-size: 20px;
				font-family: 'Barlow', sans-serif;
				font-weight: 700;
				text-transform: uppercase;
				line-height: 1.2;
				letter-spacing: 2px;
				width: 36px;
				height: 36px;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
			}
			.step-title {
				color: #fff;
				font-size: 20px;
				font-family: 'Barlow', sans-serif;
				font-weight: 700;
				text-transform: uppercase;
				line-height: 1.2;
				letter-spacing: 2px;
			}
			.step-desc {
				color: #a0aec0;
				font-size: 18px;
				font-family: 'Barlow', sans-serif;
				font-weight: 400;
				line-height: 1.4;
				margin-left: 48px;
			}
			.step-code {
				color: #e2e8f0;
				font-family: 'JetBrains Mono', monospace;
				font-size: 18px;
			}
			.step-italic {
				font-style: italic;
			}
			.options-table {
				border-radius: 8px;
				outline: 1px #2d3748 solid;
				outline-offset: -1px;
				display: flex;
				flex-direction: column;
				margin-left: 48px;
				overflow: hidden;
				width: calc(100% - 48px);
			}
			.options-header,
			.options-row {
				display: flex;
				align-items: center;
			}
			.options-header {
				background: #121521;
			}
			.options-flag {
				width: 250px;
				padding: 8px 16px;
				background: #121521;
				color: #e2e8f0;
				font-size: 14px;
				font-family: 'JetBrains Mono', monospace;
				font-weight: 700;
				line-height: 1.3;
				display: flex;
				align-items: center;
				flex-shrink: 0;
			}
			.options-desc {
				flex: 1 1 0;
				min-height: 48px;
				padding: 8px 16px;
				background: #121521;
				color: #e2e8f0;
				font-size: 14px;
				font-family: 'JetBrains Mono', monospace;
				font-weight: 400;
				line-height: 1.3;
				display: flex;
				align-items: center;
			}
			.options-row {
				background: #090a15;
				min-height: 48px;
				display: flex;
				align-items: center;
			}
			.options-row .options-flag {
				background: #090a15;
				padding: 0 16px;
				min-height: 48px;
				display: flex;
				align-items: center;
			}
			.options-row .options-desc {
				background: #090a15;
				font-family: 'Barlow', sans-serif;
				font-weight: 400;
				padding: 0 16px;
				min-height: 48px;
				display: flex;
				align-items: center;
			}
			.flag-box {
				display: inline-block;
				background: #121521;
				border-radius: 4px;
				color: #fc8181;
				font-size: 14px;
				font-family: 'Roboto Mono', monospace;
				font-weight: 700;
				line-height: 1.3;
				padding: 4px 24px;
			}

			/* Mobile Styles */
			@media (max-width: 768px) {
				body {
					padding: 0;
					gap: 0;
				}
				
				.header-container {
					padding: 0 20px;
					margin-bottom: 40px;
				}
				
				.header-subtitle {
					margin-bottom: 24px;
				}
				
				.header-subtitle img {
					width: 200px;
				}
				
				.title {
					font-size: 2.5rem;
					line-height: 1.2;
					margin-bottom: 20px;
				}
				
				.pill {
					padding: 8px 16px;
					gap: 8px;
					margin-bottom: 24px;
				}
				
				.pill > p {
					font-size: 0.875rem;
				}
				
				.pill img {
					width: 18px;
					height: 18px;
				}
				
				.code-snippet {
					flex-direction: row;
					gap: 12px;
					padding: 16px 20px;
					margin: 24px 0 12px 0;
					font-size: 16px;
					border-radius: 16px;
				}
				
				.code-icon {
					font-size: 16px;
				}
				
				.code-text {
					font-size: 16px;
					white-space: nowrap;
				}
				
				.copy-btn {
					padding: 8px 12px;
				}
				
				.copy-btn img {
					width: 18px;
					height: 18px;
				}
				
				.description {
					font-size: 13px;
					margin-top: 8px;
				}
				
				.section-container {
					flex-direction: column;
					gap: 40px;
					padding: 60px 20px;
				}
				
				.steps-options {
					margin: 0;
					gap: 20px;
					align-items: center;
					max-width: 100%;
				}
				
				.steps-list {
					max-width: 100%;
					gap: 24px;
				}
				
				.step {
					gap: 16px;
				}
				
				.step-header {
					gap: 12px;
				}
				
				.step-number {
					width: 32px;
					height: 32px;
					font-size: 18px;
				}
				
				.step-title {
					font-size: 18px;
				}
				
				.step-desc {
					font-size: 16px;
					margin-left: 44px;
					line-height: 1.5;
				}
				
				.step-code {
					font-size: 16px;
				}
				
				.options-table {
					margin-left: 44px;
					width: calc(100% - 44px);
				}
				
				.options-flag {
					width: 140px;
					padding: 8px 12px;
					font-size: 13px;
					min-width: 140px;
				}
				
				.options-desc {
					padding: 8px 12px;
					font-size: 13px;
					word-wrap: break-word;
					overflow-wrap: break-word;
				}
				
				.flag-box {
					font-size: 13px;
					padding: 3px 16px;
					white-space: nowrap;
				}
			}

			/* Small Mobile Styles */
			@media (max-width: 480px) {
				.header-container {
					padding: 0 16px;
					margin-bottom: 32px;
				}
				
				.header-subtitle img {
					width: 180px;
				}
				
				.title {
					font-size: 2rem;
					margin-bottom: 16px;
				}
				
				.pill {
					padding: 6px 12px;
					margin-bottom: 20px;
				}
				
				.pill > p {
					font-size: 0.75rem;
				}
				
				.pill img {
					width: 16px;
					height: 16px;
				}
				
				.code-snippet {
					padding: 14px 16px;
					margin: 20px 0 10px 0;
					font-size: 14px;
					border-radius: 12px;
				}
				
				.code-icon {
					font-size: 14px;
				}
				
				.code-text {
					font-size: 14px;
				}
				
				.copy-btn {
					padding: 6px 10px;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				
				.copy-btn img {
					width: 16px;
					height: 16px;
				}
				
				.description {
					font-size: 12px;
				}
				
				.section-container {
					padding: 40px 16px;
					gap: 32px;
				}
				
				.steps-list {
					gap: 20px;
				}
				
				.step {
					gap: 12px;
				}
				
				.step-number {
					width: 28px;
					height: 28px;
					font-size: 16px;
				}
				
				.step-title {
					font-size: 16px;
				}
				
				.step-desc {
					font-size: 14px;
					margin-left: 40px;
				}
				
				.step-code {
					font-size: 14px;
				}
				
				.options-table {
					margin-left: 40px;
					width: calc(100% - 40px);
				}
				
				.options-flag {
					width: 140px;
					padding: 6px 10px;
					font-size: 12px;
					min-width: 140px;
				}
				
				.options-desc {
					padding: 6px 10px;
					font-size: 12px;
					word-wrap: break-word;
					overflow-wrap: break-word;
				}
				
				.flag-box {
					font-size: 12px;
					padding: 2px 12px;
					white-space: nowrap;
				}
			}

			/* Touch-friendly improvements */
			@media (hover: none) and (pointer: coarse) {
				.copy-btn {
					min-height: 44px;
					min-width: 44px;
				}
			}
		</style>
	</head>
	<body>
		${navbar()}
		<div class="header-container">
			<div class="header-subtitle">
				<img src="/prisma-postgres-logo.svg" alt="Prisma Postgres Logo" />
			</div>
			<div class="pill">
				<img src="/magic-wand-icon.svg" alt="Magic Wand Icon" />
				<p>No account or config needed</p>
			</div>
			<h1 class="title">Want a free, instant <br>Prisma Postgres database?</h1>
			<div class="code-snippet">
				<span class="code-icon">$</span>
				<span class="code-text">npx create-db@latest</span>
				<button class="copy-btn" aria-label="Copy command">
					<img src="/copy-icon.svg" alt="Copy Icon" />
				</button>
			</div>
			<p class="description">your <b>database will be deleted 24 hours after creation</b> unless you claim it</p>
		</div>
		<div class="section-container">
			<section class="steps-options">
				<div class="steps-list">
					<div class="step">
						<div class="step-header">
							<div class="step-number">1</div>
							<div class="step-title">Provision instantly</div>
						</div>
						<div class="step-desc">
							Run <span class="step-code">npx create-db@latest</span> in your terminal to get a Prisma Postgres database. No account or other setup needed.
						</div>
					</div>
					<div class="step">
						<div class="step-header">
							<div class="step-number">2</div>
							<div class="step-title">Get the connection string</div>
						</div>
						<div class="step-desc">Use the connection string for anything you need: testing, AI agents, prototypes.</div>
					</div>
					<div class="step">
						<div class="step-header">
							<div class="step-number">3</div>
							<div class="step-title">Claim it if you want to keep it</div>
						</div>
						<div class="step-desc">
							Transfer the database to your Prisma account to make sure it doesn't get deleted. Otherwise,
							<span class="step-italic">it will expire after 24 hours.</span>
						</div>
                        </div>
                        <div class="step">
                        <div class="step-header">
                                    <div class="step-number">+</div>
                                    <div class="step-title">Options</div>
                                </div>
                        <div class="options-table">
                            <div class="options-header">
                                <div class="options-flag">Flag</div>
                                <div class="options-desc">Description</div>
                            </div>
                            <div class="options-row">
                                <div class="options-flag"><span class="flag-box">--region</span></div>
                                <div class="options-desc">Specify the database region</div>
                            </div>
							<div class="options-row">
                                <div class="options-flag"><span class="flag-box">--interactive</span></div>
                                <div class="options-desc">Run in interactive mode</div>
                            </div>
                            <div class="options-row">
                                <div class="options-flag"><span class="flag-box">--help</span></div>
                                <div class="options-desc">Show all available options</div>
                            </div>
                        </div>
                        </div>
				</div>
			</section>
		</div>
		${footer()}
	</body>
	<script>
		document.addEventListener('DOMContentLoaded', function () {
			const copyBtn = document.querySelector('.copy-btn');
			if (copyBtn) {
				copyBtn.addEventListener('click', function () {
					const command = 'npx create-db@latest';
					navigator.clipboard.writeText(command).then(() => {
						// Optional: Visual feedback
						copyBtn.setAttribute('aria-label', 'Copied!');
						copyBtn.classList.add('copied');
						setTimeout(() => {
							copyBtn.setAttribute('aria-label', 'Copy command');
							copyBtn.classList.remove('copied');
						}, 1200);
					});
				});
			}
		});
	</script>
</html>
`;
}
