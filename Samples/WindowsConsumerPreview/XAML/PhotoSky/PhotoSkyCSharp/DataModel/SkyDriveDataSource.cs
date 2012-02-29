using System;
using System.Linq;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using Windows.ApplicationModel.Resources.Core;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Media.Imaging;
using Microsoft.Live;

// The data model defined by this file serves as a representative example of a strongly-typed
// model that supports notification when members are added, removed, or modified.  The property
// names chosen coincide with data bindings in the standard item templates.
//
// Applications may use this model as a starting point and build on it, or discard it entirely and
// replace it with something appropriate to their needs.

namespace PhotoSkyCSharp.Data
{
    /// <summary>
    /// Base class for <see cref="SampleDataItem"/> and <see cref="SkyDriveAlbum"/> that
    /// defines properties common to both.
    /// </summary>
    [Windows.Foundation.Metadata.WebHostHidden]
    public abstract class SkyDriveDataCommon : PhotoSkyCSharp.Common.BindableBase
    {
        //private static Uri _baseUri = new Uri("ms-appx:///");

        public SkyDriveDataCommon(String uniqueId, String title, String subtitle, String imagePath, String description)
        {
            this._uniqueId = uniqueId;
            this._title = title;
            this._subtitle = subtitle;
            this._description = description;
            this._imagePath = imagePath;
        }

        private string _uniqueId = string.Empty;
        public string UniqueId
        {
            get { return this._uniqueId; }
            set { this.SetProperty(ref this._uniqueId, value); }
        }

        private string _title = string.Empty;
        public string Title
        {
            get { return this._title; }
            set { this.SetProperty(ref this._title, value); }
        }

        private string _subtitle = string.Empty;
        public string Subtitle
        {
            get { return this._subtitle; }
            set { this.SetProperty(ref this._subtitle, value); }
        }

        private string _description = string.Empty;
        public string Description
        {
            get { return this._description; }
            set { this.SetProperty(ref this._description, value); }
        }

        private ImageSource _image = null;
        private String _imagePath = null;
        public ImageSource Image
        {
            get
            {
                if (this._image == null && this._imagePath != null)
                {
                    this._image = new BitmapImage(new Uri(this._imagePath,UriKind.Absolute));
                }
                return this._image;
            }

            set
            {
                this._imagePath = null;
                this.SetProperty(ref this._image, value);
            }
        }

        public void SetImage(String path)
        {
            this._image = null;
            this._imagePath = path;
            this.OnPropertyChanged("Image");
        }
    }

    /// <summary>
    /// Generic item data model.
    /// </summary>
    public class SkyDriveFileItem : SkyDriveDataCommon
    {
        public SkyDriveFileItem(String uniqueId, String title, String subtitle, String imagePath, String description, String content, SkyDriveAlbum group)
            : base(uniqueId, title, subtitle, imagePath, description)
        {
            this._content = content;
            this._group = group;
        }

        private string _content = string.Empty;
        public string Content
        {
            get { return this._content; }
            set { this.SetProperty(ref this._content, value); }
        }

        private SkyDriveAlbum _group;
        public SkyDriveAlbum Group
        {
            get { return this._group; }
            set { this.SetProperty(ref this._group, value); }
        }
    }

    /// <summary>
    /// Generic group data model.
    /// </summary>
    public class SkyDriveAlbum : SkyDriveDataCommon
    {
        public SkyDriveAlbum(String uniqueId, String title, String subtitle, String imagePath, String description)
            : base(uniqueId, title, subtitle, imagePath, description)
        {
        }

        private ObservableCollection<SkyDriveFileItem> _items = new ObservableCollection<SkyDriveFileItem>();
        public ObservableCollection<SkyDriveFileItem> Items
        {
            get { return this._items; }
        }
    }

    /// <summary>
    /// Creates a collection of groups and items with hard-coded content.
    /// </summary>
    public sealed class SkyDriveDataSource
    {
        private ObservableCollection<SkyDriveAlbum> _itemGroups = new ObservableCollection<SkyDriveAlbum>();
        public ObservableCollection<SkyDriveAlbum> ItemGroups
        {
            get { return this._itemGroups; }
        }

        public SkyDriveDataSource()
        {
            //String ITEM_CONTENT = String.Format("Item Content: {0}\n\n{0}\n\n{0}\n\n{0}\n\n{0}\n\n{0}\n\n{0}",
            //            "Curabitur class aliquam vestibulum nam curae maecenas sed integer cras phasellus suspendisse quisque donec dis praesent accumsan bibendum pellentesque condimentum adipiscing etiam consequat vivamus dictumst aliquam duis convallis scelerisque est parturient ullamcorper aliquet fusce suspendisse nunc hac eleifend amet blandit facilisi condimentum commodo scelerisque faucibus aenean ullamcorper ante mauris dignissim consectetuer nullam lorem vestibulum habitant conubia elementum pellentesque morbi facilisis arcu sollicitudin diam cubilia aptent vestibulum auctor eget dapibus pellentesque inceptos leo egestas interdum nulla consectetuer suspendisse adipiscing pellentesque proin lobortis sollicitudin augue elit mus congue fermentum parturient fringilla euismod feugiat");

            //var group1 = new SkyDriveAlbum("Group-1",
            //        "Group Title: 1",
            //        "Group Subtitle: 1",
            //        "Assets/DarkGray.png",
            //        "Group Description: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tempor scelerisque lorem in vehicula. Aliquam tincidunt, lacus ut sagittis tristique, turpis massa volutpat augue, eu rutrum ligula ante a ante");
            //group1.Items.Add(new SkyDriveFileItem("Group-1-Item-1",
            //        "Item Title: 1",
            //        "Item Subtitle: 1",
            //        "Assets/LightGray.png",
            //        "Item Description: Pellentesque porta, mauris quis interdum vehicula, urna sapien ultrices velit, nec venenatis dui odio in augue. Cras posuere, enim a cursus convallis, neque turpis malesuada erat, ut adipiscing neque tortor ac erat.",
            //        ITEM_CONTENT,
            //        group1));
    
            //this.ItemGroups.Add(group1);

        }

        internal async void LoadData()
        {
            LiveConnectClient client = new LiveConnectClient(App.Session);
            LiveOperationResult albumOperationResult = await client.Get("me/albums");
            dynamic albumResult = albumOperationResult.Result;
            foreach (dynamic album in albumResult.data)
            {
                var group = new SkyDriveAlbum(album.id, album.name, album.name, @"ms-appx:///Assets/DarkGray.png", album.description);
                LiveOperationResult pictureOperationResult = await client.Get(album.id + "/files");
                dynamic pictureResult = pictureOperationResult.Result;
                foreach (dynamic picture in pictureResult.data)
                {
                    var pictureItem = new SkyDriveFileItem(picture.id, picture.name, picture.name, picture.source, picture.description, picture.description, group);
                    group.Items.Add(pictureItem);
                }
                this.ItemGroups.Add(group);
            }

        }
    }
}
