import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    reporter: 'list',
    use: {
        channel: 'chrome',
    },
    webServer: [
        {
            command: 'node e2e/server.js',
            url: 'http://localhost:5101/e2e/fixtures/host.html',
            env: { PORT: '5101' },
            reuseExistingServer: !process.env.CI,
        },
        {
            command: 'node e2e/server.js',
            url: 'http://localhost:5102/e2e/fixtures/host.html',
            env: { PORT: '5102' },
            reuseExistingServer: !process.env.CI,
        },
    ],
});
