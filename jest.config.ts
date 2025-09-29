import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './'
});

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/tests/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/features/(.*)$': '<rootDir>/src/features/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@gen/(.*)$': '<rootDir>/gen/$1',
    '^@/tests/(.*)$': '<rootDir>/src/tests/$1',
    '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/hooks/useSessionStore.tsx',
    'src/app/(auth)/login/page.tsx',
    'src/components/layout/session-guard.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};

export default createJestConfig(customJestConfig);
