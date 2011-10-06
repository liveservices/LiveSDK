 

 

The code included in this sample show how an application can extract the user identifier from an authentication token obtained through Live Connect’s OAuth endpoint.  For learn more about Live Connect, please visit http://msdn.microsoft.com/en-us/library/bb264574.aspx.  To learn about OAuth 2.0 web authentication protocol, the specification can be found at http://tools.ietf.org/html/draft-ietf-oauth-v2-21.

 

When a user signs in to an application that integrates with Live Connect, the application can obtain an authentication token.  This token can then be used to identify who the user is in the applications own user profile system.  The JsonWebToken class takes the authentication token and the application secret as input parameter and decrypts the token to produce a per app unique identifier for the signed in user.  This unique identifier is exposed via the JsonWebToken.Claims.UserId property.

 

To use this code, include the source file in your Asp.Net project for your web site.
