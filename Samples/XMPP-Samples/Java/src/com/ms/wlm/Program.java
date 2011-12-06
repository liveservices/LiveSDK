package com.ms.wlm;

import java.net.URL;
import java.net.URLDecoder;

import javax.swing.JOptionPane;

public class Program {


	
	public static void main(String[] args) throws InterruptedException {
		/**
		 * 1. Set up a string with the path to the website.
		 * 2. Create a desktop variable.  The desktop class uses the computer's default browser to open the URL.
		 * 3. Load the URL.
		 * 4. Browse to the URL.
		 */
		
		//TODO put your own clientId here.
		String clientId = ;
		String scopes = "wl.messenger";
		String signInUrl = "https://oauth.live.com/authorize?client_id=" + clientId + "&redirect_uri=https://oauth.live.com/desktop&response_type=token&scope=" + scopes;

		try {
			// launch a web browser to take the user through the OAuth 2.0 consent flow
			BareBonesBrowserLaunch.browse(signInUrl);
			
			// pop a dialog that tells the developer to copy and paste the URL and put it into a text box in the dialog
			String returnUrlString = (String)JOptionPane.showInputDialog("After completing the OAuth consent flow in the browser, copy and paste the return URL into this dialog box");
			
			// take the string URL from the dialog and programmatically cram it into the access token parameter
			String accessToken = urlTokenizerHelper(returnUrlString);
			
			// log in using the access token
			XmppClient client = new XmppClient(accessToken);
			client.logIn();
			
			// make sure the program hasn't already closed before the login has completed
			// in a real XMPP client, this would be replaced with waiting on UI events and Xmpp events 
			Thread.sleep(1000000);
		} catch (Exception e) {
			System.out.println(e);
		}
	}
	
	/**
	 * This function helps to extract the access_token query string parameter from the return URL.
	 */
	public static String urlTokenizerHelper(String urlString) {
		URL returnUrl = null;
		try{
			returnUrl = new URL(urlString);
		}catch(Exception e){}
		String queryParameters = returnUrl.getRef();
		queryParameters = queryParameters.substring(queryParameters.indexOf("access_token"));
		queryParameters = queryParameters.substring(queryParameters.indexOf("=")+1);
				
		String encodedAccessToken = queryParameters.substring(0, queryParameters.indexOf("&"));
		
		return URLDecoder.decode(encodedAccessToken);
		
	}
}
