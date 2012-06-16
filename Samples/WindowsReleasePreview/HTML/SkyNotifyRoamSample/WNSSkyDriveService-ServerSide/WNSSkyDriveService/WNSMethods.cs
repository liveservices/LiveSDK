using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Net;
using System.IO;
using System.Text;
using System.ServiceModel.Activation;

namespace WNSSkyDriveService
{
    public class WNSMethods
    {

        string Sid;
        string Secret;
        public string accessToken;

        public WNSMethods()
        {
            InitData();
        }

        private void InitData()
        {
            // replace here with your own application data
            this.Sid = "ms-app://s-1-15-2-1523749663-2151504003-3960936081-1025279322-3939628592-3696759691-3913934844";
            this.Secret = "aDaXv-Hky0p5FIvQoCE3cuin9oPR4Z9-";
            AutenticateWNS();
        }

        
        private void AutenticateWNS()
        {
            try
            {
                // get an access token
                var urlEncodedSid = HttpUtility.UrlEncode(String.Format("{0}", this.Sid));
                var urlEncodedSecret = HttpUtility.UrlEncode(this.Secret);

                var uri =
                  String.Format("grant_type=client_credentials&client_id={0}&client_secret={1}&scope=notify.windows.com",
                  urlEncodedSid,
                  urlEncodedSecret);

                var client = new WebClient();
                client.Headers.Add("Content-Type", "application/x-www-form-urlencoded");
                string response = client.UploadString("https://login.live.com/accesstoken.srf", uri);

                // parse the response in JSON format
                OAuthToken token;
                using (var ms = new MemoryStream(Encoding.Unicode.GetBytes(response)))
                {
                    var ser = new DataContractJsonSerializer(typeof(OAuthToken));
                    token = (OAuthToken)ser.ReadObject(ms);
                }
                this.accessToken = token.AccessToken;
            }
            catch (Exception ex)
            {
                //lblResult.Text = ex.Message;
                //lblResult.ForeColor = System.Drawing.Color.Red;
                throw ex;
            }
        }

        [DataContract]
        public class OAuthToken
        {
            [DataMember(Name = "access_token")]
            public string AccessToken { get; set; }
            [DataMember(Name = "token_type")]
            public string TokenType { get; set; }
        }

        OAuthToken GetOAuthTokenFromJson(string jsonString)
        {
            using (var ms = new MemoryStream(Encoding.Unicode.GetBytes(jsonString)))
            {
                var ser = new DataContractJsonSerializer(typeof(OAuthToken));
                var oAuthToken = (OAuthToken)ser.ReadObject(ms);
                return oAuthToken;
            }
        }

        protected void getAccessToken()
        {
            var urlEncodedSid = HttpUtility.UrlEncode(String.Format("{0}", this.Sid));
            var urlEncodedSecret = HttpUtility.UrlEncode(this.Secret);

            var body =
              String.Format("grant_type=client_credentials&client_id={0}&client_secret={1}&scope=notify.windows.com", urlEncodedSid, urlEncodedSecret);

            var client = new WebClient();
            client.Headers.Add("Content-Type", "application/x-www-form-urlencoded");

            string response = client.UploadString("https://login.live.com/accesstoken.srf", body);
            //string response = client.UploadString(this.authURL, body);
            var oAuthToken = GetOAuthTokenFromJson(response);
            string accessToken = oAuthToken.AccessToken;
        }




    }
}