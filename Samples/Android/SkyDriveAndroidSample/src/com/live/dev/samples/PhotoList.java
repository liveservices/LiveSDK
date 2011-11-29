package com.live.dev.samples;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
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
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.util.Log;

// Retrieves list of photos from SkyDrive and display them on a ListView
public class PhotoList extends ListActivity {
	
	private static final String DEBUG_TAG = "AndroidSampleLog";
	
	private static String apiEndpoint = "https://apis.live.net/v5.0";
	private static String getAlbumPhotosPath = "/photos";

	private static ArrayList<PhotoItem> photoList = null;
	private static PhotoArrayAdapter photoArrayAdapter = null;
	
	private String accessToken = null;
	private String albumId = null;
			
	private Runnable getPhotoImages = null;
	private Runnable getPhotoList = null;
	private int photoPosition = 0;
	
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
		// Unpack input parameters from invoking activity
		Intent sender = getIntent();
		accessToken = sender.getExtras().getString("accessToken");
		albumId = sender.getExtras().getString("albumId");
        
		// Set layout context and get view
        setContentView(R.layout.photolist);
        photoList = new ArrayList<PhotoItem>();
    	photoArrayAdapter = new PhotoArrayAdapter(this, R.layout.photoitem, photoList);
       	setListAdapter(photoArrayAdapter);
        
        // Start thread to retrieve list of Photos	
		getPhotoList = new Runnable(){
            @Override
            public void run() {
            	getPhotoListBegin();
            }
        };
        Thread thread =  new Thread(null, getPhotoList, "getPhotoListBackground");
        thread.start();
    }
    
    public void getPhotoListBegin() {
   	
 		try {
			retrieveAlbumPhotos(accessToken, albumId, photoList);
    	} catch (MalformedURLException e) {
    		Log.e(DEBUG_TAG, "photoist.getPictureList: Malformed URL Exception: " + e.getMessage());
    	} catch (IOException e) {
    		Log.e(DEBUG_TAG, "photoist.getPictureList: IO Exception: " + e.getMessage());
    	} catch (Exception e) {
    		Log.e(DEBUG_TAG, "photoist.getPictureList: Exception: " + e.getMessage());
		}
		runOnUiThread(getPhotoListEnd);
    }
    
    private Runnable getPhotoListEnd = new Runnable() {
    	
         public void run() {
        	 if(photoList != null && photoList.size() > 0){
             	photoArrayAdapter.notifyDataSetChanged();
                 for(int i=0;i<photoList.size();i++)
                 	photoArrayAdapter.add(photoList.get(i));
             }
              photoArrayAdapter.notifyDataSetChanged();
             
             getPhotoImagesLaunch();
             
         }
    };

    // Get image for a photo
    private void getPhotoImagesLaunch()
    {

		if((photoList == null) || (photoList.size() <= photoPosition)) {
			return;
		}
    		
    	getPhotoImages = new Runnable() {
            public void run() {
            	getPhotoImagesBegin(photoList.get(photoPosition).picture);
            }
        };
        
        Thread thread =  new Thread(null, getPhotoImages, "getPhotoImagesBackground");
        thread.start();
	
    }

    public void getPhotoImagesBegin(String url) {
   		
		Bitmap bm = null;

 		try {
 			bm = getPicture(url);
    	} catch (Exception e) {
    		Log.e(DEBUG_TAG, "photoList.getPictureList: Exception: " + e.getMessage());
		}
		
		if (bm != null) {
         	PhotoItem photo = photoList.get(photoPosition);
         	photo.setImage(bm);
		}
		
    	photoPosition++;

		runOnUiThread(getPhotoImagesEnd);
    }
    
    private Runnable getPhotoImagesEnd = new Runnable() {
        public void run() {
    		
         	photoArrayAdapter.notifyDataSetChanged();
            getPhotoImagesLaunch();
            
        }
   };

    
    public void retrieveAlbumPhotos(String pAccessToken, String albumId, ArrayList<PhotoItem> photos) throws MalformedURLException, IOException, JSONException
    {
		
    	String requestUrl = apiEndpoint + "/" + albumId + getAlbumPhotosPath + "?access_token=" + pAccessToken;
    	StringBuilder response = new StringBuilder();
     	URL url = new URL(requestUrl);
    		
    	HttpURLConnection conn = (HttpURLConnection) url.openConnection();
  	
    	if (conn.getResponseCode() == HttpURLConnection.HTTP_OK) {
  
    		BufferedReader input = new BufferedReader(new InputStreamReader(conn.getInputStream()), 8192);
    		String line = null;
    		while ((line = input.readLine()) != null)
    			response.append(line);
    		
    		input.close();
    		
    		processGetAlbumPhotosResponse(response.toString(), photos);
    	}
    	else {
       		Log.v(DEBUG_TAG, "PhotoList.retrieveAlbumPhotos: Album list request failed with code: " + conn.getResponseCode());
    	}

    }
    
    // Process JSON response with list of photos for the album
    public  void processGetAlbumPhotosResponse(String response, ArrayList<PhotoItem> photos) throws JSONException {

    	JSONObject mResponseObject = new JSONObject(response);
    	JSONArray data = mResponseObject.getJSONArray("data");
    	
       	for(int i=0; i < data.length(); i++) {
	   		String id = data.getJSONObject(i).getString("id");
	   		String name = data.getJSONObject(i).getString("name");
	   		String description = data.getJSONObject(i).getString("description");
	   		String whenTaken = data.getJSONObject(i).getString("when_taken");
	   		String picture = data.getJSONObject(i).getString("picture");

	  		PhotoItem pi = new PhotoItem(id, name, description, whenTaken, picture);
	  		photos.add(pi);
    	}
    }
    
    public Bitmap getPicture(String pUrl) 
    {
    	Bitmap bm = null;
    	
    	try {
        	URL url = new URL(pUrl);
           	HttpURLConnection ucon = (HttpURLConnection) url.openConnection();
           	ucon.setDoInput(true);
            InputStream is = ucon.getInputStream();
            bm = BitmapFactory.decodeStream(is);
    	} catch (MalformedURLException e) {
    		Log.e(DEBUG_TAG, "AlbumList.getPicture: Malformed URL Exception: " + e.getMessage());
    	} catch (IOException e) {
    		Log.e(DEBUG_TAG, "AlbumList.getPicture: IO Exception: " + e.getMessage());
    	} catch (Exception e) {
    		Log.e(DEBUG_TAG, "AlbumList.getPicture: Exception: " + e.getMessage());
    	}

        return bm;
    }

}