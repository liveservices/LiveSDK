Live OAuth app server Code Sample for Windows 8 Readme

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

With Live SDK, you can develop a Metro app on Windows 8 without doing any server side implementation. However, you may want to handle user authentication logic on your server side or you may want to implement scenarios that require access to user's information when the user is offline.
The samples illustrate how to implement Live service OAuth logic on an app server and works seemlessly with an app using Live SDK on Windows 8.

Here are the list of files in the sample:
Asp.Net server code sample:
 Asp.Net\Win8Callback.aspx  --- Serves as a OAuth redirect page.
 Asp.Net\Win8Callback.aspx.cs -- It is the code behind the callback.aspx page. It handles Auth request, retrieves access_token/refresh_token and sends back the OAuth result to the client. 
 
Php server code sample:
 Php\callback.php --- Serves as a OAuth redirect page. It handles Auth request, retrieves access_token/refresh_token and sends back the OAuth result to the client.
 
Metro sample page
MetroPage\server_auth.html -- Sample Metro page to be used on your Windows 8 app.

=====

2. Usage notes

Here is the sample scenario:

a) The user loads the sample app that shows the default_auth.html page. On the page, the script does the following:
  i) loads the JS library: ms-wwa:///LiveSDKHTML.5.0/js/wl.js 
  ii) initializes the library with redirect_uri, response_type and scope. Note the response_type has to be 'code' in order to trigger server flow Auth handling.
  iii) initializes a SignIn control button via WL.ui(...) method.
  
b) On the page, the user sees the "Sign in" button. The user clicks on it, then a popup window will show a consent dialog. The user click "Yes" to confirm the consent.

c) Upon getting the user's consent, the Live OAuth server will persist the user's consent and redirect the browser to a callpack page that is specified on default.html page (WL.init redirect_uri parameter) with an authorization code value. 

d) Upon receiving the request from the redirect, the callback page (either win8callback.aspx or win8callback.php) will make an https request to the OAuth server with the received authorization code, redirect uri, and app secret value in order to retrieve the access token from OAuth server.

e) Once the access token is returned, the callback page will sends it back to the client via a further redirect to a url that has a scheme ms-app://{package-sid value}. The {package-sid value} can be found on your app page on http://manage.dev.live.com

f) The client code (wl.js) on the default.html page gets the access token, changes the signin button status, raises relevant auth events. 

=====

3. Requirements
[Client requirement]
You will need to the developer preview version of Windows 8. 
See: http://msdn.microsoft.com/en-us/windows/home/

[Server requirement]
For Asp.Net sample, you need a Windows that has IIS/Asp.Net installed. 
For Php sample, you can use Windows or Linux that has Php installed.

=====

4. Building and running the code sample

In order to run the sample, you need the following:

1) Install Live SDK developer preview:
Here is the download location: https://connect.microsoft.com/site1226
Once downloaded, install it on your Windows 8 machine.

2) Create a Metrol style app.
i) On Windows 8, open Visual Studio 11 Express and create a new project using one JavaScript template.
ii) Add a reference to the Live SDK: Right click on your project Reference node, select "Add Reference", then select "Live SDK for Windows Metro style application".
iii) Add the server_auth.html page to your application. Make sure this page can be hit, e.g. you make it as your app start page or add a link or button to load this page.

3) Register your windows 8 application.
i) Open a browser and visit the link:https://manage.dev.live.com/build, then follow the instruction on the page to register your Windows 8 app.
Once your app is created, you will be shown Client ID, Client secret, and Package security identifier(SID) of your app. The Client Secrete and Package security identifier are to be used in the sample code.
ii) You need to specify a redirect domain that you use to host the sample code. To do this, on the app page, select "Edit settings", then select "API Settings" on the left menu, you will see the "Redirect domain" field. Fill it in and save.

4) Update the both client and server sample code with your application information.
The following fields should be updated:
%PACKAGE_SID%:  Your application Package security identifier that can be found at step 1)
%CLIENT_SECRET%: Your application Client Secret that can be found at step 1)
%FULL_REDIRECT_URI_PATH%: The full Url path to your callback page.

5) Host the server pages
If you are hosting Asp.Net, you need IIS with .Net framework 4.0 enabled.

6) Build and run your app.

=====

5. Known issues
The parameter scope is added to WL.init recently, but it has not been deployed yet.
There is an issue currently blocking the server flow in PROD environment.

====

6. Support forums

To ask questions or to submit comments about this code sample, visit the Live Connect forums at: http://dev.live.com/forums.