package com.ms.wlm;

import java.net.URLDecoder;

public class Program {

	/**
	 * The OAuth2.0 access token to be used for login.
	 */
	public static final String TestAccessToken = URLDecoder
			.decode("EwAgAq1DBAAUlbRWyAJjK5w968Ru3Cyt%2f6GvwXwAAaaSn%2fzCErnNuCDLPq%2fVeja6u6qXVypLqz8BOpomUMZBS6vKwVrtm5KwTV2wQBldJMahjfFl85tFFAH0853A30FEFl9cmYuV4IdfcAIz1AwiwyRnEfV46KBMbWcKRpokihwvGexejvSIIXyg4d%2fWC6TZmTS4dx9zRxdaUz0DVUBVcatylbMbY3sYpIr7yo8RtFlhcnyCrJzDg89FpeRmTKHEsiouDqFUUenFpR2tiHMJi60UX8QT%2fRJXgC7va7lQJCsbFd1EKPpikjWWlB407ToVxHAep7iDpI%2fIigkJ8nfwS9DgSdmppeVADLAHjOKSnBmhz9TX37%2f0DMA0N%2bNJEEYDZgAACBW6gnbfZbi88AASSaNTyBPyLi7rK13njeIvHx8Lwyb5UyY3WSxtPsl%2f10KV%2fa0q8USJdiP2kx3aP0JP0HJfH%2f7ypQSgvY%2brGRBgcq0IQ9RHMxrKJHb%2bvKBkOPE%2bNtxxY35IdCf6iwaragCUuhYP%2fTt2gKalhpqWmivD5HvrQy%2fFNNu9MszMeDRiOu8vB95kCJeu5RM1Kwj0VC2i9Owo43B%2fjkuWMm58zlWKIAL%2f1SEUCs6pOKlfkA4Lzij3jnYqijKydOwvX3te2vLBVSVp3LUX6eZB4HIs0NU2w0kXE2uP3gTKPjaMLT39CAV%2fv83Ae0fhbdCb%2bT82J4QAAA%3d%3d");

	public static void main(String[] args) throws InterruptedException {
		try {
			XmppClient client = new XmppClient(Program.TestAccessToken);
			client.logIn();
			Thread.sleep(1000000);
		} catch (Exception e) {
			System.out.println(e);
		}
	}
}
