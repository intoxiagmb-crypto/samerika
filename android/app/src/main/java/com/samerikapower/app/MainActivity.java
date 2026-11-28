package com.samerikapower.app;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.*;
import android.widget.*;
import org.json.JSONObject;
import java.io.OutputStream;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private static final String HOME = "https://www.samerikapower.com/";
    private static final int PICK_FILE = 101, SAVE_FILE = 102;
    // Cookie persistence can perform blocking disk I/O. It never owns an Activity.
    private static final ExecutorService COOKIE_IO = Executors.newSingleThreadExecutor();
    private final ExecutorService exportIo = Executors.newSingleThreadExecutor();
    private final Set<WebView> popups = new HashSet<>();
    private WebView web;
    private ProgressBar progress;
    private LinearLayout error;
    private ValueCallback<Uri[]> upload;
    private byte[] pendingSave;
    private boolean exportBusy;
    private boolean rendererGone;
    private String retryUrl = HOME;

    static boolean trusted(String url) {
        if (url == null) return false;
        Uri uri = Uri.parse(url);
        return "https".equalsIgnoreCase(uri.getScheme()) && uri.getUserInfo() == null
            && (uri.getPort() == -1 || uri.getPort() == 443)
            && ("www.samerikapower.com".equalsIgnoreCase(uri.getHost())
                || "samerikapower.com".equalsIgnoreCase(uri.getHost()));
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.WHITE);
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars()
                    | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        } else root.setFitsSystemWindows(true);
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        root.addView(progress, new LinearLayout.LayoutParams(-1, (int)(3 * getResources().getDisplayMetrics().density)));
        FrameLayout content = new FrameLayout(this);
        root.addView(content, new LinearLayout.LayoutParams(-1, 0, 1));
        web = new WebView(this);
        content.addView(web, new FrameLayout.LayoutParams(-1, -1));
        error = new LinearLayout(this);
        error.setOrientation(LinearLayout.VERTICAL);
        error.setGravity(Gravity.CENTER);
        error.setPadding(40, 40, 40, 40);
        error.setBackgroundColor(Color.WHITE);
        TextView message = new TextView(this);
        message.setText("Unable to open Samerika Power\n\nCheck your internet connection and try again.");
        message.setTextSize(18);
        message.setGravity(Gravity.CENTER);
        error.addView(message);
        Button retry = new Button(this);
        retry.setText("Try again");
        retry.setOnClickListener(v -> { if (rendererGone) recreate(); else web.loadUrl(retryUrl); });
        error.addView(retry);
        content.addView(error, new FrameLayout.LayoutParams(-1, -1));
        error.setVisibility(View.GONE);
        setContentView(root);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setUserAgentString(settings.getUserAgentString() + " SamerikaAndroid/1.0");
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return !trusted(request.getUrl().toString());
                return route(request.getUrl().toString());
            }
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap icon) {
                error.setVisibility(View.GONE);
                if (trusted(url)) retryUrl = url;
                progress.setVisibility(View.VISIBLE);
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (view != web || isDestroyed()) return;
                progress.setVisibility(View.GONE);
                flushCookies();
                if (trusted(url)) view.evaluateJavascript(IntegrationSource.SCRIPT, null);
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError failure) {
                if (request.isForMainFrame()) showError();
            }
            @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() && response.getStatusCode() >= 500) showError();
            }
            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                rendererGone = true;
                if (upload != null) { upload.onReceiveValue(null); upload = null; }
                releaseWebView(view);
                web = null;
                showError();
                return true;
            }
            // Keep the platform's default SSL-error cancellation.
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int value) { progress.setProgress(value); }
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (!trusted(view.getUrl())) return false;
                if (upload != null) upload.onReceiveValue(null);
                upload = callback;
                try { startActivityForResult(params.createIntent(), PICK_FILE); }
                catch (ActivityNotFoundException e) { upload.onReceiveValue(null); upload = null; toast("No file picker is available."); }
                return true;
            }
            @Override public boolean onCreateWindow(WebView view, boolean dialog, boolean gesture, android.os.Message message) {
                if (!gesture) return false;
                WebView popup = new WebView(MainActivity.this);
                popups.add(popup);
                popup.setWebViewClient(new WebViewClient() {
                    @Override public boolean shouldOverrideUrlLoading(WebView child, WebResourceRequest request) {
                        String url = request.getUrl().toString();
                        if (!route(url) && web != null) web.loadUrl(url);
                        popups.remove(child);
                        releaseWebView(child);
                        return true;
                    }
                    @Override public boolean onRenderProcessGone(WebView child, RenderProcessGoneDetail detail) {
                        popups.remove(child);
                        releaseWebView(child);
                        return true;
                    }
                });
                popup.setWebChromeClient(new WebChromeClient() {
                    @Override public void onCloseWindow(WebView child) {
                        popups.remove(child);
                        releaseWebView(child);
                    }
                });
                ((WebView.WebViewTransport) message.obj).setWebView(popup);
                message.sendToTarget();
                return true;
            }
            @Override public boolean onJsPrompt(WebView view, String url, String message, String value, JsPromptResult result) {
                if (!trusted(url) || !trusted(view.getUrl())) return false;
                if ("samerika:print".equals(message)) {
                    result.confirm("");
                    view.post(() -> {
                        if (isDestroyed() || view != web) return;
                        ((PrintManager)getSystemService(PRINT_SERVICE)).print("Samerika quotation",
                            view.createPrintDocumentAdapter("Samerika quotation"),
                            new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
                    });
                    return true;
                }
                if ("samerika:save".equals(message)) {
                    result.confirm("");
                    prepareExport(value);
                    return true;
                }
                return false;
            }
        });
        web.setDownloadListener((url, agent, disposition, mime, size) -> download(url, disposition, mime));
        if (Build.VERSION.SDK_INT >= 33) getOnBackInvokedDispatcher().registerOnBackInvokedCallback(0, this::goBack);
        if (state != null && trusted(state.getString("retryUrl"))) retryUrl = state.getString("retryUrl");
        if (state == null || web.restoreState(state) == null) web.loadUrl(retryUrl);
    }

    private static void flushCookies() {
        CookieManager cookies = CookieManager.getInstance();
        COOKIE_IO.execute(cookies::flush);
    }

    private void prepareExport(String value) {
        if (exportBusy) { toast("Finish saving the current export first."); return; }
        if (value == null || value.length() > 12 * 1024 * 1024) { toast("Unable to save this export."); return; }
        exportBusy = true;
        exportIo.execute(() -> {
            try {
                JSONObject data = new JSONObject(value);
                byte[] bytes = Base64.decode(data.getString("data"), Base64.DEFAULT);
                if (bytes.length > 8 * 1024 * 1024) throw new IllegalArgumentException();
                String name = safeName(data.optString("name", "samerika-export.csv"));
                runOnUiThread(() -> {
                    if (isDestroyed() || isFinishing()) return;
                    try {
                        pendingSave = bytes;
                        Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                            .setType("text/csv").putExtra(Intent.EXTRA_TITLE, name);
                        startActivityForResult(save, SAVE_FILE);
                    } catch (Exception e) { pendingSave = null; exportBusy = false; toast("Unable to save this export."); }
                });
            } catch (Exception e) {
                runOnUiThread(() -> { if (!isDestroyed()) { exportBusy = false; toast("Unable to save this export."); } });
            }
        });
    }

    private static void releaseWebView(WebView view) {
        if (view.getParent() instanceof ViewGroup) ((ViewGroup)view.getParent()).removeView(view);
        view.setDownloadListener(null);
        view.setWebChromeClient(null);
        view.setWebViewClient(new WebViewClient());
        view.destroy();
    }

    private boolean route(String url) {
        if (trusted(url)) return false;
        Uri uri = Uri.parse(url);
        String scheme = uri.getScheme();
        if ("https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme)
            || "tel".equalsIgnoreCase(scheme) || "mailto".equalsIgnoreCase(scheme)
            || "whatsapp".equalsIgnoreCase(scheme) || "sms".equalsIgnoreCase(scheme)) {
            try { startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)); }
            catch (ActivityNotFoundException e) { toast("No app is available to open this link."); }
        } else toast("This link cannot be opened in the app.");
        return true;
    }

    private void download(String url, String disposition, String mime) {
        if (!trusted(url)) { toast("Open the website in your browser to download this file."); return; }
        try {
            String name = safeName(URLUtil.guessFileName(url, disposition, mime));
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            String cookie = CookieManager.getInstance().getCookie(url);
            if (cookie != null) request.addRequestHeader("Cookie", cookie);
            request.addRequestHeader("User-Agent", web.getSettings().getUserAgentString());
            request.setTitle(name).setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, System.currentTimeMillis() + "-" + name);
            if (mime != null) request.setMimeType(mime);
            ((DownloadManager)getSystemService(DOWNLOAD_SERVICE)).enqueue(request);
            toast("Download started. Check your Downloads folder.");
        } catch (Exception e) { toast("Download could not start. Please try again."); }
    }

    private static String safeName(String name) {
        String safe = name.replaceAll("[^a-zA-Z0-9._-]", "_");
        return safe.isEmpty() ? "samerika-document" : safe.substring(0, Math.min(120, safe.length()));
    }
    private void showError() { error.setVisibility(View.VISIBLE); progress.setVisibility(View.GONE); }
    private void toast(String message) { Toast.makeText(this, message, Toast.LENGTH_LONG).show(); }
    private void goBack() { if (web != null && web.canGoBack()) web.goBack(); else finish(); }
    @Override public void onBackPressed() { goBack(); }
    @Override protected void onSaveInstanceState(Bundle state) { if (web != null) web.saveState(state); state.putString("retryUrl", retryUrl); super.onSaveInstanceState(state); }
    @Override protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code == PICK_FILE && upload != null) {
            upload.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            upload = null;
        }
        if (code == SAVE_FILE) {
            byte[] bytes = pendingSave;
            pendingSave = null;
            if (result == RESULT_OK && data != null && data.getData() != null && bytes != null) {
                Uri destination = data.getData();
                exportIo.execute(() -> {
                    try (OutputStream out = getContentResolver().openOutputStream(destination)) {
                        if (out == null) throw new java.io.IOException();
                        out.write(bytes);
                        runOnUiThread(() -> { exportBusy = false; if (!isDestroyed()) toast("Export saved."); });
                    } catch (Exception e) { runOnUiThread(() -> { exportBusy = false; if (!isDestroyed()) toast("Export could not be saved."); }); }
                });
            } else exportBusy = false;
        }
    }
    @Override protected void onPause() { flushCookies(); if (web != null) web.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() {
        if (upload != null) { upload.onReceiveValue(null); upload = null; }
        pendingSave = null;
        exportIo.shutdown();
        for (WebView popup : popups) releaseWebView(popup);
        popups.clear();
        if (web != null) { releaseWebView(web); web = null; }
        super.onDestroy();
    }
}
