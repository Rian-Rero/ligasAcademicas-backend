import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.js'],
    setupFiles: ['src/__tests__/helpers/dbSetup.js'],
    env: {
      NODE_ENV: 'test',
      ALLOWED_ORIGINS: 'http://localhost:5173',
      ACCESS_TOKEN_SECRET: 'test-access-secret',
      REFRESH_TOKEN_SECRET: 'test-refresh-secret',
      EMAIL_TOKEN_SECRET: 'test-email-secret',
      PASSWORD_TOKEN_SECRET: 'test-password-secret',
      ACCESS_TOKEN_EXPIRE: '900',
      REFRESH_TOKEN_EXPIRE: '86400',
      EMAIL_TOKEN_EXPIRE: '3600',
      PASSWORD_TOKEN_EXPIRE: '3600',
      COOKIE_SECRET: 'test-cookie-secret',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: [
        'src/__tests__/**',
        'src/index.js',
        'src/vercel.js',
        'src/config/cluster.js',
        'src/utils/general/seedPermissions.js',
        'src/utils/general/fileDirName.js',
        'src/errors/unhandledErrors.js',
        'src/config/**',
        'src/mail/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
