using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Ink;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;

namespace PhotoSkyOnTheGo
{
    public class SkydrivePhoto : INotifyPropertyChanged
    {


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

        private string _photoUrl;
        public string PhotoUrl
        {
            get
            {
                return _photoUrl;
            }
            set
            {
                if (value != _photoUrl)
                {
                    _photoUrl = value;
                    NotifyPropertyChanged("PhotoUrl");
                }
            }
        }
        

        private string _subtitle;
        public string Subtitle
        {
            get
            {
                return _subtitle;
            }
            set
            {
                if (value != _subtitle)
                {
                    _subtitle = value;
                    NotifyPropertyChanged("Subtitle");
                }
            }
        }
        

        private string _title;
        public string Title
        {
            get
            {
                return _title;
            }
            set
            {
                if (value != _title)
                {
                    _title = value;
                    NotifyPropertyChanged("Title");
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