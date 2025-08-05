beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up any timers or async operations
  jest.clearAllTimers();
});

// Global test utilities
global.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.console = {
  ...console,
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
