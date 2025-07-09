export function getErrorHtml(title: string, message: string, details?: string) {
	return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<title>${title}</title>
			<style>
				body { 
					font-family: system-ui, sans-serif; 
					background: #f6f8fa; 
					display: flex; 
					align-items: center; 
					justify-content: center; 
					height: 100vh; 
					margin: 0;
				}
				.container { 
					background: #fff; 
					padding: 2rem 2.5rem; 
					border-radius: 12px; 
					box-shadow: 0 2px 16px rgba(0,0,0,0.07); 
					text-align: center;
					max-width: 500px;
					width: 100%;
				}
				h1 { 
					color: #dc2626; 
					margin-bottom: 1rem;
				}
				.message {
					color: #374151;
					margin-bottom: 1.5rem;
					line-height: 1.6;
				}
				.details {
					background: #f3f4f6;
					padding: 1rem;
					border-radius: 8px;
					font-family: monospace;
					font-size: 0.875rem;
					color: #6b7280;
					text-align: left;
					word-break: break-all;
					margin-top: 1rem;
				}
				.back-link {
					display: inline-block;
					margin-top: 1.5rem;
					color: #0070f3;
					text-decoration: none;
					font-weight: 500;
				}
				.back-link:hover {
					text-decoration: underline;
				}
			</style>
		</head>
		<body>
			<div class="container">
				<h1>❌ ${title}</h1>
				<p class="message">${message}</p>
				${details ? `<div class="details">${details}</div>` : ''}
				<a href="javascript:history.back()" class="back-link">← Go Back</a>
			</div>
		</body>
		</html>
	`;
} 