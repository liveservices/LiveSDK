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

        #region Private Members
        /// <summary>
        /// A collection for ItemViewModel objects.
        /// </summary>
      
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
            if (e.Error == null)
            {
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
            if (e.Error == null)
            {
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
                return;
         
                     
            LiveConnectClient downloadClient = new LiveConnectClient(App.Session);
            downloadClient.DownloadCompleted += new EventHandler<LiveDownloadCompletedEventArgs>(downloadClient_DownloadCompleted);
            downloadClient.DownloadAsync(SelectedPhoto.ID+"/content");
        }

        void downloadClient_DownloadCompleted(object sender, LiveDownloadCompletedEventArgs e)
        {
            if (e.Error == null)
            {
                MemoryStream outputStream = (MemoryStream)e.Result;


                // Create a filename for JPEG file in isolated storage.  
                String tempJPEG = SelectedPhoto.Title;

                // Create virtual store and file stream. Check for duplicate tempJPEG files.  
                var myStore = IsolatedStorageFile.GetUserStoreForApplication();
                if (myStore.FileExists(tempJPEG))
                {
                    myStore.DeleteFile(tempJPEG);
                }
                IsolatedStorageFileStream myFileStream = myStore.CreateFile(tempJPEG);
                myFileStream.Write(outputStream.GetBuffer(), 0, (int)outputStream.Length);
                myFileStream.Close();
            }
   
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
                return;

            LiveConnectClient uploadClient = new LiveConnectClient(App.Session);
            uploadClient.UploadCompleted += new EventHandler<LiveOperationCompletedEventArgs>(uploadClient_UploadCompleted);
            uploadClient.UploadAsync(SelectedAlbum.ID, "Image"+DateTime.Now.Millisecond+".jpg", e.ChosenPhoto);
        }

        void uploadClient_UploadCompleted(object sender, LiveOperationCompletedEventArgs e)
        {
            if (e.Error == null)
            {
                
                Deployment.Current.Dispatcher.BeginInvoke(() => DownloadPictures(SelectedAlbum));
               
            }
        }
    }
}