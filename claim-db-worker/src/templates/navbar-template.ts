export function navbar() {
	return `
        <style>
			.navbar {
				height: 72px;
				padding: 16px;
				width: 100vw;
				margin-bottom: 59px;
			}
			.navbar-content {
				max-width: 1240px;
				width: 100%;
				margin: 0 auto;
				display: flex;
				justify-content: space-between;
				align-items: center;
			}
			.nav-links {
				display: flex;
				gap: 32px;
			}
			.btn-group {
				display: flex;
				gap: 16px;
			}
			.btn-group .btn {
				display: inline-flex
				justify-content: center;
				max-width: 100%;
				text-align: left;
				z-index: 10;
				width: max-content;
				align-items: center;
				box-sizing: border-box;
				border-radius: 6px;
				text-decoration: none;
				position: relative;
				background: transparent;
				color: var(--Surface-surface-brand-default, #16A394);
				font-family: Barlow;
				padding: 5px 12px;
				font-size: var(--font-size-s, 16px);
				font-style: normal;
				font-weight: 700;
				line-height: 20px; /* 166.667% */
				border: 2px solid var(--Surface-surface-brand-default, #16A394);
				transition: all 150ms ease-in-out;
				position: relative;
			}
			.btn::after {
				content: "";
				position: absolute;
				border-radius: 9px;
				box-sizing: content-box;
			}
			.btn:focus-within::after {
				border: 2px solid #154f47;
				top: -6px;
				width: calc(100% + 8px);
				height: calc(100% + 8px);
				left: -6px;
			}
			.btn-group .btn:hover {
				border-color:  #154f47;
				background-color: transparent;
				color: #154f47;
			}
			.btn-group .btn.primary {
				background-color: var(--Surface-surface-brand-default, #16A394);
				color: white;
			}
			.btn-group .btn.primary:hover {
				background-color: #154f47
			}
			.btn.primary:focus-within::after {
				border: 2px solid #fff;
				top: -4px;
				width: calc(100% + 6px);
				height: calc(100% + 6px);
				left: -4px;
			}
        </style>
		<nav class="navbar">
			<div class="navbar-content">
				<a target="_blank" rel="opener noferrer" href="https://prisma.io"><img src="/logo-dark.svg" alt="Prisma logo" /></a>
				<div class="nav-links">
					<a target="_blank" rel="opener noferrer" href="http://github.com/prisma"><img src="/github.svg" alt="github" width="31" height="31"/></a>
					<div class="btn-group">
						<a class="btn" href="https://console.prisma.io/login?utm_campaign=create_db&utm_source=create_db_web" target="_blank" rel="opener noferrer">Login</a>
						<a class="btn primary" href="https://console.prisma.io/sign-up?utm_campaign=create_db&utm_source=create_db_web" target="_blank" rel="opner noferrer">Sign up</a>
					</div>
				</div>
			</div>
		</nav>
    `;
}
