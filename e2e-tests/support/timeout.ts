import { setDefaultTimeout } from '@cucumber/cucumber';

// Set default timeout for all steps to 10 seconds for faster failure detection
// Individual steps can override this if they need more time
setDefaultTimeout(10 * 1000);