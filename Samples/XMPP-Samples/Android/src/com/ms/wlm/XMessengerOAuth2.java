package com.ms.wlm;

import java.io.IOException;

import org.jivesoftware.smack.SASLAuthentication;
import org.jivesoftware.smack.XMPPException;
import org.jivesoftware.smack.sasl.SASLMechanism;
/**
 * Implementation of the X-MESSENGER-OAUTH2 mechanism
 *	This mechanism is used for SASL authentication with Windows Live Messenger
 *	service. The OAuth2.0 access token is passed as is for authentication.
 *	For more information on Windows Live OAuth2.0 see <link>
 * 
 */
public class XMessengerOAuth2 extends SASLMechanism {

	public XMessengerOAuth2(SASLAuthentication saslAuthentication) {
		super(saslAuthentication);
	}

	protected String getName() {
		return "X-MESSENGER-OAUTH2";
	}

	protected void authenticate() throws IOException, XMPPException {
		try {
			// Just return the oauth access token
			String authenticationText = this.password;
			getSASLAuthentication().send(
					new AuthMechanism(getName(), authenticationText));
		} catch (Exception e) {
			throw new XMPPException("SASL authentication failed", e);
		}
	}
}
