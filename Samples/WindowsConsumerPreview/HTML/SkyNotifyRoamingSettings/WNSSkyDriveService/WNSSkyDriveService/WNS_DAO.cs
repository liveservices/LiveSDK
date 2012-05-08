using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;
using System.Xml.Linq;



namespace WNSSkyDriveService
{
    public class WNS_DAO
    {

        //Change this path for your own path for saving Database.xml
        string XMLPath = @"C:\JABRDocuments\Documents\_WinP&PC\Windows Live\WindowsNotificationSample_Final\WNSSkyDriveService\WNSSkyDriveService\DB\DataBase.xml";

        public WNS_DAO() {
            deleteExpiredItems();
        }

        private void deleteExpiredItems()
        {
 	        //throw new NotImplementedException();
            //To do:  clean the already expired tokens so we don't keep garbage
        }
        
        /// <summary>
        /// //Validates if a key paired HostNAme - UserLiveID already exists
        /// </summary>
        /// <param name="HostName">HostNAME</param>
        /// <param name="userLiveId">UserLiveId</param>
        /// <returns>true if exists, false if it doesn't exist</returns>
        public bool validateKeyHostUserId(string HostName, string userLiveId)
        {
            XDocument xmlDoc = XDocument.Load(XMLPath);
            var records = from record in xmlDoc.Descendants("Record")
                          where (record.Element("HostName").Value == HostName)
                          && (record.Element("UserLiveId").Value == userLiveId)
                          select record.Element("channelUri").Value;
            foreach (var record in records)
            {
                return true;
            } 
            return false;
        }

        /// <summary>
        /// Add a new record for a new registered application
        /// </summary>
        /// <param name="HostName"></param>
        /// <param name="userLiveId"></param>
        /// <param name="ChannelUri"></param>
        /// <param name="ChannelExpirationTime"></param>
        public void addApplication(string HostName, string userLiveId, string ChannelUri, string ChannelExpirationTime)
        {
            XDocument xmlDoc = XDocument.Load(XMLPath);
            xmlDoc.Element("Database").Add(new XElement("Record", new XElement("HostName", HostName),
                new XElement("UserLiveId", userLiveId), new XElement("channelUri",ChannelUri), new XElement("ChannelExpirationTime",ChannelExpirationTime)));
            xmlDoc.Save(XMLPath);
        }

        /// <summary>
        /// If a record already exist for a Hostaname / UserLiveID, then we update the ChannelUri info.
        /// </summary>
        /// <param name="HostName"></param>
        /// <param name="userLiveId"></param>
        /// <param name="ChannelUri"></param>
        /// <param name="ChannelExpirationTime"></param>
        public void updateApplication(string HostName, string userLiveId, string ChannelUri, string ChannelExpirationTime)
        {
            XDocument xmlDoc = XDocument.Load(XMLPath);
            var recordToUpdate = (from record in xmlDoc.Descendants("Record")
                          where (record.Element("HostName").Value == HostName)
                          && (record.Element("UserLiveId").Value == userLiveId)
                          select record).First();
            recordToUpdate.SetElementValue("channelUri", ChannelUri);
            recordToUpdate.SetElementValue("ChannelExpirationTime", ChannelExpirationTime);
            xmlDoc.Save(XMLPath);
         
        }




        /// <summary>
        /// Given a user live id, return all the ChannelUri's of the devices registered for the user.
        /// </summary>
        /// <param name="userLiveId">User live ide.g. user@hotmail.com</param>
        /// <returns>an array of all the Channel URI's for that user</returns>
        public List<string> retrieveChannelUri(string userLiveId)
        {
            List<string> ChannelURIs = new List<string>();
            XDocument xmlDoc = XDocument.Load(XMLPath);
            var records = from record in xmlDoc.Descendants("Record")
                          where (record.Element("UserLiveId").Value == userLiveId)
                          select record.Element("channelUri").Value;
            foreach (var record in records)
            {
                ChannelURIs.Add(record);
            }
            return ChannelURIs;
        }

    }
}