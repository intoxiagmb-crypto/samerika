# Samerika Power Android app

Installable Android shell for https://www.samerikapower.com/. Requires Android 10 or newer and an internet connection. The existing hosted website supplies the pages, login, database and document storage; no server secrets or business records are bundled into the APK. Website deployments appear automatically in the app.

Build from the repository root:

```sh
python3 android/build.py
```

The build uses JDK 17, Android SDK platform 36 and build-tools 36.0.0. Set `JAVA_HOME` and `ANDROID_HOME` if they differ from the existing Homebrew installation. It uses the SDK tools directly, without Gradle or downloaded dependencies. Output: `outputs/android/Samerika-Power.apk` and its SHA-256 checksum.

The first build creates a release signing key in ignored `android/.signing/`. Securely back up that directory, including its password file: future updates require the same key. Never commit or distribute it with the APK. Increment the manifest versionCode for updates. This is a signed, non-debuggable APK for direct installation; Play Store submission is a separate workflow.

Transfer the APK to an Android device, open it and allow installation from the app used to open the file when Android prompts. Launch **Samerika Power**. Internet access is the only manifest permission; uploads use the Android file picker and CSV exports use the system save dialog. Session cookies stay in the app's WebView and are excluded from Android backups. External links open in their corresponding apps/browser. Only the HTTPS apex/www company domains stay inside the app; certificate failures are not bypassed.

Includes Android Back, loading/error/retry UI, keyboard/system-bar insets, document uploads, authenticated downloads, new-tab links, A4 system printing and CSV exports up to 8 MB. PDFs download to the device rather than requiring the WebView to render them. Capture a photo using the camera app first, then select it through the file picker. There are no offline business operations or push notifications.

Before distribution, test on an Android device: home/enquiry, company/staff/partner login, Back, keyboard/form layout, upload a PDF/image, download a private document, print a quotation, save a CSV, open WhatsApp, and turn network off/on to check Retry. Use a test account for actions that create records. Compilation and signature checks do not replace these device checks.

Android references: [WebView](https://developer.android.com/develop/ui/views/layout/webapps/webview), [command-line packaging and signing](https://developer.android.com/build/building-cmdline), [signature verification](https://developer.android.com/tools/apksigner).
