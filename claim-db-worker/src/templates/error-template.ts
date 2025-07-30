import { footer } from './footer-template';
import { navbar } from './navbar-template';

export function getErrorHtml(title: string, message: string, details?: string) {
	return `
	<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link rel="shortcut icon" type="image/png" href="/favicon.png"/>
		<link rel="preload" as="image" href="/hero-background.svg" type="image/svg+xml" />
		<title>${title}</title>
		<style>
			@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;700&display=swap');
			body {
				margin: 0;
				padding: 0;
				backdrop-filter: blur(12px);
				background: radial-gradient(circle at 30% 30%, rgba(0, 128, 128, 0.2), transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(0, 128, 128, 0.2), transparent 50%),
            #050d0f;
				background-size: cover;
				color: #fff;
				font-family: 'Barlow', system-ui, sans-serif;
				display: flex;
				justify-content: space-between;
				flex-direction: column;
				min-height: 100vh;
				overflow-x: hidden;
			}

			.container {
				text-align: center;
				display: flex;
				flex-direction: column;
				min-height: 50vh;
				height: 100%;
				align-items: center;
				justify-content: center;
				padding: 0 24px;
			}

			.content {
				max-width: 800px;
				width: 100%;
			}

			.error-header {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 0.75rem;
				margin-bottom: 1.2rem;
			}

			.error-x {
				font-size: 4rem;
				font-weight: 900;
				color: #FC8181;
				line-height: 1;
			}

			.title {
				color: #FC8181;
				font-size: 4rem;
				font-weight: 700;
				letter-spacing: -1px;
				line-height: 1.1;
			}

			.message {
				font-size: 1.5rem;
				margin-bottom: 2.2rem;
				font-weight: 400;
				color: #b5c6d6;
			}

			pre.error-details {
				background: #090A15;
				color: #fff;
				font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace;
				font-size: 1rem;
				border-radius: 8px;
				text-align: left;
				word-break: break-all;
				padding: 24px 16px;
				border: 1.5px solid #2D3748;
				margin: 0 auto;
				display: block;
				max-width: 100%;
				overflow-x: auto;
			}

			code {
				color: #A0AEC0;
				font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace;
				font-size: 0.875rem;
				background: none;
				border: none;
			}

			/* Mobile Styles */
			@media (max-width: 768px) {
				.container {
					padding: 0 20px;
					min-height: 40vh;
				}
				
				.content {
					max-width: 100%;
				}
				
				.error-header {
					gap: 0.5rem;
					margin-bottom: 1rem;
				}
				
				.error-x {
					font-size: 2rem;
				}
				
				.title {
					font-size: 2.5rem;
					line-height: 1.2;
				}
				
				.message {
					font-size: 1.25rem;
					margin-bottom: 1.8rem;
				}
				
				pre.error-details {
					font-size: 0.875rem;
					padding: 20px 12px;
				}
			}

			/* Small Mobile Styles */
			@media (max-width: 480px) {
				.container {
					padding: 0 16px;
					min-height: 35vh;
				}
				
				.error-header {
					flex-direction: column;
					gap: 0.75rem;
					margin-bottom: 1.5rem;
				}
				
				.error-x {
					font-size: 2.5rem;
				}
				
				.title {
					font-size: 2rem;
					line-height: 1.2;
				}
				
				.message {
					font-size: 1.1rem;
					margin-bottom: 1.5rem;
				}
				
				pre.error-details {
					font-size: 0.8rem;
					padding: 16px 12px;
				}
			}
		</style>
	</head>
	<body>
  		${navbar()}
		<div class="container">
			<div class="content">
				<div class="error-header">
					<span class="error-x" aria-label="Error">
						<svg width="64" height="64" viewBox="0 0 96 96" fill="none" aria-hidden="true" style="display: block">
							<circle cx="48" cy="48" r="40" fill="#FC8181" />
							<line x1="34" y1="34" x2="62" y2="62" stroke="#222B32" stroke-width="8" stroke-linecap="round" />
							<line x1="62" y1="34" x2="34" y2="62" stroke="#222B32" stroke-width="8" stroke-linecap="round" />
						</svg>
					</span>
					<span class="title">${title}</span>
				</div>
				<div class="message">${message}</div>
				${
					details
						? `
				<pre class="error-details"><code>${details}</code></pre>
				`
						: ''
				}
			</div>
		</div>
  		${footer()}
	</body>
</html>

  `;
}
