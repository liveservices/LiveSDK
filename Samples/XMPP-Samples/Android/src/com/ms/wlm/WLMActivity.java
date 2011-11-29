package com.ms.wlm;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ListView;

import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.HashMap;

import org.jivesoftware.smack.Roster;
import org.jivesoftware.smack.RosterEntry;
import org.jivesoftware.smack.packet.Message;
import org.jivesoftware.smack.packet.Presence;
import org.jivesoftware.smack.packet.Presence.Type;
import org.jivesoftware.smack.packet.RosterPacket.ItemType;
import org.jivesoftware.smack.util.StringUtils;

/**
 * The main activity class.
 * 
 */
public class WLMActivity extends Activity {

	public static final String OAuthAppClientId = "0000000048058C2E";
	public static final String OAuthAppRedirectUri = "http://xmpp.msgr-tst.com/desktop";

	private WebView mAppWebView;
	private ListView mContacts;
	private ListView mChat;
	private EditText mSendText;

	private XmppClient client;
	private String activeConversationBuddyJid;

	private ArrayList<String> messages = new ArrayList<String>();

	private ArrayList<String> contactNames = new ArrayList<String>();
	private ArrayList<String> contactJids = new ArrayList<String>();
	private int lastOnlineContactIndex = -1;

	public Handler mHandler = new Handler();

	/** Called when the activity is first created. */
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.main);

		mAppWebView = (WebView) this.findViewById(R.id.loginView);
		mAppWebView.getSettings().setJavaScriptEnabled(true);
		mAppWebView.setWebViewClient(new MyWebViewClient(this));

		// Load the OAuth page.
		// scope = wl.messenger for logging in to Windows Live Messenger
		// service.
		mAppWebView
				.loadUrl(String
						.format("https://oauth.live.com/authorize?client_id=%s&scope=wl.messenger&response_type=token&display=touch&redirect_uri=%s",
								OAuthAppClientId, OAuthAppRedirectUri));
	}

	/**
	 * Handle the message stanza received by the xmpp client. This function adds
	 * the message to the messages collection and triggers UI update for chat
	 * list.
	 * 
	 * @param message
	 *            The received message stanza.
	 */
	public void handleMessageReceived(Message message) {
		try {
			String fromName = StringUtils.parseBareAddress(message.getFrom());

			Roster roster = this.client.getRoster();
			RosterEntry entry = roster.getEntry(fromName);

			if (entry == null) {
				return;
			}

			synchronized (this.messages) {
				this.messages.add(entry.getName() + ": " + message.getBody());
				this.activeConversationBuddyJid = StringUtils
						.parseBareAddress(message.getFrom());
			}
		} catch (Exception e) {
			Log.e("WLM", e.toString());
		}

		mHandler.post(new Runnable() {
			public void run() {
				updateChatList();
			}
		});
	}

	/**
	 * Handle the presence stanza received by the xmpp client. This function
	 * applies the presence update to the contcat list. And then triggers UI
	 * update to reflect updated presence of the buddy.
	 * 
	 * @param presence
	 *            The received presence stanza.
	 */
	public void handlePresenceReceived(Presence presence) {
		try {
			String fromJid = StringUtils.parseBareAddress(presence.getFrom());

			if (fromJid.equalsIgnoreCase(this.client.getLocalJid())) {
				return;
			}

			boolean available = false;
			if (presence.getType() == Type.unavailable) {
			} else if (presence.isAvailable() || presence.isAway()) {
				available = true;
			} else {
				return;
			}

			Roster roster = this.client.getRoster();
			RosterEntry entry = roster.getEntry(fromJid);
			if (entry == null) {
				return;
			}

			synchronized (this.contactJids) {
				int onlineContactIndex = -1;
				if (this.lastOnlineContactIndex >= 0) {
					for (int j = 0; j <= this.lastOnlineContactIndex; j++) {
						if (this.contactJids.get(j).equalsIgnoreCase(fromJid)) {
							onlineContactIndex = j;
							break;
						}
					}
				}

				if (available == true) {
					// online to online - Ignore
					if (onlineContactIndex >= 0) {
						return;
					} else {
						// offline to online - Move new online contact to front
						// and increment online contact index.
						int offlineContactIndex = -1;
						for (int j = this.lastOnlineContactIndex + 1; j < this.contactJids
								.size(); j++) {
							if (this.contactJids.get(j).equalsIgnoreCase(
									fromJid)) {
								offlineContactIndex = j;
								break;
							}
						}

						if (offlineContactIndex >= 0) {
							String jid = this.contactJids
									.remove(offlineContactIndex);
							String name = this.contactNames
									.remove(offlineContactIndex);
							this.contactJids.add(0, jid);
							this.contactNames.add(0, name);
							this.lastOnlineContactIndex++;
						}
					}
				} else {
					// online to offline - Move new offline contact to end and
					// decrement online contact index.
					if (onlineContactIndex >= 0) {
						String jid = this.contactJids
								.remove(onlineContactIndex);
						String name = this.contactNames
								.remove(onlineContactIndex);
						this.contactJids.add(jid);
						this.contactNames.add(name);
						this.lastOnlineContactIndex--;
					} else {
						// offline to offline - Ignore
						return;
					}
				}
			}
		} catch (Exception e) {
			Log.e("WLM", e.toString());
		}

		mHandler.post(new Runnable() {
			public void run() {
				updateContactList();
			}
		});
	}

	/**
	 * This function is used to Notify the activity that login operation is
	 * complete. This function triggers an update in UI to populate the full
	 * contact list.
	 */
	public void logInComplete() {
		synchronized (this.contactJids) {
			Roster roster = this.client.getRoster();
			for (RosterEntry entry : roster.getEntries()) {
				if (entry.getType() == ItemType.to
						|| entry.getType() == ItemType.both) {
					this.contactJids.add(entry.getUser());
					this.contactNames.add(entry.getName());
				}
			}
		}

		mHandler.post(new Runnable() {
			public void run() {
				updateContactList();
			}
		});
	}

	/**
	 * Apply the contact list data to the contact list in UI.
	 */
	private void updateContactList() {
		try {
			synchronized (this.contactJids) {
				MyListAdapter adapter = new MyListAdapter();
				mContacts.setAdapter(adapter);
			}
		} catch (Exception e) {
			Log.e("WLM", e.toString());
		}
	}

	/**
	 * Apply the new messages appended to the contact list in UI.
	 */
	private void updateChatList() {
		try {
			synchronized (this.messages) {
				ArrayAdapter<String> adapter = new ArrayAdapter<String>(this,
						R.layout.list_item, R.id.textEntry, this.messages);
				mChat.setAdapter(adapter);
			}
		} catch (Exception e) {
			Log.e("WLM", e.toString());
		}
	}

	/**
	 * This function is invoked after OAuth2.0 token has been fetched and xmpp
	 * login needs to be initated.
	 * 
	 * @param accessToken
	 *            The OAuth2.0 access token with permissions for wl.messenger
	 *            scope.
	 */
	private void setupClient(String accessToken) {
		if (this.client == null) {
			this.client = new XmppClient(accessToken, this);
			initClientView();
			
			// Need to call log in on different thread as it does blocking newtork calls.
			// And android kills the app if main thread is used for long calls.
			new Thread(new Runnable() {
				public void run() {
					client.logIn();
				}
			}).start();
		}
	}

	/**
	 * Set up the Client view and LogIn the xmpp client instance to the service.
	 */
	private void initClientView() {
		setContentView(R.layout.client);

		this.mContacts = (ListView) this.findViewById(R.id.contactListView1);
		this.mContacts.setTextFilterEnabled(true);
		this.mContacts.setOnItemClickListener(new OnItemClickListener() {
			public void onItemClick(AdapterView<?> parent, View view,
					int position, long id) {
				synchronized (messages) {
					activeConversationBuddyJid = contactJids.get((int) id);
					messages.clear();
					updateChatList();
				}
			}
		});

		this.mChat = (ListView) this.findViewById(R.id.chatView2);
		this.mChat.setTextFilterEnabled(true);

		this.mSendText = (EditText) this.findViewById(R.id.sendText);

		// Set a listener to send a chat text message
		Button send = (Button) this.findViewById(R.id.send);
		send.setOnClickListener(new View.OnClickListener() {
			public void onClick(View view) {
				String text = mSendText.getText().toString();
				if (text.length() > 0) {
					client.sendMessage(activeConversationBuddyJid, text);
					mSendText.setText("");
					synchronized (messages) {
						messages.add("Me: " + text);
					}

					updateChatList();
				}
			}
		});
	}

	/**
	 * This WebViewClient is a helper to grab the OAuth2.0 access token and once
	 * token in available it triggers the XMPP login operation.
	 * 
	 */
	private class MyWebViewClient extends WebViewClient {
		private WLMActivity activity;

		public MyWebViewClient(WLMActivity act) {
			super();
			this.activity = act;
		}

		@Override
		public void onPageFinished(WebView webView, String url) {
			Log.i("onPageFinished", "Page - " + url);
			super.onPageFinished(webView, url);

			// Trap each url until we land to redirect uri.
			// http://xmpp.msgr-tst.com/desktop#
			// access_token=URL encoded Access token to be used for Xmpp Login
			// &token_type=bearer&
			// &authentication_token=xyz
			// &expires_in=3600
			// &scope=wl.messenger
			if (url.startsWith(OAuthAppRedirectUri + "#")) {
				HashMap<String, String> processedFragments = new HashMap<String, String>();
				String fragment = url.substring(OAuthAppRedirectUri.length());
				if (fragment.charAt(0) == '#') {
					fragment = fragment.substring(1);
				} else {
					return;
				}

				String[] fragmentParams = fragment.split("&");
				for (int i = 0; i < fragmentParams.length; i++) {
					String[] keyValue = fragmentParams[i].split("=");

					if (keyValue.length == 2) {
						processedFragments.put(keyValue[0],
								URLDecoder.decode(keyValue[1]));
					}
				}

				// The access_token
				if (processedFragments.containsKey("access_token")) {
					this.activity.setupClient(processedFragments
							.get("access_token"));
				}
			}
		}
	}

	/**
	 * List adaptor class that combines the Presence and Buddy name to be
	 * displayed in the Contact List.
	 * 
	 */
	private class MyListAdapter extends ArrayAdapter<String> {
		MyListAdapter() {
			super(WLMActivity.this, R.layout.list_item_presence,
					R.id.presEntry, WLMActivity.this.contactNames);
		}

		public View getView(int position, View convertView, ViewGroup parent) {
			View row = super.getView(position, convertView, parent);
			ImageView icon = (ImageView) row.findViewById(R.id.pres);

			// All the online contacts are marked with online image.
			if (position <= WLMActivity.this.lastOnlineContactIndex) {
				icon.setImageResource(R.drawable.online);
			} else {
				icon.setImageResource(R.drawable.offline);
			}
			return (row);
		}
	}
}