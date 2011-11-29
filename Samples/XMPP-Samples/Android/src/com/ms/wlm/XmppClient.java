package com.ms.wlm;

import org.jivesoftware.smack.ConnectionConfiguration;
import org.jivesoftware.smack.PacketListener;
import org.jivesoftware.smack.Roster;
import org.jivesoftware.smack.SASLAuthentication;
import org.jivesoftware.smack.XMPPConnection;
import org.jivesoftware.smack.XMPPException;
import org.jivesoftware.smack.filter.MessageTypeFilter;
import org.jivesoftware.smack.filter.PacketFilter;
import org.jivesoftware.smack.filter.PacketTypeFilter;
import org.jivesoftware.smack.packet.Message;
import org.jivesoftware.smack.packet.Packet;
import org.jivesoftware.smack.packet.Presence;
import org.jivesoftware.smack.util.StringUtils;
import android.util.Log;

/**
 * XmppClient class has all the XMPP specific logic. This class uses asmack
 * library to connect to windows live messenger service. For Windows Live Xmpp
 * documentation see <link>
 */
public class XmppClient {

	public static final String Host = "xmpp.messenger.live.com";
	public static final int Port = 5222;
	public static final String Service = "messenger.live.com";

	private WLMActivity activity;
	private String accessToken;
	private XMPPConnection connection;

	/**
	 * This block initializes asmack with SASL mechanism used by Windows Live.
	 */
	static {
		SASLAuthentication.registerSASLMechanism("X-MESSENGER-OAUTH2",
				XMessengerOAuth2.class);
		SASLAuthentication.supportSASLMechanism("X-MESSENGER-OAUTH2");
	}

	/**
	 * Constructor
	 * 
	 * @param accessToken
	 *            The OAuth2.0 access token to be used for login.
	 * @param activity
	 *            The Activity class for Renderng UI updates.
	 */
	public XmppClient(String accessToken, WLMActivity activity) {
		this.accessToken = accessToken;
		this.activity = activity;
	}

	/**
	 * Get the Roster for this client instance.
	 * 
	 * @return The full Roster for the client.
	 */
	public Roster getRoster() {
		return this.connection.getRoster();
	}

	/**
	 * Get the Jid for this client instance.
	 */
	public String getLocalJid() {
		return StringUtils.parseBareAddress(this.connection.getUser());
	}

	/**
	 * Log in the client to the messenger service.
	 */
	public void logIn() {

		// Create a connection. We use service name in config and asmack will do
		// SRV look up to locate the xmpp server.
		ConnectionConfiguration connConfig = new ConnectionConfiguration(
				XmppClient.Service);
		connConfig.setRosterLoadedAtLogin(true);
		this.connection = new XMPPConnection(connConfig);

		try {
			this.connection.connect();

			// We do not need user name in this case.
			this.connection.login("", this.accessToken);
		} catch (XMPPException ex) {
			Log.e("WLM", ex.toString());
			this.connection = null;
			return;
		}

		// set the message and presence handlers
		this.setPacketFilters();

		// This will set up the roster detail
		this.activity.logInComplete();

		// Set the status to available
		Presence presence = new Presence(Presence.Type.available);
		this.connection.sendPacket(presence);
	}

	/**
	 * Send a text message to the buddy
	 * 
	 * @param to
	 *            The Buddy Jid
	 * @param text
	 *            The text message to be sent
	 */
	public void sendMessage(String to, String text) {
		Message msg = new Message(to, Message.Type.chat);
		msg.setBody(text);
		this.connection.sendPacket(msg);
	}

	/**
	 * Set the packet filters for handling incoming stanzas.
	 */
	private void setPacketFilters() {
		if (this.connection != null) {
			PacketFilter presenceFilter = new PacketTypeFilter(Presence.class);
			this.connection.addPacketListener(new PacketListener() {
				public void processPacket(Packet packet) {
					Presence presence = (Presence) packet;
					activity.handlePresenceReceived(presence);
				}
			}, presenceFilter);

			PacketFilter messageFilter = new MessageTypeFilter(
					Message.Type.chat);
			this.connection.addPacketListener(new PacketListener() {
				public void processPacket(Packet packet) {
					Message message = (Message) packet;
					if (message.getBody() != null) {
						activity.handleMessageReceived(message);
					}
				}
			}, messageFilter);
		}
	}
}
