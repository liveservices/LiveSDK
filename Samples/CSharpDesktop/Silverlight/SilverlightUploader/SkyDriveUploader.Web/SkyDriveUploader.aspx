<%@ Page Language="C#" AutoEventWireup="true" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" >
<head runat="server">
    <title>SkyDriveUploader</title>
    <style type="text/css">
        html, body {
	        height: 100%;
	        overflow: auto;
        }
        body {
	        padding: 0;
	        margin: 0;
        }
        #silverlightControlHost {
	        height: 100%;
	        text-align: center;
	        position: relative;
	        z-index: 0;
        }
        #signInControlHost {
            text-align: center;
            margin-top: 100px;
            position: relative;
            top: 59px;
            left: -168px;
            z-index : 1;
        }
        #btnSignIn {
            width: 64px;
            height: 31px;
            font-size: 11px;
        }        
    </style>
    <script type="text/javascript" src="http://js.live.net/v5.0/wl.js"></script>
    <script type="text/javascript" src="constants.js"></script>    
    <script type="text/javascript" src="Silverlight.js"></script>
    <script type="text/javascript">
        function onSilverlightError(sender, args) {
            var appSource = "";
            if (sender != null && sender != 0) {
              appSource = sender.getHost().Source;
            }
            
            var errorType = args.ErrorType;
            var iErrorCode = args.ErrorCode;

            if (errorType == "ImageError" || errorType == "MediaError") {
              return;
            }

            var errMsg = "Unhandled Error in Silverlight Application " +  appSource + "\n" ;

            errMsg += "Code: "+ iErrorCode + "    \n";
            errMsg += "Category: " + errorType + "       \n";
            errMsg += "Message: " + args.ErrorMessage + "     \n";

            if (errorType == "ParserError") {
                errMsg += "File: " + args.xamlFile + "     \n";
                errMsg += "Line: " + args.lineNumber + "     \n";
                errMsg += "Position: " + args.charPosition + "     \n";
            }
            else if (errorType == "RuntimeError") {           
                if (args.lineNumber != 0) {
                    errMsg += "Line: " + args.lineNumber + "     \n";
                    errMsg += "Position: " +  args.charPosition + "     \n";
                }
                errMsg += "MethodName: " + args.methodName + "     \n";
            }

            throw new Error(errMsg);
        }
    </script>
</head>
<body>
    <div id="skyDriveUploader">
        <div id="signInControlHost">
            <input id="btnSignIn" type="button" value="Sign in" onclick="signInUser()"/>
        </div>
        <div id="silverlightControlHost">
            <object data="data:application/x-silverlight-2," type="application/x-silverlight-2" width="440" height="370">
		      <param name="source" value="ClientBin/SkyDriveUploader.xap"/>
		      <param name="onError" value="onSilverlightError" />
		      <param name="background" value="white" />
		      <param name="minRuntimeVersion" value="4.0.60310.0" />
		      <param name="autoUpgrade" value="true" />
              <param name="onLoad" value="SilverlightLoaded" />
              <param name="windowless" value="true"/>
		      <a href="http://go.microsoft.com/fwlink/?LinkID=149156&v=4.0.60310.0" style="text-decoration:none">
 			      <img src="http://go.microsoft.com/fwlink/?LinkId=161376" alt="Get Microsoft Silverlight" style="border-style:none"/>
		      </a>
	        </object><iframe id="_sl_historyFrame" style="visibility:hidden;height:0px;width:0px;border:0px"></iframe>
        </div>
    </div>
    <script type="text/javascript">
        var slCtrl = null;
        WL.Event.subscribe("auth.login", onLogin);
        WL.Event.subscribe("auth.logout", onLogout);
        WL.init({
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URL,
            scope: SCOPES,
            response_type: "token"
        });

        function SilverlightLoaded(sender) {
            // Get the instance of Silverlight app
            slCtrl = sender.getHost();
        }

        function signInUser() {
            WL.login();
        }

        function signOutUser() {
            WL.logout();
        }

        function onLogin() {
            var session = WL.getSession();
            if (session.error) {
                alert("Error signing in: " + session.error);
            }
            else {
                btnSignIn.value = "Sign out";
                btnSignIn.onclick = signOutUser;

                // Pass the access token to Silverlight app
                if (slCtrl != null) {
                    slCtrl.Content.SkyDriveUploader.IsSignIn = true;
                    slCtrl.Content.SkyDriveUploader.OnConsent();
                    slCtrl.Content.SkyDriveUploader.Token = session.access_token;                    
                }
            }
        }
        
        function onLogout() {
            btnSignIn.value = "Sign in";
            btnSignIn.onclick = signInUser;

            if (slCtrl != null) {
                slCtrl.Content.SkyDriveUploader.IsSignIn = false;
            }
        }

        function disableSignInButton(disabled) {
            btnSignIn.disabled = (disabled ? "disabled" : "");
        }
    </script>
</body>
</html>
