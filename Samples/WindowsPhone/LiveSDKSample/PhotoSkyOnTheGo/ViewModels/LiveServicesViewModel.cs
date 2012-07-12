using System;
using System.ComponentModel;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using System.Collections.ObjectModel;
using Microsoft.Live;
using Microsoft.Phone.Tasks;
using System.Threading;
using Microsoft.Xna.Framework.Media;
using System.IO;
using System.IO.IsolatedStorage;


namespace PhotoSkyOnTheGo
{
    public class LiveServicesViewModel : INotifyPropertyChanged
    {
        #region Constructor

        public LiveServicesViewModel()
        {
            this.Albums = new ObservableCollection<SkydriveAlbum>();
        }

        #endregion

        #region Properties

        public ObservableCollection<SkydriveAlbum> Albums { get; private set; }
      
        private string _profileImage;
        private string _fullName;
        /// <summary>
        /// Sample ViewModel property; this property is used in the view to display its value using a Binding
        /// </summary>
        /// <returns></returns>
        public string ProfileImage
        {
            get
            {
                return _profileImage;
            }
            set
            {
                _profileImage = value;
                NotifyPropertyChanged("ProfileImage");
            }
        }

        public string FullName
        {
            get
            {
                return _fullName;
            }
            set
            {
                _fullName = value;
                NotifyPropertyChanged("FullName");
            }
        }

        public bool IsDataLoaded
        {
            get;
            private set;
        }

        private SkydriveAlbum _selectedAlbum;
        /// <summary>
        /// Sample ViewModel property; this property is used in the view to display its value using a Binding
        /// </summary>
        /// <returns></returns>
        public SkydriveAlbum SelectedAlbum
        {
            get
            {
                return _selectedAlbum;
            }
            set
            {
                _selectedAlbum = value;
                NotifyPropertyChanged("SelectedAlbum");
            }
        }

        private SkydrivePhoto _selectedPhoto;
        /// <summary>
        /// Sample ViewModel property; this property is used in the view to display its value using a Binding
        /// </summary>
        /// <returns></returns>
        public SkydrivePhoto SelectedPhoto
        {
            get
            {
                return _selectedPhoto;
            }
            set
            {
                _selectedPhoto = value;
                NotifyPropertyChanged("SelectedPhoto");
            }
        }

        #endregion

        #region Methods

        /// <summary>
        /// Creates and adds a few ItemViewModel objects into the Items collection.
        /// </summary>
        public void LoadData()
        {
            GetProfileData();
            GetAlubmData();
            this.IsDataLoaded = true;
        }

        private void GetProfileData()
        {
            LiveConnectClient clientGetMe = new LiveConnectClient(App.Session);
            clientGetMe.GetCompleted += new EventHandler<LiveOperationCompletedEventArgs>(clientGetMe_GetCompleted);
            clientGetMe.GetAsync("me");

            LiveConnectClient clientGetPicture = new LiveConnectClient(App.Session);
            clientGetPicture.GetCompleted += new EventHandler<LiveOperationCompletedEventArgs>(clientGetPicture_GetCompleted);
            clientGetPicture.GetAsync("me/picture");
        }

        void clientGetPicture_GetCompleted(object sender, LiveOperationCompletedEventArgs e)
        {
            if (e.Error == null)
            {
                ProfileImage = (string)e.Result["location"];
            }
        }

        void clientGetMe_GetCompleted(object sender, LiveOperationCompletedEventArgs e)
        {
            if (e.Error == null)
            {
                FullName = (string)e.Result["name"];
            }
        }

        private void GetAlubmData()
        {
             LiveConnectClient clientFolder = new LiveConnectClient(App.Session);
             clientFolder.GetCompleted += new EventHandler<LiveOperationCompletedEventArgs>(clientFolder_GetCompleted);
             clientFolder.GetAsync("/me/albums");
        }

        void clientFolder_GetCompleted(object sender, LiveOperationCompletedEventArgs e)
        {
            if (e.Error != null)
            {
                return;
            }

            List<object> data = (List<object>)e.Result["data"];

            foreach (IDictionary<string,object> album in data)
            {
                SkydriveAlbum albumItem = new SkydriveAlbum();
                albumItem.Title = (string)album["name"];

                albumItem.Description = (string)album["description"];
                albumItem.ID = (string)album["id"];

                Albums.Add(albumItem);
                GetAlbumPicture(albumItem);
                DownloadPictures(albumItem);
            }
        }

        private void GetAlbumPicture(SkydriveAlbum albumItem)
        {
            LiveConnectClient albumPictureClient = new LiveConnectClient(App.Session);
            albumPictureClient.GetCompleted += new EventHandler<LiveOperationCompletedEventArgs>(albumPictureClient_GetCompleted);
            albumPictureClient.GetAsync(albumItem.ID + "/picture",albumItem);
        }

        void albumPictureClient_GetCompleted(object sender, LiveOperationCompletedEventArgs e)
        {
            if (e.Error == null)
            {
                SkydriveAlbum album = (SkydriveAlbum)e.UserState;
                album.AlbumPicture = (string)e.Result["location"];
            }
        }

        private void DownloadPictures(SkydriveAlbum albumItem)
        {
            LiveConnectClient folderListClient = new LiveConnectClient(App.Session);
            folderListClient.GetCompleted += new EventHandler<LiveOperationCompletedEventArgs>(folderListClient_GetCompleted);
            folderListClient.GetAsync(albumItem.ID + "/files", albumItem);
        }

        void folderListClient_GetCompleted(object sender, LiveOperationCompletedEventArgs e)
        {
            if (e.Error != null)
            {
                return;
            }

            int i = 0;
            SkydriveAlbum album = (SkydriveAlbum)e.UserState;

            album.Photos.Clear();
            List<object> data = (List<object>)e.Result["data"];

            foreach (IDictionary<string, object> photo in data)
            {
                var item = new SkydrivePhoto();
                item.Title = (string)photo["name"];
                item.Subtitle = (string)photo["name"];

                item.PhotoUrl = (string)photo["source"];
                item.Description = (string)photo["description"];
                item.ID = (string)photo["id"];

                if (album != null)
                {
                    album.Photos.Add(item);
                }
                // Stop after downloaing 10 imates
                if (i++ > 10)
                    break;
            }
        }

        #endregion

        #region INPC

        public event PropertyChangedEventHandler PropertyChanged;
    
        private void NotifyPropertyChanged(String propertyName)
        {
            PropertyChangedEventHandler handler = PropertyChanged;
            if (null != handler)
            {
                handler(this, new PropertyChangedEventArgs(propertyName));
            }
        }

        #endregion

        internal void Download()
        {
            if (SelectedPhoto == null)
            {
                return;
            }
                     
            LiveConnectClient downloadClient = new LiveConnectClient(App.Session);
            downloadClient.BackgroundDownloadCompleted +=
                new EventHandler<LiveOperationCompletedEventArgs>(downloadClient_BackgroundDownloadCompleted);

            string path = SelectedPhoto.ID + "/content";
            Uri downloadLocation = new Uri("/shared/transfers/" + SelectedPhoto.Title, UriKind.RelativeOrAbsolute);
            string userState = SelectedPhoto.ID;  // arbitrary string to uniquely identify the request.
            downloadClient.BackgroundDownload(path, downloadLocation, userState);
        }

        private void downloadClient_BackgroundDownloadCompleted(object sender, LiveOperationCompletedEventArgs e)
        {
        }

        internal void Upload()
        {
            PhotoChooserTask task = new PhotoChooserTask();
            task.ShowCamera = true;
            task.Completed += new EventHandler<PhotoResult>(task_Completed);
            task.Show();
        }

        void task_Completed(object sender, PhotoResult e)
        {
            if (e.ChosenPhoto == null)
            {
                return;
            }

            string uploadLocation = "/shared/transfers/Image" + DateTime.Now.Millisecond + ".jpg";
            BackgroundWorker worker = new BackgroundWorker();
            worker.DoWork += (o, args) =>
            {
                using (IsolatedStorageFile store = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    using (IsolatedStorageFileStream stream = store.CreateFile(uploadLocation))
                    {
                        byte[] buffer = new byte[1 << 10];
                        int bytesRead;
                        while ((bytesRead = e.ChosenPhoto.Read(buffer, 0, buffer.Length)) > 0)
                        {
                            stream.Write(buffer, 0, bytesRead);
                        }
                    }
                }
            };

            worker.RunWorkerCompleted += (o, args) =>
            {
                LiveConnectClient uploadClient = new LiveConnectClient(App.Session);
                uploadClient.BackgroundUploadCompleted +=
                    new EventHandler<LiveOperationCompletedEventArgs>(uploadClient_BackgroundUploadCompleted);

                string userState = "myUserState";  // arbitrary string to identify the request.
                uploadClient.BackgroundUpload(SelectedAlbum.ID, new Uri(uploadLocation, UriKind.RelativeOrAbsolute), userState);
            };

            worker.RunWorkerAsync();
        }

        private void uploadClient_BackgroundUploadCompleted(object sender, LiveOperationCompletedEventArgs e)
        {
            if (e.Error == null)
            {
                Deployment.Current.Dispatcher.BeginInvoke(() => DownloadPictures(SelectedAlbum));
            }
        }
    }
}