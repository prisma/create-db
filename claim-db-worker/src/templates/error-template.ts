import { footer } from "./footer-template";
import { navbar } from "./navbar-template";

export function getErrorHtml(title: string, message: string, details?: string) {
	return `
	<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<link rel="shortcut icon" type="image/png" href="/favicon.png"/>
		<title>${title}</title>
		<style>
			@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;700&display=swap');
			body {
				margin: 0;
				padding: 0;
      	background: url('/hero-background.svg') no-repeat center center fixed;
      	background-size: cover;
				color: #fff;
				font-family: 'Barlow', system-ui, sans-serif;
				display: flex;
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
			}

			.message {
				font-size: 1.5rem;
				margin-bottom: 2.2rem;
				font-weight: 400;
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
			}

			code {
				color: #A0AEC0;
				font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace;
				font-size: 0.875rem;
				background: none;
				border: none;
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
