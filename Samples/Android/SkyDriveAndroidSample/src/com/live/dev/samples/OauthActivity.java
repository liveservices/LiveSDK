package com.live.dev.samples;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.CookieSyncManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;


// Invokes the OAuth flow and returns an access token 
public class OauthActivity extends Activity {
	
	private static final String DEBUG_TAG = "AndroidSampleLog";

	public static String oauthEndPoint= "https://oauth.live.com/authorize";
	public static String oauthResponseType = "token";
	public static String oauthRedirectUri = "https://oauth.live.com/desktop";
	
	public static String accessToken = null;
	public static String oauthUrl = null;

    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
		setContentView(R.layout.browser);
		CookieSyncManager.createInstance(this);
		
		// Unpack client if and list of scopes parameters passed by invoking activity
		Intent sender = getIntent();
		String clientId = sender.getExtras().getString("clientId");
		String scopes= sender.getExtras().getString("scopes");
		
		// Construct consent URL using the client id and scopes passed
		oauthUrl = constructOauthRequestUrl(clientId, scopes);
		
		// Hook-up cancel button
        final Button cancelBtn = (Button) findViewById(R.id.oauthCancelBtn);
        cancelBtn.setOnClickListener(new View.OnClickListener() {		
			public void onClick(View v) {
				finish();
			};
        });		
		
		WebViewClient wvc = new WebViewClient() {

			public void onPageFinished(WebView view, String url) {
				super.onPageFinished(view, url);
				
				if (url.contains("#access_token=")) {
					getAccessToken(url);
				}

				view.requestFocus(View.FOCUS_DOWN);
			};

			public boolean shouldOverrideUrlLoading(WebView view, String url) {
				super.shouldOverrideUrlLoading(view, url);
				
				if (url.contains("#access_token=")) {
					getAccessToken(url);
					return true;
				}
				
				return false;
			};
			
			public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
				Log.v(DEBUG_TAG, "onReceivedError:" + description);
			}
		};

		final WebView wb = (WebView) findViewById(R.id.webView);

		wb.setWebViewClient(wvc);
		wb.clearCache(true);
		CookieManager cookieMgr = CookieManager.getInstance();
		cookieMgr.removeAllCookie();		
		
		WebSettings wbs = wb.getSettings();
		wbs.setJavaScriptEnabled(true);

		// Invoke browser client 
		wb.loadUrl(oauthUrl);
	}
    
    private String constructOauthRequestUrl(String pClientId, String pScopes) {

    	String url = oauthEndPoint + "?" +
    				"client_id=" + pClientId + "&" +
    			    "redirect_uri=" + oauthRedirectUri + "&" +
    				"display=touch" + "&" +
    				"response_type=" + oauthResponseType + "&" +
    			    "scope=" + pScopes;
    				
		return url;
	}

    // Extract access token
	private void getAccessToken(String url) {
    	
     	accessToken = url.substring(url.indexOf("#access_token=") + "#access_token=".length(), url.indexOf("&"));
     	
     	Log.v("WebViewClient.shouldOverrideUrl","Access Token Found: " + accessToken);
     	
     	Intent results = new Intent();
     	results.putExtra("accessToken", accessToken);
     	setResult(RESULT_OK, results);
     	finish();
    }
}