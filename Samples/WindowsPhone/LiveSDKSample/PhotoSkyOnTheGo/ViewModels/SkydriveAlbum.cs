using System;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Ink;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using System.ComponentModel;
using System.Collections.ObjectModel;

namespace PhotoSkyOnTheGo
{
    public class SkydriveAlbum: INotifyPropertyChanged
    {
        public SkydriveAlbum()
        {
            this.Photos = new ObservableCollection<SkydrivePhoto>();
        }



        /// <summary>
        /// A collection for ItemViewModel objects.
        /// </summary>
        public ObservableCollection<SkydrivePhoto> Photos { get; private set; }

        private string _id = string.Empty;
        public string ID
        {
            get
            {
                return this._id;
            }

            set
            {
                if (this._id != value)
                {
                    this._id = value;
                    this.NotifyPropertyChanged("ID");
                }
            }
        }

        private string _title = string.Empty;
        public string Title
        {
            get
            {
                return this._title;
            }

            set
            {
                if (this._title != value)
                {
                    this._title = value;
                    this.NotifyPropertyChanged("Title");
                }
            }
        }

        private string _albumPicture = string.Empty;
        public string AlbumPicture
        {
            get
            {
                return this._albumPicture;
            }

            set
            {
                if (this._albumPicture != value)
                {
                    this._albumPicture = value;
                    this.NotifyPropertyChanged("AlbumPicture");
                }
            }
        }

        private string _description = string.Empty;
        public string Description
        {
            get
            {
                return this._description;
            }

            set
            {
                if (this._description != value)
                {
                    this._description = value;
                    this.NotifyPropertyChanged("Description");
                }
            }
        }


        public event PropertyChangedEventHandler PropertyChanged;
        private void NotifyPropertyChanged(String propertyName)
        {
            PropertyChangedEventHandler handler = PropertyChanged;
            if (null != handler)
            {
                handler(this, new PropertyChangedEventArgs(propertyName));
            }
        }
    }
}
