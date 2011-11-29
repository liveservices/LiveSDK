package com.live.dev.samples;

import android.graphics.Bitmap;


public class PhotoItem {
	public String id = null;
	public String name = null;
	public String description = null;
	public String whenTaken = null;
	public String picture = null;
	public Bitmap image = null;
	
	public PhotoItem(String pId, String pName, String pDescription, String pWhenTaken, String pPicture) {
		id = pId;
		name = pName;
		description = pDescription;
		whenTaken = pWhenTaken;
		picture = pPicture;
	}
	
	public void setImage(Bitmap bm) {
		image = bm;
	}
	
	public Bitmap getImage() {
		return image;
	}
}
