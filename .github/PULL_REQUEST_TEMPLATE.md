# Pull Request

## 📋 Description

<!-- Provide a brief description of the changes in this PR -->

## 🔗 Related Issues

<!-- Link to any related issues -->

Fixes #(issue number) Closes #(issue number) Related to #(issue number)

## 📦 Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as
      expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🧪 Test improvements
- [ ] 🔨 Build/CI changes
- [ ] 🎨 Style changes (formatting, etc.)

## 🧪 Testing

<!-- Describe the tests you ran and how to reproduce them -->

### Test Coverage

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

### Test Results

```bash
# Paste test results here
npm test
```

## 📸 Screenshots/Videos

<!-- If applicable, add screenshots or videos to help explain your changes -->

## 🔍 Code Quality Checklist

<!-- Mark completed items with an "x" -->

### General

- [ ] Code follows the project's coding standards
- [ ] Self-review of code completed
- [ ] Code is properly commented
- [ ] No console.log statements left in production code
- [ ] No TODO comments left without corresponding issues

### Testing

- [ ] All existing tests pass
- [ ] New tests cover the changes
- [ ] Test coverage meets the 90% threshold
- [ ] Edge cases are tested
- [ ] Error handling is tested

### Documentation

- [ ] README updated (if applicable)
- [ ] API documentation updated (if applicable)
- [ ] Inline code comments added for complex logic
- [ ] CHANGELOG updated (if applicable)

### Performance

- [ ] No performance regressions introduced
- [ ] Bundle size impact assessed
- [ ] Memory usage considered
- [ ] Network requests optimized (if applicable)

### Security

- [ ] No sensitive information exposed
- [ ] Input validation implemented
- [ ] Security best practices followed
- [ ] Dependencies are secure

## 🚀 Deployment Checklist

<!-- For releases and significant changes -->

- [ ] Database migrations (if applicable)
- [ ] Environment variables updated (if applicable)
- [ ] Deployment scripts updated (if applicable)
- [ ] Rollback plan documented (if applicable)

## 📋 Package-Specific Checklist

### Client Library (@kansnpms/console-log-pipe-client)

- [ ] Browser compatibility tested
- [ ] Bundle size impact assessed
- [ ] TypeScript definitions updated
- [ ] CDN build tested

### CLI Tool (console-log-pipe)

- [ ] Command-line interface tested
- [ ] Help documentation updated
- [ ] Cross-platform compatibility verified
- [ ] Binary builds tested (if applicable)

### Server (@kansnpms/console-log-pipe-server)

- [ ] API endpoints tested
- [ ] Database changes tested
- [ ] Performance impact assessed
- [ ] Security implications reviewed

### Desktop App (@kansnpms/console-log-pipe-desktop)

- [ ] Electron app tested
- [ ] Platform-specific features tested
- [ ] Auto-updater compatibility verified
- [ ] UI/UX changes reviewed

### Browser Extensions

- [ ] Extension manifest updated
- [ ] Store compliance verified
- [ ] Cross-browser compatibility tested
- [ ] Permissions justified

## 🔄 Breaking Changes

<!-- If this is a breaking change, describe the impact and migration path -->

### What breaks?

<!-- Describe what existing functionality will break -->

### Migration Guide

<!-- Provide step-by-step instructions for users to migrate -->

```javascript
// Before
oldAPI.method();

// After
newAPI.method();
```

## 📝 Additional Notes

<!-- Any additional information that reviewers should know -->

## 🏷️ Labels

<!-- Suggest appropriate labels for this PR -->

Suggested labels: `bug`, `enhancement`, `documentation`, `breaking-change`, `needs-review`

---

## 👥 Reviewer Guidelines

### For Reviewers

- [ ] Code logic is sound and follows best practices
- [ ] Tests are comprehensive and pass
- [ ] Documentation is clear and complete
- [ ] Performance impact is acceptable
- [ ] Security implications are considered
- [ ] Breaking changes are properly documented

### Review Focus Areas

- **Functionality**: Does the code do what it's supposed to do?
- **Performance**: Are there any performance implications?
- **Security**: Are there any security vulnerabilities?
- **Maintainability**: Is the code easy to understand and maintain?
- **Testing**: Are the tests comprehensive and reliable?

---

**Thank you for contributing to Console Log Pipe! 🎉**
