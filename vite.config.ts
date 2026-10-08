import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: { proxy: { '/api': 'http://127.0.0.1:3000' } },
  test: {
    environment: 'jsdom',
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: [
        'src/domain/**/*.ts',
        'src/application/**/*.ts',
        'src/providers/**/*.ts',
        'src/ui/input-policy.ts',
        'server/app.ts',
      ],
      reporter: ['text', 'html', 'lcov'],
      thresholds: { statements: 85, branches: 80, functions: 85, lines: 85 },
    },
  },
});
