package com.live.dev.samples;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;

public class SkyDriveAndroidSample extends Activity {
	
	private static final String DEBUG_TAG = "AndroidSampleLog";
	
	// Application's OAuth parameters 
	private static final String clientId = "000000004807236B";
	private static final String scopes ="wl.basic, wl.photos";
	
	private static final int oauthRequestCode = 1;
	
	private static String accessToken = null;

    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        setContentView(R.layout.main);
		Log.i(DEBUG_TAG, "WebViewTestActivity:onCreate.");
		setTheme(android.R.style.Theme_Light);
        
        final Button launchBtn = (Button) findViewById(R.id.launchBtn);
 
        launchBtn.setOnClickListener(new View.OnClickListener() {
			
			public void onClick(View v) {
				Log.i(DEBUG_TAG, "SignIn button clicked.");
			
				launchOauth(clientId, scopes);
				
			};
        });
    }
   
    public void onActivityResult(int pRequestCode, int pResultCode, Intent data) {
    	super.onActivityResult(pRequestCode, pResultCode, data);
    	
    	switch (pRequestCode) {
	    	case oauthRequestCode:
	        	if (pResultCode != RESULT_OK) {
		    		Log.e(DEBUG_TAG, "Consent request error.");
	        		return;
	        	}
	        	
	        	accessToken = data.getStringExtra("accessToken");
	    		Log.i(DEBUG_TAG, "Received access token.");

	    		// Received access token,load photo albums...
	    		launchAlbumList(accessToken);
	    		break;
    	}
    }
    
	public void launchOauth(String pClientId, String pScopes) {
		
		Log.i(DEBUG_TAG, "Starting OAuth activity.");

		Intent oauthIntent = new Intent(getApplicationContext(), OauthActivity.class);
		oauthIntent.putExtra("clientId", pClientId);
		oauthIntent.putExtra("scopes", pScopes);

		startActivityForResult(oauthIntent, oauthRequestCode);
    }
	
	public void launchAlbumList(String pAccessToken) {
		Log.i(DEBUG_TAG, "Starting AlbumList activity.");

		Intent intent = new Intent(getApplicationContext(), AlbumList.class);
		intent.putExtra("accessToken", pAccessToken);

		startActivityForResult(intent, oauthRequestCode);
	}
	
	public void onResume() {
		super.onResume();
		Log.i(DEBUG_TAG, "Main.onResume");
	}
	
	public void onRestart() {
		super.onRestart();
		Log.i(DEBUG_TAG, "Main.onRestart");
	}
	
	public void onStop() {
		super.onStop();
		Log.i(DEBUG_TAG, "Main.onStop");
	}
	
	public void onRStart() {
		super.onStart();
		Log.i(DEBUG_TAG, "Main.onStart");
	}

}
