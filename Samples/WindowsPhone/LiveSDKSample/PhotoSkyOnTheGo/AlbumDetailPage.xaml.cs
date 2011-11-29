using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using Microsoft.Phone.Controls;

namespace PhotoSkyOnTheGo
{
    public partial class AlbumDetailPage : PhoneApplicationPage
    {
        public AlbumDetailPage()
        {
            InitializeComponent();
        }

        private void PhoneApplicationPage_Loaded(object sender, RoutedEventArgs e)
        {
            this.DataContext = App.ViewModel;
        }

        private void uploadIcon_Click(object sender, System.EventArgs e)
        {
        	App.ViewModel.Upload();
        }

        private void downloadIcon_Click(object sender, System.EventArgs e)
        {
        	App.ViewModel.Download();	
        }
   
    }
}