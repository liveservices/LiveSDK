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
using Microsoft.Live;
using Microsoft.Live.Controls;

namespace PhotoSkyOnTheGo
{
    public partial class MainPage : PhoneApplicationPage
    {
        // Constructor
        public MainPage()
        {
            InitializeComponent();
            // Set the data context of the listbox control to the sample data
            DataContext = App.ViewModel;
            Loaded += MainPage_Loaded;
        }

        private void MainPage_Loaded(object sender, RoutedEventArgs e)
        {
            Loaded -= MainPage_Loaded;
            if (signInButton.ClientId == "PLACE YOUR CLIENT ID HERE")
            {
                signInButton.Visibility = Visibility.Collapsed;
                infoTextBlock.Text = "In order to use the sample, you must first place your client id " +
                                     "in MainPage.xaml. " +
                                     "For more information see http://go.microsoft.com/fwlink/?LinkId=220871";
            }
        }

        private void SignInButton_SessionChanged(object sender, LiveConnectSessionChangedEventArgs e)
        {
            if (e.Session != null && e.Status == LiveConnectSessionStatus.Connected)
            {
                App.Session = e.Session;
                this.pivotControl.SelectedItem = this.albumPivot;
                if (!App.ViewModel.IsDataLoaded)
                {
                    App.ViewModel.LoadData();
                }
            }

        }

        private void AlbumListBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (App.ViewModel.SelectedAlbum != null)
            {
                NavigationService.Navigate(new Uri("/AlbumDetailPage.xaml", UriKind.Relative));
            }
        }
    }
}