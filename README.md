# DevTools Project

## Development

To start the development server:

```bash
npm start
```

## Building

To build the project for production:

```bash
npm run build
```

This will create a `dist` directory with all the compiled assets.

## Deployment

To deploy to Firebase Hosting:

```bash
npm run deploy
```

This will build the project and deploy it to Firebase Hosting.

### First-time setup

If you haven't set up Firebase Hosting yet:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize your project: `firebase init hosting`
4. During initialization, specify `dist` as your public directory

## Project Structure

- `/js` - JavaScript source files
- `/css` - CSS stylesheets
- `/img` - Image assets
- `/dist` - Build output (generated on build)
