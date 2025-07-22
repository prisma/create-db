export function getTerminalAnimationHtml() {
	return `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
            .terminal {
                width: 550px;
                min-width: 380px;
                height: 650px;
                background: #090a15;
                border-radius: 12px;
                border: 1px solid #2d3748;
                position: relative;
                overflow: hidden;
                font-family: 'JetBrains Mono', monospace;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                text-align: left !important;
            }
            .terminal-header {
                height: 40px;
                background: #1a202c;
                border-bottom: 1px solid #4a5568;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 20px;
                border-radius: 12px 12px 0 0;
            }
            .terminal-title {
                font-size: 13px;
                color: #a0aec0;
                font-weight: 500;
            }
            .play-pause-btn {
                width: 24px;
                height: 24px;
                background: none;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #718096;
                font-size: 14px;
                transition: color 0.2s;
            }
            .play-pause-btn:hover {
                color: #71E8DF;
            }
            .terminal-content {
                padding: 20px;
                height: calc(100% - 40px);
                overflow: hidden;
                font-size: 14px;
                line-height: 1.6;
            }
            .prompt {
                color: #71E8DF;
                margin-right: 8px;
            }
            .command {
                color: #e2e8f0;
            }
            .brand-line {
                color: #7F9CF5;
                margin: 16px 0;
            }
            .loading-line {
                color: #a0aec0;
                margin: 16px 0;
            }
            .connection-line {
                color: #a0aec0;
                margin: 16px 0;
            }
            .connection-string {
                color: #718096;
                font-size: 12px;
            }
            .claim-section {
                margin: 16px 0;
            }
            .claim-url {
                color: #7F9CF5;
                text-decoration: underline;
            }
            .expires {
                color: #a0aec0;
                margin: 8px 0;
            }
            .final-note {
                color: #718096;
                margin: 8px 0;
            }
            .bottom-prompt {
                color: #71E8DF;
                margin-top: 16px;
            }
            .spinner {
                display: inline-block;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .cursor {
                background: #71E8DF;
                width: 8px;
                height: 16px;
                display: inline-block;
                animation: blink 1s infinite;
                margin-left: 2px;
            }
            .typing-cursor {
                color: #71E8DF;
                animation: blink 1s infinite;
            }
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
            .line {
                opacity: 0;
                margin: 0;
                line-height: 1.2;
            }
            .line.visible {
                opacity: 1;
            }
            .section-title {
                font-weight: bold;
                font-size: 15px;
                margin: 18px 0 6px 0;
                display: flex;
                align-items: center;
            }
            .section-arrow {
                margin-left: 6px;
                font-size: 15px;
                color: #e2e8f0;
            }
            .subtitle {
                color: #f6ad55;
                margin-left: 24px;
                margin-bottom: 2px;
                font-size: 13px;
            }
            .indented {
                margin-left: 32px;
            }
            .indented-2 {
                margin-left: 48px;
            }
            .expires-line {
                color: #a0aec0;
                margin-left: 32px;
                margin-top: 2px;
                margin-bottom: 2px;
                font-size: 13px;
            }
            .section-space {
                margin-top: 18px;
            }
            .connection-string-scroll {
                display: inline-block;
                white-space: pre;
                overflow-x: auto;
                max-width: 420px;
                vertical-align: bottom;
            }
        </style>
        <div class="terminal">
            <div class="terminal-header">
                <div class="terminal-title">Terminal</div>
                <button class="play-pause-btn" id="playPauseBtn">
                    ⏸
                </button>
            </div>
            <div class="terminal-content" id="terminalContent">
                <!-- Content will be populated by JavaScript -->
            </div>
        </div>
        <script>
            class TerminalAnimation {
                constructor() {
                    this.isPlaying = true;
                    this.currentStep = 0;
                    this.timeouts = [];
                    this.content = document.getElementById('terminalContent');
                    this.playPauseBtn = document.getElementById('playPauseBtn');
                    // Calculate expiration date 24 hours from now
                    const expiresDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    const expiresString = expiresDate.toLocaleString('en-US', {
                        month: 'numeric', day: 'numeric', year: 'numeric',
                        hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
                    });
                    this.steps = [
                        { text: '<span class="prompt">$</span> <span class="command">npx create-db</span>', delay: 0 },
                        { text: '┌', delay: 320 },
                        { text: '│ <span class="brand-line section-title">● Creating a Prisma Postgres database</span>', delay: 80 },
                        { text: '│', delay: 40 },
                        { text: '│ <span class="subtitle">Provisioning a temporary database in us-east-1...</span>', delay: 60 },
                        { text: '│ <span class="indented" style="color:#a0aec0;">It will be automatically deleted in 24 hours,</span>', delay: 60 },
                        { text: '│ <span class="indented" style="color:#a0aec0;">but you can claim it.</span>', delay: 60 },
                        { text: '│', delay: 40 },
                        { text: '│ <span class="indented" style="color:#b7f7a8;">Database created successfully!</span>', delay: 60 },
                        { text: '│', delay: 40 },
                        { text: '│ <span class="section-title">● Connect to your database <span class="section-arrow">→</span></span>', delay: 80 },
                        { text: '│ <span class="subtitle indented">Use this connection string optimized for Prisma ORM:</span>', delay: 60 },
                        { text: '│ <span class="indented connection-string-scroll" style="color:#ffe066;">prisma+postgres://accelerate.prisma-data.net</span>', delay: 60 },
                        { text: '│ <span class="indented connection-string-scroll" style="color:#ffe066;">/?api_key=pxKhbPciOqJIUzI1NiIsInR5cC...</span>', delay: 60 },
                        { text: '│', delay: 40 },
                        { text: '│ <span class="subtitle indented">Use this connection string for everything else:</span>', delay: 60 },
                        { text: '│ <span class="indented connection-string-scroll" style="color:#ffe066;">postgresql://0b9575f43d984f3801044bc5228a0be</span>', delay: 60 },
                        { text: '│ <span class="indented connection-string-scroll" style="color:#ffe066;">574f198c09d5e96bf6c16477e1a3c85...</span>', delay: 60 },
                        { text: '│', delay: 40 },
                        { text: '│ <span class="section-title">● Claim your database <span class="section-arrow">→</span></span>', delay: 80 },
                        { text: '│ <span class="indented">Want to keep your database? Claim it via this link:</span>', delay: 60 },
                        { text: '│ <span class="indented-2" style="color:#7F9CF5;">https://create-db.prisma.io/?projectID=...</span>', delay: 60 },
                        { text: '│ <span class="expires-line">Your database will be deleted on ' + expiresString + '</span>', delay: 60 },
                        { text: '│ <span class="expires-line">if not claimed.</span>', delay: 60 },
                        { text: '└', delay: 120 },
                        { text: '', delay: 40 },
                        { text: '<span class="prompt">$</span>', delay: 200 }
                    ];
                    this.init();
                }
                init() {
                    this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
                    this.startAnimation();
                }
                startAnimation() {
                    this.content.innerHTML = '';
                    this.currentStep = 0;
                    this.clearTimeouts();
                    if (this.isPlaying) {
                        this.runAnimation();
                    }
                }
                runAnimation() {
                    this.typeStep(0);
                }
                typeStep(stepIndex) {
                    if (stepIndex >= this.steps.length) {
                        // Animation complete, do not restart
                        return;
                    }
                    const step = this.steps[stepIndex];
                    // Wait for the step delay first
                    const delayTimeout = setTimeout(() => {
                        if (this.isPlaying) {
                            this.typeText(step.text, step.class, () => {
                                // After this line is done typing, move to next step
                                this.typeStep(stepIndex + 1);
                            });
                            this.currentStep = stepIndex + 1;
                        }
                    }, step.delay);
                    this.timeouts.push(delayTimeout);
                }
                typeText(text, className = '', onComplete) {
                    const line = document.createElement('div');
                    line.className = 'line';
                    if (className) {
                        line.classList.add(className);
                    }
                    this.content.appendChild(line);
                    // Trigger animation
                    setTimeout(() => {
                        line.classList.add('visible');
                    }, 10);
                    if (text === '') {
                        // Empty line for spacing
                        line.innerHTML = '&nbsp;';
                        if (onComplete) onComplete();
                    } else {
                        // Type out the text character by character
                        let currentText = '';
                        const chars = text.split('');
                        chars.forEach((char, charIndex) => {
                            const charTimeout = setTimeout(() => {
                                if (this.isPlaying) {
                                    currentText += char;
                                    line.innerHTML = currentText + '<span class="typing-cursor">█</span>';
                                    // Remove cursor and call onComplete after last character
                                    if (charIndex === chars.length - 1) {
                                        const removeCursorTimeout = setTimeout(() => {
                                            line.innerHTML = currentText;
                                            if (onComplete) onComplete();
                                        }, 40);
                                        this.timeouts.push(removeCursorTimeout);
                                    }
                                }
                            }, charIndex * 12); // 12ms delay between characters (was 30ms)
                            this.timeouts.push(charTimeout);
                        });
                    }
                    // Auto-scroll to bottom
                    this.content.scrollTop = this.content.scrollHeight;
                }
                togglePlayPause() {
                    this.isPlaying = !this.isPlaying;
                    if (this.isPlaying) {
                        this.playPauseBtn.textContent = '⏸';
                        this.startAnimation();
                    } else {
                        this.playPauseBtn.textContent = '▶';
                        this.clearTimeouts();
                    }
                }
                clearTimeouts() {
                    this.timeouts.forEach(timeout => clearTimeout(timeout));
                    this.timeouts = [];
                }
            }
            // Initialize the animation when the page loads
            window.addEventListener('load', () => {
                new TerminalAnimation();
            });
        </script>
    `;
}
