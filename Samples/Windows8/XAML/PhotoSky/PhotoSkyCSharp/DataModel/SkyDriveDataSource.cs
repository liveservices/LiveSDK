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
    /// Base class for <see cref="SkyDriveItem"/> and <see cref="SkyDriveAlbum"/> that
    /// defines properties common to both.
    /// </summary>
    [Windows.Foundation.Metadata.WebHostHidden]
    public abstract class SkyDriveDataCommon : PhotoSkyCSharp.Common.BindableBase
    {
        private static Uri _baseUri = new Uri("ms-appx:///");


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
                    this._image = new BitmapImage(new Uri(SkyDriveDataCommon._baseUri, this._imagePath));
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
    public class SkyDriveItem : SkyDriveDataCommon
    {
        public SkyDriveItem(String uniqueId, String title, String subtitle, String imagePath, String description, String content, SkyDriveAlbum group)
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

        private ObservableCollection<SkyDriveItem> _items = new ObservableCollection<SkyDriveItem>();
        public ObservableCollection<SkyDriveItem> Items
        {
            get { return this._items; }
        }
        
        public IEnumerable<SkyDriveItem> TopItems
        {
            // Provides a subset of the full items collection to bind to from a GroupedItemsPage
            // for two reasons: GridView will not virtualize large items collections, and it
            // improves the user experience when browsing through groups with large numbers of
            // items.
            //
            // A maximum of 12 items are displayed because it results in filled grid columns
            // whether there are 1, 2, 3, 4, or 6 rows displayed
            get { return this._items.Take(12); }
        }
    }

    /// <summary>
    /// Creates a collection of groups and items with hard-coded content.
    /// </summary>
    public sealed class SkyDriveDataSource: INotifyPropertyChanged
    {
        private static SkyDriveDataSource _sampleDataSource = new SkyDriveDataSource();
        public static LiveAuthClient authClient;

        private ObservableCollection<SkyDriveAlbum> _allGroups = new ObservableCollection<SkyDriveAlbum>();
        public ObservableCollection<SkyDriveAlbum> AllGroups
        {
            get { return this._allGroups; }
        }

        private string _userName;
        public string UserName
        {
            get { return this._userName; }
            set { 
                _userName = value;
                NotifyPropertyChanged("UserName");
            }
        }

        private string _imageUrl;
        public string ImageUrl
        {
            get { return this._imageUrl; }
            set
            {
                _imageUrl = value;
                NotifyPropertyChanged("ImageUrl");
            }
        }

   

        public static IEnumerable<SkyDriveAlbum> GetGroups(string uniqueId)
        {
            if (!uniqueId.Equals("AllGroups")) throw new ArgumentException("Only 'AllGroups' is supported as a collection of groups");
            
            return _sampleDataSource.AllGroups;
        }

        public static SkyDriveAlbum GetGroup(string uniqueId)
        {
            // Simple linear search is acceptable for small data sets
            var matches = _sampleDataSource.AllGroups.Where((group) => group.UniqueId.Equals(uniqueId));
            if (matches.Count() == 1) return matches.First();
            return null;
        }

        public static SkyDriveItem GetItem(string uniqueId)
        {
            // Simple linear search is acceptable for small data sets
            var matches = _sampleDataSource.AllGroups.SelectMany(group => group.Items).Where((item) => item.UniqueId.Equals(uniqueId));
            if (matches.Count() == 1) return matches.First();
            return null;
        }

        private async void InitAuth()
        {
            if (!Windows.ApplicationModel.DesignMode.DesignModeEnabled)
            {
                authClient = new LiveAuthClient();
                LiveLoginResult authResult = await authClient.LoginAsync(new List<string>() { "wl.signin", "wl.basic", "wl.skydrive" });
                if (authResult.Status == LiveConnectSessionStatus.Connected)
                {
                    App.Session = authResult.Session;
                }
                LoadProfile();
            }
        }

        private async void LoadProfile()
        {
            LiveConnectClient client = new LiveConnectClient(App.Session);
            LiveOperationResult liveOpResult = await client.GetAsync("me");
            dynamic dynResult = liveOpResult.Result;
            App.UserName = dynResult.name;
            LoadData();
        }

        public SkyDriveDataSource()
        {
            InitAuth(); 
        }

        public async void LoadData()
        {
           LiveConnectClient client = new LiveConnectClient(App.Session);

            LiveOperationResult albumOperationResult = await client.GetAsync("me/albums");
            dynamic albumResult = albumOperationResult.Result;
            foreach (dynamic album in albumResult.data)
            {
                var group = new SkyDriveAlbum(album.id, album.name, album.name, @"ms-appx:///Assets/DarkGray.png", album.description);
                LiveOperationResult pictureOperationResult = await client.GetAsync(album.id + "/files");
                dynamic pictureResult = pictureOperationResult.Result;
                foreach (dynamic picture in pictureResult.data)
                {
                    var pictureItem = new SkyDriveItem(picture.id, picture.name, picture.name, picture.source, picture.description, picture.description, group);
                    group.Items.Add(pictureItem);
                }
                this.AllGroups.Add(group);
            }
        }

        // Declare the PropertyChanged event.
        public event PropertyChangedEventHandler PropertyChanged;

        // NotifyPropertyChanged will raise the PropertyChanged event, 
        // passing the source property that is being updated.
        public void NotifyPropertyChanged(string propertyName)
        {
            if (PropertyChanged != null)
            {
                PropertyChanged(this,
                    new PropertyChangedEventArgs(propertyName));
            }
        }

    }
}
