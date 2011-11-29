
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
using System.Windows.Navigation;
using System.Windows.Shapes;

using System.Web.Script.Serialization;
using System.Net;
using System.IO;

namespace DesktopDemo
{
    public partial class MainWindow : Window
    {

        private static string requestUrl = @"https://apis.live.net/v5.0/";
        public Dictionary<string, string> userData = new Dictionary<string, string>();


        public MainWindow()
        {
            InitializeComponent();

            setUserUI();

        }


        private void setUserUI()
        {
            if (App.Current.Properties.Contains("responseData"))
            {
                makeRequest(requestUrl + "me?" + App.Current.Properties["access_token"]);
            }
        }

        private void makeRequest(string requestUrl)
        {
            WebClient wc = new WebClient();
            wc.DownloadStringCompleted += new DownloadStringCompletedEventHandler(client_DownloadStringCompleted);
            wc.DownloadStringAsync(new Uri(requestUrl));
        }

        void client_DownloadStringCompleted(object sender, DownloadStringCompletedEventArgs e)
        {
            userData = deserializeJson(e.Result);
            changeView();
        }

        private Dictionary<string, string> deserializeJson(string json)
        {
            var jss = new JavaScriptSerializer();
            var d = jss.Deserialize<Dictionary<string, string>>(json);
            return d;
        }

        private void changeView()
        {
            btnSignIn.Visibility = Visibility.Collapsed;
            txtTokens.Visibility = Visibility.Visible;
            if (userData != null)
            {
                txtBlock_Name.Text = userData["name"];
                string imgUrl = requestUrl + "me/picture?" + App.Current.Properties["access_token"];
                imgUser.Source = new BitmapImage(new Uri(imgUrl, UriKind.RelativeOrAbsolute));
                txtTokens.Text += App.Current.Properties["access_token"] + "\r\n\r\n";
                txtTokens.Text += App.Current.Properties["authentication_token"];
            }
        }

        private void btnSignIn_Click(object sender, RoutedEventArgs e)
        {
            BrowserWindow browser = new BrowserWindow();
            browser.Closed += new EventHandler(browser_Closed);
            browser.Show();
        }

        private void btnClear_Click(object sender, RoutedEventArgs e)
        {
            App.Current.Properties.Clear();
            btnSignIn.Visibility = Visibility.Visible;
            txtTokens.Visibility = Visibility.Collapsed;
            txtTokens.Text = "";
            imgUser.Source = null;
            txtBlock_Name.Text = "";
        }

        void browser_Closed(object sender, EventArgs e)
        {
            setUserUI();
        }

        private void Window_Unloaded(object sender, RoutedEventArgs e)
        {
            Application.Current.Shutdown();
        }

    }
}
