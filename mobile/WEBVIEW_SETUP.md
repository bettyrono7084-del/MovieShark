# MovieShark WebView App Setup

Your mobile app is now configured as a WebView that wraps your website in a native Android app container.

## Configuration

### 1. Update Server URL

In [App.js](App.js#L8), update the `SERVER_URL` constant:

```javascript
// For local development (replace with your machine IP):
const SERVER_URL = 'http://192.168.1.100:3000';

// For production:
const SERVER_URL = 'https://your-deployed-site.com';
```

To find your local IP address:
- **Windows**: Open Command Prompt and run `ipconfig`, look for "IPv4 Address"
- **Mac/Linux**: Run `ifconfig` in terminal

### 2. Install Dependencies

```bash
cd mobile
npm install
# or
yarn install
```

## Running the App

### Development Mode

```bash
# Start Expo development server
npm start

# Run on Android (requires Android Studio or Android emulator)
npm run android

# Or scan the QR code with Expo Go app on your device
```

### Building APK (Android App)

To create a standalone Android app:

```bash
# Build APK
eas build --platform android --local

# Or use Expo CLI
expo build:android
```

## Features Included

✅ WebView loads your entire website  
✅ Goes back/forward gesture support  
✅ JavaScript enabled  
✅ Local storage support  
✅ Network error handling  
✅ Cleartext HTTP support for localhost  
✅ Professional error logging  

## Network Setup

**For Testing Locally:**

The app needs to access your backend server. Make sure:

1. Your backend is running on a network-accessible IP (not just `localhost`)
2. The IP address and port are publicly accessible from your phone/emulator
3. If using an Android emulator, use `10.0.2.2` instead of `localhost` to access host machine

Example:
- Backend running on: `http://192.168.1.100:3000`
- Update `Server_URL` in App.js to this address

**For Production:**

Point to your deployed domain/URL:
```javascript
const SERVER_URL = 'https://movieshark.yoursite.com';
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Blank screen | Check that SERVER_URL is correct and backend is running |
| Cannot connect to localhost | Use your machine's IP address instead of localhost |
| HTTPS errors | Ensure SSL certificate is valid, or use HTTP for development |
| WebView not loading | Check browser console for errors, ensure JavaScript is enabled in WebView |

## Environment Variables

You can also set the server URL via environment variable:

```bash
# In terminal before running
export SERVER_URL=http://192.168.1.100:3000
npm start
```

## Next Steps

1. Start your backend server: `npm start` (from backend/ folder)
2. Update the `SERVER_URL` in App.js to your server's address
3. Install dependencies: `npm install`
4. Run the app: `npm run android`
