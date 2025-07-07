export function getClaimSuccessHtml(projectID: string) {
	return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<title>Project Claimed!</title>
			<style>
				body { font-family: system-ui, sans-serif; background: #f6f8fa; display: flex; align-items: center; justify-content: center; height: 100vh; }
				.container { background: #fff; padding: 2rem 2.5rem; border-radius: 12px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); text-align: center; }
				h1 { color: #0070f3; }
			</style>
		</head>
		<body>
			<div class="container">
				<h1>🎉 Congratulations!</h1>
				<p>You have successfully claimed the database.</p>
			</div>
		</body>
		</html>
	`;
}
