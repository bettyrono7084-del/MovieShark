# MovieShark Mobile (WebView Edition)

This is a professional Android/iOS wrapper for the MovieShark website, built using React Native and Expo. It turns your web application into a native mobile app experience.

## Key Features

- 🌐 **Full Web Integration**: Loads the MovieShark website within a native container.
- 🔙 **Android Back Button Support**: Navigates through browser history instead of closing the app.
- 🔄 **Pull-to-Refresh**: Swipe down to refresh the page.
- ⌛[index.js](index.js) **Native Loading Spinner**: Shows an activity indicator while the web content loads.
- 🛡️ **Safe Area Support**: Automatically handles status bars and notches.

## Setup Instructions

1. **Install Dependencies**:
   Navigate to the mobile directory and install the corrected packages:
   ```bash
   cd mobile
   npm install
   ```

2. **Configure URL**:
   The app is currently set to `https://web-production-0a9fe.up.railway.app/`. 
   To change this, edit the `SERVER_URL` constant at the top of `App.js`.

3. **Start Development**:
   ```bash
   npx expo start
   ```
   Scan the QR code with the **Expo Go** app on your phone.

## Production Build (APK)

To build a standalone Android app:

1. Install EAS CLI: `npm install -g eas-cli`
2. Run the build command:
   ```bash
   eas build --platform android --profile preview
   ```

## Troubleshooting

- **Connection Refused**: If testing locally, ensure you use your computer's IP (e.g., `192.168.x.x`) rather than `localhost`.
- **Version Errors**: I have corrected `package.json` to use Expo SDK 50, which is compatible with your environment.
