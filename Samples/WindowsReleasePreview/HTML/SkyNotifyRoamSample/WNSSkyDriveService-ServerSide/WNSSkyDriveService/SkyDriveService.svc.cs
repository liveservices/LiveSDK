using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.Text;
using System.Net;
using System.IO;
using System.Web;



namespace WNSSkyDriveService
{
    // NOTE: You can use the "Rename" command on the "Refactor" menu to change the class name "SkyDriveService" in code, svc and config file together.
    //we use InstanceContextMode.Single to have one single instance of the variable WNSMethods which crates the authentication token with the WNS Server and allows us to send Notifications.
    [ServiceBehavior(InstanceContextMode = InstanceContextMode.Single)] 
    public class SkyDriveService : ISkyDriveService
    {
        WNSMethods WNSMethods = new WNSMethods();
        WNS_DAO WNSDatabase = new WNS_DAO();

        public string UpdateChannelApp(string HostName, string userLiveId, string ChannelUri, string ChannelExpirationTime)
        {
            string EncodedChannelUri = ConvertChannelUriEncoding(ChannelUri);
            if (WNSDatabase.validateKeyHostUserId(HostName,userLiveId))
            {
                WNSDatabase.updateApplication(HostName, userLiveId, EncodedChannelUri, ChannelExpirationTime);
            }
            else
            {
                WNSDatabase.addApplication(HostName, userLiveId, EncodedChannelUri, ChannelExpirationTime);
            }
            return "Databse has been updated";
        }

        private string ConvertChannelUriEncoding(string ChannelUri)
        {
            try{

                string stringParts = ChannelUri.Substring(ChannelUri.IndexOf("?token=") + 7);
               var token = HttpUtility.UrlEncode(stringParts);
               return "https://db3.notify.windows.com/?token=" + token;
            }
            catch{
            return ChannelUri;
            }
        }

        public string sendNotify(string userLiveIDFrom, string userLiveIDTo, string Message1, string Message2, string  PictureURL)
        {
            List<string> ChannelUris = WNSDatabase.retrieveChannelUri(userLiveIDTo);
            string messageResponse = "";
            //we found at least one device used for this account
            if (ChannelUris.Count > 0)
            {
                foreach (string channelUri in ChannelUris)
                {
                    messageResponse += SendTile(channelUri, Message1, PictureURL);
                    messageResponse += sendToast(channelUri, Message1, Message2, PictureURL);
                }
            }
            //we didn't find any ChannelUris for the intended recepit, tehrefore we send a normal email
            else
            {
                messageResponse = "User not recognized";
            }

            return messageResponse;
        }

        private string  SendTile(string channelUri, string Message1, string PictureURL)
        {
            string messageResponse = "";
            try
            {
                // push tile/toast data
                string TileTemplate = "<tile><visual lang='en-US'><binding template='TileWideImageAndText01'><image id='1' src='" + PictureURL  + "'/><text id='1'>" + Message1 + "</text></binding></visual></tile>";

                string app_url = channelUri;
                Encoding enc = Encoding.UTF8;
                byte[] data = enc.GetBytes(TileTemplate);

                bool isTile = TileTemplate.Contains("<tile>");
                bool isBadge = TileTemplate.Contains("<badge");

                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(app_url);
                req.Method = "POST";
                req.ContentType = "text/xml; charset=UTF-8";
                req.Headers.Add("X-WNS-Type", isTile ? "wns/tile" : isBadge ? "wns/badge" : "wns/toast");
                //req.Headers.Add("X-WNS-Priority", "1");   // throws an exception in case of wns/tile
                req.Headers.Add("X-WNS-TTL", "100000000");
                req.Headers.Add("X-WNS-Cache-Policy", "no-cache");
                req.Headers.Add("X-WNS-RequestForStatus", "true");
                req.Headers["Authorization"] = "Bearer " + WNSMethods.accessToken;
                req.ContentLength = data.Length;

                Stream reqStream = req.GetRequestStream();
                reqStream.Write(data, 0, data.Length);
                reqStream.Close();


                WebResponse res = req.GetResponse();
                //listBoxHeaders.Items.Clear();
                for (var i = 0; i < res.Headers.Count; i++)
                {
                    var key = res.Headers.Keys[i];
                    var val = res.Headers[i].ToString();
                    messageResponse += key + ":" + val + "<br>";
                }
                Stream resStream = res.GetResponseStream();
                StreamReader sr = new StreamReader(resStream, enc);
                string html = sr.ReadToEnd();
                sr.Close();
                resStream.Close();
                return messageResponse;
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        private string sendToast(string channelUri, string Message1, string Message2, string PictureURL)
        {
            string messageResponse = "";
            try
            {
                // push tile/toast data
                string ToastTemplate = " <toast><visual lang='en-US'><binding template='ToastImageAndText03'><image id='1' src='" + PictureURL + "'/><text id='1'>" + Message1 + "</text><text id='2'>" + Message2 + "</text></binding></visual></toast>";

                string app_url = channelUri;
                Encoding enc = Encoding.UTF8;
                byte[] data = enc.GetBytes(ToastTemplate);

                bool isTile = ToastTemplate.Contains("<tile>");
                bool isBadge = ToastTemplate.Contains("<badge");

                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(app_url);
                req.Method = "POST";
                req.ContentType = "text/xml; charset=UTF-8";
                req.Headers.Add("X-WNS-Type", isTile ? "wns/tile" : isBadge ? "wns/badge" : "wns/toast");
                //req.Headers.Add("X-WNS-Priority", "1");   // throws an exception in case of wns/tile
                req.Headers.Add("X-WNS-TTL", "100000000");
                req.Headers.Add("X-WNS-Cache-Policy", "no-cache");
                req.Headers.Add("X-WNS-RequestForStatus", "true");
                req.Headers["Authorization"] = "Bearer " + WNSMethods.accessToken;
                req.ContentLength = data.Length;

                Stream reqStream = req.GetRequestStream();
                reqStream.Write(data, 0, data.Length);
                reqStream.Close();


                WebResponse res = req.GetResponse();
                //listBoxHeaders.Items.Clear();
                for (var i = 0; i < res.Headers.Count; i++)
                {
                    var key = res.Headers.Keys[i];
                    var val = res.Headers[i].ToString();
                    messageResponse += key + ":" + val + "<br>";
                }
                Stream resStream = res.GetResponseStream();
                StreamReader sr = new StreamReader(resStream, enc);
                string html = sr.ReadToEnd();
                sr.Close();
                resStream.Close();
                return messageResponse;
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        public int Add(string Number1, string Number2)
        {
            int num1 = Convert.ToInt32(Number1);
            int num2 = Convert.ToInt32(Number2);
            return num1 + num2;
        }
    }
}
