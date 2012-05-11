
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using System.Text.RegularExpressions;

namespace DesktopDemo
{
     public partial class BrowserWindow : Window
    {
        static string scope = "wl.basic";
        static string client_id = "[YOUR_CLIENT_ID]";
        private static Uri signInUrl = new Uri(String.Format(@"https://oauth.live.com/authorize?client_id={0}&redirect_uri=https://oauth.live.com/desktop&response_type=token&scope={1}", client_id, scope));
        MainWindow mainWindow = new MainWindow();

        public BrowserWindow()
        {
            InitializeComponent();
            webBrowser.Navigate(signInUrl);
        }

        private void webBrowser_LoadCompleted(object sender, System.Windows.Navigation.NavigationEventArgs e)
        {
            if (e.Uri.Fragment.Contains("access_token"))
            {
                if (App.Current.Properties.Contains("responseData"))
                {
                    App.Current.Properties.Clear();
                }
                App.Current.Properties.Add("responseData", 1);
                string[] responseAll = Regex.Split(e.Uri.Fragment.Remove(0, 1), "&");

                for (int i = 0; i < responseAll.Count(); i++)
                {
                    string[] nvPair = Regex.Split(responseAll[i], "=");
                    App.Current.Properties.Add(nvPair[0], responseAll[i]);
                }
                this.Close();
            }
        }
    }
}
