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
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/tests/**',
    '!src/features/**/__tests__/**',
    '!src/**/index.{ts,tsx,js,jsx}',
    '!src/**/types.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 0.9,
      functions: 0.9,
      lines: 0.9,
      statements: 0.9
    }
  }
};

export default createJestConfig(customJestConfig);
