package com.live.dev.samples;

import java.util.ArrayList;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.TextView;

public class PhotoArrayAdapter extends ArrayAdapter<PhotoItem> {
	
	private Context mContext;
  	private ArrayList<PhotoItem> photoItems = null;
	
	public PhotoArrayAdapter(Context c, int textViewResourceId, ArrayList<PhotoItem> items) {
		super(c, textViewResourceId);
		mContext = c;
		photoItems = items;
	}
	
	public int getCount() {
		return photoItems.size();
	}

	public PhotoItem getItem(int position) {
		return photoItems.get(position);
	}

	public long getItemId(int position) {
		return position;
	}

	public int getItemViewType(int position) {
		return 0;
	}
	
	public View getView(int position, View convertView, ViewGroup parent) {

        View v = convertView;
        if (v == null) {
            LayoutInflater vi = (LayoutInflater) mContext.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
             v = vi.inflate(R.layout.photoitem, parent, false);
        }
        PhotoItem pi = photoItems.get(position);
        if (pi != null) {
            TextView tt = (TextView) v.findViewById(R.id.firstLine);
            TextView bt = (TextView) v.findViewById(R.id.secondLine);
             if (tt != null) {
                  tt.setText(pi.name); 
            }
            if(bt != null){
                  bt.setText(pi.description);
            }
            if (pi.image != null) {
        		ImageView icon = (ImageView) v.findViewById(R.id.icon);
        		icon.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        		icon.setImageBitmap(pi.image);
             }
        }
 
		return v;
	}
}