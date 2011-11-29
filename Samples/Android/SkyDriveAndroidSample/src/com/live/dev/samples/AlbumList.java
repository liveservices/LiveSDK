package com.live.dev.samples;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.ListActivity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.ListView;

//Retrieves list of Albums from SkyDrive and display them on a ListView
public class AlbumList extends ListActivity {
	
	private static final String DEBUG_TAG = "AndroidSampleLog";
	private static final int photoListRequestCode = 2;
	
	private static String apiEndpoint = "https://apis.live.net/v5.0";
	private static String getAlbumsPath = "/me/albums";
	private String accessToken = null;

	private static ArrayList<AlbumItem> albumList = null;
	private static AlbumArrayAdapter albumArrayAdapter = null;
	
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
		// Unpack input parameters from invoking activity
		Intent sender = getIntent();
		accessToken = sender.getExtras().getString("accessToken");
        
		// Set layout context and get view
        setContentView(R.layout.albumlist);
        albumList = new ArrayList<AlbumItem>();
    	albumArrayAdapter = new AlbumArrayAdapter(this, R.layout.albumitem, albumList);
        setListAdapter(albumArrayAdapter);
         
		try {
	        // Get user's albums
			retrieveAlbums(accessToken, albumList);
			
			// Add albums to the list and display
            if(albumList != null && albumList.size() > 0){
            	albumArrayAdapter.notifyDataSetChanged();
                for(int i=0;i<albumList.size();i++)
                	albumArrayAdapter.add(albumList.get(i));
            }
            albumArrayAdapter.notifyDataSetChanged();
		} catch (MalformedURLException e) {
			e.printStackTrace();								
		} catch (IOException e) {
			e.printStackTrace();
		} catch (JSONException e) {
			e.printStackTrace();
		}
    }
    
    public void onListItemClick(ListView l, View v, int position, long id) {

    	AlbumItem ai = albumList.get(position);
    	launchAlbumPhotosList(accessToken, ai.id);
     
    }
    
    // Launch activity to display photos inside an album
	public void launchAlbumPhotosList(String pAccessToken, String pAlbumId) {
	
		Intent intent = new Intent(getApplicationContext(), PhotoList.class);

		// Pass access token and albumid
		intent.putExtra("accessToken", pAccessToken);
		intent.putExtra("albumId", pAlbumId);

		// Start photo activity
		startActivityForResult(intent, photoListRequestCode);
	}


	// Retrieve list of albums from SkyDrive 
	public void retrieveAlbums(String pAccessToken, ArrayList<AlbumItem> albums) throws MalformedURLException, IOException, JSONException
    {

		String requestUrl = apiEndpoint + getAlbumsPath + "?access_token=" + pAccessToken;
    	StringBuilder response = new StringBuilder();
     	URL url = new URL(requestUrl);
    		
    	HttpURLConnection conn = (HttpURLConnection) url.openConnection();

    	if (conn.getResponseCode() == HttpURLConnection.HTTP_OK) {
  
    		BufferedReader input = new BufferedReader(new InputStreamReader(conn.getInputStream()), 8192);
    	
    		String line = null;
    		while ((line = input.readLine()) != null)
    			response.append(line);
    		
    		input.close();
    		
    		processGetAlbumResponse(response.toString(), albums);
    	}
    	else {
       		Log.v(DEBUG_TAG, "AlbumList.retrieveAlbums: Album list request failedwith code: " + conn.getResponseCode());
    	}
    }
    
 // Parse JSON response and extract album information
	public  void processGetAlbumResponse(String response, ArrayList<AlbumItem>   albums) throws JSONException {
 
		// Access data collection
    	JSONObject mResponseObject = new JSONObject(response);
    	JSONArray data = mResponseObject.getJSONArray("data");
    	
    	// Process album collection
       	for(int i=0; i < data.length(); i++) {
       		
       		// Extract data points for an album
	   		String id = data.getJSONObject(i).getString("id");
	   		String name = data.getJSONObject(i).getString("name");
	   		int count = data.getJSONObject(i).getInt("count");

	   		// Ignore empty albums
       		if (count == 0) { 
       			continue;
       		}
       		
       		// Add to the album list
	  		AlbumItem ai = new AlbumItem(id, count, name);
	  		albums.add(ai);
    	}
    }
 }