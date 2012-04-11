Live OAuth app server Code Sample for web Readme

(c) Microsoft. All Rights Reserved.

=====

This document provides info that supplements the accompanying code sample. 


Important  THE CODE USED BY THIS SAMPLE HAS BEEN INCLUDED FOR PROOF OF CONCEPT PURPOSES ONLY. IT MAY HAVE SIGNIFICANT PERFORMANCE, RELIABILITY, AND SECURITY ISSUES AND SHOULD NOT BE USED OUTSIDE OF A TEST ENVIRONMENT. IT IS NOT LICENSED FOR USE IN A PRODUCTION ENVIRONMENT OR FOR USE WITH SENSITIVE DATA.

=====

Contents 

1. Overview
2. Usage notes
3. Requirements
4. Building and running the code sample
5. Known issues
6. Support forums

=====

1. Overview 

With Live SDK, you can develop a Web app using pure Html and JavaScript without doing any server side implementation, except for hosting a page. However, you may want to handle user authentication logic on your server side or you may want to implement scenarios that require access to user's information when the user is offline.
The samples illustrate how to implement Live service OAuth logic on an app server and works seemlessly with Live SDK on the Web client.

Here are the list of files in the sample:
Asp.Net sample:
 Asp.Net\Callback.aspx  --- Serves as a OAuth redirect page.
 Asp.Net\Callback.aspx.cs -- It is the code behind the callback.aspx page. It handles Auth request, retrieves access_token/refresh_token and sends back the OAuth result to the client via cookie.
 Asp.Net\default.html -- Sample Web client code.
 
Php sample
 Php\callback.php --- Serves as a OAuth redirect page. It handles Auth request, retrieves access_token/refresh_token and sends back the OAuth result to the client via cookie.
 Php\default.html -- Sample Web client code.

=====

2. Usage notes

Here is the sample scenario:

a) The user loads the sample app: default.html. On the page, the script does the following:
  i) loads the JS library: //js.live.net/v5.0/wl.js 
  ii) initializes the library with client_id, redirect_uri, scope, and response_type. Note the response_type has to be 'code' in order to trigger server flow Auth handling.
  iii) initializes a SignIn control button via WL.ui(...) method.
  
b) On the page, the user sees the "Sign in" button. The user clicks on it, then a popup window will show a consent dialog. The user click "Yes" to confirm the consent.

c) Upon getting the user's consent, the Live OAuth server will persist the user's consent and redirect the browser to a callpack page that is specified on default.html page (WL.init redirect_uri parameter) with an authorization code value. 

d) Upon receiving the request from the redirect, the callback page (either callback.aspx or callback.php) will make an https request to the OAuth server with the received authorization code, redirect uri, and app secret value in order to retrieve the access token from OAuth server.

e) Once the access token is returned, the callback page will sends it back to the client via cookie.

f) The client code (wl.js) on the default.html page gets the access token, changes the signin button status, raises relevant auth events. Upon getting the access token, the sample code makes request to the Live services to retrieve the user profile image and render it on the page.

=====

3. Requirements

For Asp.Net sample, you need a Windows that has IIS/Asp.Net installed.
For Php sample, you can use Windows or Linux that has Php installed.
Make sure your sample site is on port 80(http) or 443 (https).

=====

4. Building and running the code sample

In order to run the sample, you need the following:

1) Create an application on https://manage.dev.live.com/ page
i) Once your app is created, you will be shown Client ID and Client secret of your app, that are to be used in the sample code.
ii) You need to specify a redirect domain that you use to host the sample code. To do this, on the app page, select "Edit settings", then select "API Settings" on the left menu, you will see the "Redirect domain" field. Fill it in and save.

2) Update the sample code on the following files:
for Asp.Net
i) default.html  ii) callback.aspx.cs
for Php
i) default.html  ii) callback.php

The following fields should be updated:
%CLIENT_ID%:  Your application Client Id that can be found at step 1)
%CLIENT_SECRET%: Your application Client Secret that can be found at step 1)
%REDIRECT_URI_PATH%: The full Url path where you host the sample code. Make sure this is the same on default.html page and your server page(callback.php or callback.aspx.cs)

3) Host the sample pages on your Web server.
If you are hosting Asp.Net, you need IIS with .Net framework 4.0 enabled.

=====

5. Support forums

To ask questions or to submit comments about this code sample, visit the Live Connect forums at: http://dev.live.com/forums.