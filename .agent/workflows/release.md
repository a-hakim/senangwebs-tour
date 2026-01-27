---
description: How to release a new version of the library
---

# Release Workflow

This workflow outlines the steps to release a new version of SenangWebs Tour.

## 1. Update Version

Update the version number in `package.json`.

```bash
npm version patch # or minor, major
```

## 2. Build Production Bundles

Ensure the distribution files are up-to-date with the new version.

// turbo
```bash
npm run build
```

## 3. Commit and Tag

Commit the changes and create a git tag.

```bash
git add package.json dist/
git commit -m "chore: release v<VERSION>"
git tag v<VERSION>
```

## 4. Push to Repository

Push the commit and tags to the remote repository.

```bash
git push origin master --tags
```

## 5. Publish (Optional)

If publishing to npm or another registry:

```bash
npm publish
```
