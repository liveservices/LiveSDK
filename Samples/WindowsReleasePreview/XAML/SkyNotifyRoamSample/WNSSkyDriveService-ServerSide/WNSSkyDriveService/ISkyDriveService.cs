using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.ServiceModel.Web;
using System.Text;

namespace WNSSkyDriveService
{
    // NOTE: You can use the "Rename" command on the "Refactor" menu to change the interface name "ISkyDriveService" in both code and config file together.
    [ServiceContract]
    public interface ISkyDriveService
    {
        [OperationContract]
        [WebGet(UriTemplate = "UpdateChannel?HostName={HostName}&LiveId={userLiveId}&ChannelUri={ChannelUri}&ChannelExpirationTime={ChannelExpirationTime}", RequestFormat = WebMessageFormat.Json,
        ResponseFormat = WebMessageFormat.Json)]
        string UpdateChannelApp(string HostName, string userLiveId, string ChannelUri, string ChannelExpirationTime);

        [OperationContract]
        [WebGet(UriTemplate = "SendNotify?IDFrom={userLiveIDFrom}&IDTo={userLiveIDTo}&Message1={Message1}&Message2={Message2}&PicURL={PictureURL}", RequestFormat = WebMessageFormat.Json,
        ResponseFormat = WebMessageFormat.Json)]
        string sendNotify(string userLiveIDFrom, string userLiveIDTo, string Message1, string Message2, string PictureURL);

        [OperationContract]
        [WebGet(UriTemplate = "Add?x={Number1}&y={Number2}", RequestFormat = WebMessageFormat.Json,
        ResponseFormat = WebMessageFormat.Json)]
        int Add(string Number1, string Number2);
    }
}
