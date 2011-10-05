//-----------------------------------------------------------------------
// <copyright file="AlbumInfo.cs" company="Microsoft Corp.">
//     Copyright Microsoft Corp. All rights reserved.
// </copyright>
//-----------------------------------------------------------------------


using System;
using System.Runtime.Serialization;
using System.Collections.Generic;

namespace SkyDrive_Photos_Sample
{

    /// <summary>
    /// Represents the user that created the album
    /// </summary>
    [DataContract]
    public class From
    {      
        /// <summary>
        /// Gets or sets the name of the user
        /// </summary>
        [DataMember(Name = "name")]
        public string Name
        {
            get;
            set;
        }

        /// <summary>
        /// Gets or sets the id of the user
        /// </summary>
        [DataMember(Name = "id")]
        public string Id
        {
            get;
            set;
        }
    }


    /// <summary>
    /// Represents multiple albums returned in a JSON request
    /// </summary>
    public class Albums
    {
        public List<AlbumInfo> data { get; set; }
    }

   /// <summary>
   /// Represents a photo album in SkyDrive.
   /// </summary>
   [DataContract]
public class AlbumInfo
{

    /// <summary>
    /// Gets or sets the id of the album
    /// </summary>
    [DataMember(Name = "id")]
    public string Id
    {
        get;
        set;
    }

    /// <summary>
    /// Gets or sets the user who created the album
    /// </summary>
    [DataMember(Name = "from")]
    public From From 
    { 
        get; 
        set; 
    }

    /// <summary>
    /// Gets or sets the name of the album
    /// </summary>
    [DataMember(Name = "name")]
    public string Name
    {
        get;
        set;
    }

    /// <summary>
    /// Gets or sets the description of the album
    /// </summary>
    [DataMember(Name = "description")]
    public string Description
    {
        get;
        set;
    }

    /// <summary>
    /// Gets or sets the number of photos in the album
    /// </summary>
    [DataMember(Name = "count")]
    public int Count
    {
        get;
        set;
    }

    /// <summary>
    /// Gets or sets the link to the album
    /// </summary>
    [DataMember(Name = "link")]
    public string Link
    {
        get;
        set;
    }


    /// <summary>
    /// Gets or sets the type of folder in SkyDrive
    /// </summary>
    [DataMember(Name = "type")]
    public string Type
    {
        get;
        set;
    }

    /// <summary>
    /// Gets or sets the created time of the album
    /// </summary>
    [DataMember(Name = "created_time")]
    public string CreatedTime
    {
        get;
        set;
    }

    /// <summary>
    /// Gets or sets the updated time of the album
    /// </summary>
    [DataMember(Name = "updated_time")]
    public string UpdatedTime
    {
        get;
        set;
    }

}

}
