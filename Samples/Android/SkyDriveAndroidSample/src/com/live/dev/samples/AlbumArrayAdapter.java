package com.live.dev.samples;

import java.util.ArrayList;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

public class AlbumArrayAdapter extends ArrayAdapter<AlbumItem> {
	
	private Context mContext;
  	private ArrayList<AlbumItem> albumItems = null;
	
	public AlbumArrayAdapter(Context c, int textViewResourceId, ArrayList<AlbumItem> items) {
		super(c, textViewResourceId);
		mContext = c;
		albumItems = items;
	}
	
	public int getCount() {
		return albumItems.size();
	}

	public AlbumItem getItem(int position) {
		return albumItems.get(position);
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
             v = vi.inflate(R.layout.albumitem, parent, false);
        }
        AlbumItem ai = albumItems.get(position);
        if (ai != null) {
                TextView tt = (TextView) v.findViewById(R.id.firstLine);
                TextView bt = (TextView) v.findViewById(R.id.secondLine);
                 if (tt != null) {
                      tt.setText(ai.name); 
                }
                if(bt != null){
                      bt.setText(ai.count + " items");
                }
        }
 
		return v;
	}
}

