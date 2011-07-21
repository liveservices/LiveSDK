//-----------------------------------------------------------------------
// <copyright file="UserInfo.cs" company="Microsoft Corp.">
//     Copyright Microsoft Corp. All rights reserved.
// </copyright>
//-----------------------------------------------------------------------

namespace SkyDrive_Photos_Sample
{
    using System;
    using System.Runtime.Serialization;

    /// <summary>
    /// Represents the user info returned by the "me" call.
    /// </summary>
    [DataContract]
    public class UserInfo
    {
        /// <summary>
        /// Gets or sets the name of the user.
        /// </summary>
        [DataMember(Name = "name")]
        public string Name
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets the name of the user.
        /// </summary>
        [DataMember(Name = "first_name")]
        public string FirstName
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets the name of the user.
        /// </summary>
        [DataMember(Name = "last_name")]
        public string LastName
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets the name of the user.
        /// </summary>
        [DataMember(Name = "link")]
        public string Link
        {
            get;
            set;
        }
    }
}
