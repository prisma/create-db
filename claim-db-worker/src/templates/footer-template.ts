export function footer() {
	return `
        <style>
            footer {
                width: 100%;
                padding: 0 16px;
				margin-top: auto;
            }
            .social-links {
                display: flex;
                gap: 16px;
            }
            .footer-content, .footer-copyright {
                max-width: 1240px;
                width: 100%;
                margin: 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .footer-copyright {
                margin-top: 32px;
                padding-top: 32px;
                border-top: 1px solid #2D3748;
            }
            .footer-copyright .compliance-logos {
                display: flex;
                gap: 56px;
            }

            /* Mobile Styles */
            @media (max-width: 768px) {
                footer {
                    padding: 0 20px;
                }
                
                .footer-content, .footer-copyright {
                    flex-direction: column;
                    gap: 24px;
                    text-align: center;
                }
                
                .social-links {
                    gap: 20px;
                }
                
                .footer-copyright {
                    margin-top: 24px;
                    padding-top: 24px;
                }
                
                .footer-copyright .compliance-logos {
                    gap: 32px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
            }

            /* Small Mobile Styles */
            @media (max-width: 480px) {
                footer {
                    padding: 0 16px;
                }
                
                .footer-content, .footer-copyright {
                    gap: 20px;
                }
                
                .social-links {
                    gap: 16px;
                }
                
                .footer-copyright .compliance-logos {
                    gap: 24px;
                }
            }
        </style>

		<footer>
			<div class="footer-content">
				<a target="_blank" rel="opener noferrer" href="https://prisma.io">
					<img src="/logo-dark.svg" alt="Prisma logo" />
				</a>
				<div class="social-links">
					<a href="https://pris.ly/discord" target="_blank" rel="opener noferrer">
						<img src="/discord.svg" width="30" height="30" alt="Discord logo" />
					</a>
					<a href="https://pris.ly/x" target="_blank" rel="opener noferrer">
						<img src="/xtwitter.svg" width="30" height="30" alt="Twitter/X logo" />
					</a>
					<a href="https://pris.ly/youtube" target="_blank" rel="opener noferrer">
						<img src="/youtube.svg" width="30" height="30" alt="Youtube logo" />
					</a>
					<a href="https://pris.ly/whatsapp" target="_blank" rel="opener noferrer">
						<img src="/whatsapp.svg" width="30" height="30" alt="Whatsapp logo" />
					</a>
					<a href="https://pris.ly/github" target="_blank" rel="opener noferrer">
						<img src="/github.svg" width="30" height="30" alt="Github logo" />
					</a>
				</div>
			</div>
			<div class="footer-copyright">
				<span>© 2024 Prisma Data, Inc.</span>
				<div class="compliance-logos">
					<img src="/gdpr.svg" alt="GDPR Logo" width="35" height="35" />
					<img src="/hipaa.svg" alt="HIPAA Logo" width="62" height="30" />
					<img src="/iso27.svg" alt="ISO27 Logo" width="73" height="27" />
					<img src="/soc2.svg" alt="SOC2 Logo" width="60" height="28" />
				</div>
			</div>
		</footer>
    `;
}
