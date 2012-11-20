using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using PhotoSkyCSharp.Data;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.UI.ApplicationSettings;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;

namespace PhotoSkyCSharp
{
    public sealed partial class SimpleSettingsNarrow : UserControl
    {
        public SimpleSettingsNarrow()
        {
            this.InitializeComponent();
            Windows.Security.Authentication.OnlineId.OnlineIdAuthenticator aut = new Windows.Security.Authentication.OnlineId.OnlineIdAuthenticator();
            if (!aut.CanSignOut)
            {
                this.btnSignOut.Visibility = Windows.UI.Xaml.Visibility.Collapsed;
            }
            this.txtUserName.Text = App.UserName;
        }

        private void MySettingsBackClicked(object sender, RoutedEventArgs e)
        {
            if (this.Parent.GetType() == typeof(Popup))
            {
                ((Popup)this.Parent).IsOpen = false;
            }
            
            SettingsPane.Show();
        }

        private void HyperlinkButton_Click_1(object sender, RoutedEventArgs e)
        {
            SkyDriveDataSource.authClient.Logout();
        }
    }
}
