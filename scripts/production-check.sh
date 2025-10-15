#!/bin/bash

# Production Readiness Check Script
# Run this before deploying to production

echo "🔍 Production Readiness Check"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check for console.log statements
echo "📝 Checking for console.log statements..."
CONSOLE_COUNT=$(grep -r "console\." --include="*.ts" --include="*.tsx" ./screens ./services ./contexts ./App.tsx 2>/dev/null | wc -l)
if [ "$CONSOLE_COUNT" -gt 0 ]; then
    echo -e "${RED}✗${NC} Found $CONSOLE_COUNT console.log statements"
    echo "  Run: grep -r 'console\.' --include='*.ts' --include='*.tsx' ./screens ./services ./contexts ./App.tsx"
    ((ERRORS++))
else
    echo -e "${GREEN}✓${NC} No console.log statements found"
fi
echo ""

# Check for TypeScript any types
echo "📝 Checking for 'any' types..."
ANY_COUNT=$(grep -r ": any" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v "node_modules" | wc -l)
if [ "$ANY_COUNT" -gt 10 ]; then
    echo -e "${YELLOW}⚠${NC} Found $ANY_COUNT 'any' type declarations (consider reducing)"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓${NC} Acceptable number of 'any' types ($ANY_COUNT)"
fi
echo ""

# Check for TODO comments
echo "📝 Checking for TODO comments..."
TODO_COUNT=$(grep -r "TODO\|FIXME\|HACK" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v "node_modules" | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC} Found $TODO_COUNT TODO/FIXME/HACK comments"
    echo "  Run: grep -r 'TODO\|FIXME\|HACK' --include='*.ts' --include='*.tsx' ."
    ((WARNINGS++))
else
    echo -e "${GREEN}✓${NC} No TODO comments found"
fi
echo ""

# Check for .env file
echo "📝 Checking environment configuration..."
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠${NC} .env file exists - ensure it's in .gitignore"
    if grep -q ".env" .gitignore 2>/dev/null; then
        echo -e "${GREEN}✓${NC} .env is in .gitignore"
    else
        echo -e "${RED}✗${NC} .env is NOT in .gitignore!"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} No .env file found - create one from ENV_CONFIGURATION.md"
    ((WARNINGS++))
fi
echo ""

# Check TypeScript compilation
echo "📝 Checking TypeScript compilation..."
if command -v tsc &> /dev/null; then
    if tsc --noEmit 2>/dev/null; then
        echo -e "${GREEN}✓${NC} TypeScript compilation successful"
    else
        echo -e "${RED}✗${NC} TypeScript compilation errors"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} TypeScript not found, skipping compilation check"
    ((WARNINGS++))
fi
echo ""

# Check for large files
echo "📝 Checking for large files..."
LARGE_FILES=$(find ./assets -type f -size +1M 2>/dev/null)
if [ -n "$LARGE_FILES" ]; then
    echo -e "${YELLOW}⚠${NC} Found large files (>1MB) in assets:"
    echo "$LARGE_FILES"
    echo "  Consider optimizing images"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓${NC} No large files found in assets"
fi
echo ""

# Check package.json for security vulnerabilities
echo "📝 Checking for security vulnerabilities..."
if command -v npm &> /dev/null; then
    if npm audit --audit-level=high 2>&1 | grep -q "found 0 vulnerabilities"; then
        echo -e "${GREEN}✓${NC} No high-severity vulnerabilities found"
    else
        echo -e "${RED}✗${NC} Security vulnerabilities found"
        echo "  Run: npm audit"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} npm not found, skipping security audit"
    ((WARNINGS++))
fi
echo ""

# Check for proper error boundaries
echo "📝 Checking for ErrorBoundary..."
if [ -f "components/ErrorBoundary.tsx" ]; then
    if grep -q "ErrorBoundary" App.tsx; then
        echo -e "${GREEN}✓${NC} ErrorBoundary exists and is used in App.tsx"
    else
        echo -e "${RED}✗${NC} ErrorBoundary not imported in App.tsx"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} ErrorBoundary.tsx not found"
    ((ERRORS++))
fi
echo ""

# Check for logger utility
echo "📝 Checking for logger utility..."
if [ -f "utils/logger.ts" ]; then
    echo -e "${GREEN}✓${NC} Logger utility exists"
else
    echo -e "${RED}✗${NC} Logger utility not found"
    ((ERRORS++))
fi
echo ""

# Check app.json configuration
echo "📝 Checking app.json configuration..."
if [ -f "app.json" ]; then
    if grep -q '"version"' app.json && grep -q '"bundleIdentifier"' app.json; then
        echo -e "${GREEN}✓${NC} app.json has version and bundleIdentifier"
    else
        echo -e "${YELLOW}⚠${NC} app.json may be missing some configuration"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗${NC} app.json not found"
    ((ERRORS++))
fi
echo ""

# Summary
echo "=============================="
echo "📊 Summary:"
echo ""
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}✗ Found $ERRORS error(s)${NC}"
fi
if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $WARNINGS warning(s)${NC}"
fi
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
fi
echo ""

# Exit with error if there are errors
if [ $ERRORS -gt 0 ]; then
    echo "❌ Please fix the errors before deploying to production"
    exit 1
else
    echo "✅ Ready for production deployment"
    exit 0
fi

