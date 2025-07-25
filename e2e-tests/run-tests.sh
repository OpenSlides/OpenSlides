#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}OpenSlides E2E Test Runner${NC}"
echo "================================"

# Check if we should start Docker services
if [ "$1" != "--no-docker" ]; then
    echo -e "${YELLOW}Starting Docker services...${NC}"
    npm run docker:up
    
    echo -e "${YELLOW}Waiting for services to be ready...${NC}"
    npm run wait-for-services
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to start services. Exiting.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}All services are ready!${NC}"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Clean previous reports
rm -rf reports
mkdir -p reports/screenshots reports/videos

# Run tests based on argument
TEST_COMMAND="npm test"

case "$2" in
    "smoke")
        echo -e "${YELLOW}Running smoke tests only...${NC}"
        TEST_COMMAND="npm run test:smoke"
        ;;
    "dev")
        echo -e "${YELLOW}Running in development mode (headed browser)...${NC}"
        TEST_COMMAND="npm run test:dev"
        ;;
    "parallel")
        echo -e "${YELLOW}Running tests in parallel...${NC}"
        TEST_COMMAND="npm run test:parallel"
        ;;
    *)
        echo -e "${YELLOW}Running all tests...${NC}"
        ;;
esac

# Execute tests
$TEST_COMMAND
TEST_EXIT_CODE=$?

# Generate report
echo -e "${YELLOW}Generating test report...${NC}"
npm run report

# Stop Docker services if we started them
if [ "$1" != "--no-docker" ]; then
    echo -e "${YELLOW}Stopping Docker services...${NC}"
    npm run docker:down
fi

# Display results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo "View report at: file://$(pwd)/reports/cucumber-report.html"
else
    echo -e "${RED}✗ Some tests failed.${NC}"
    echo "View report at: file://$(pwd)/reports/cucumber-report.html"
    echo "Screenshots saved in: reports/screenshots/"
fi

exit $TEST_EXIT_CODE