//-----------------------------------------------------------------------
// <copyright file="MainPage.xaml.cs" company="Microsoft Corp.">
//     Copyright Microsoft Corp. All rights reserved.
// </copyright>
//-----------------------------------------------------------------------

namespace SkyDrive_Photos_Sample
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Net;
    using System.Runtime.Serialization.Json;
    using System.Windows;
    using Microsoft.Phone.Controls;
    using System.Windows.Controls;
    using System.Windows.Navigation;
    using System.Windows.Media;
    using System.Windows.Media.Imaging;


    /// <summary>
    /// Used to indicate what data is being returned by a particular HTTP request
    /// </summary>
    public enum Results{UserInfo, AlbumInfo};

    /// <summary>
    /// The main landing page.
    /// </summary>
    public partial class MainPage : PhoneApplicationPage
    {
        /// <summary>
        /// The URI for the OAuth service's Authorize endpoint.
        /// </summary>
        private static readonly string OAuthAuthorizeUri = "https://oauth.live.com/authorize";

        /// <summary>
        /// The URI for the API service endpoint.
        /// </summary>
        private static readonly string ApiServiceUri = "https://apis.live.net/v5.0/";

        /// <summary>
        /// The applications client ID.
        /// </summary>
        private static readonly string ClientId = /* insert client ID here - go to http://manage.dev.live.com to get one */ ;

        /// <summary>
        /// The applications redirect URI (does not need to exist).
        /// </summary>
        private static readonly string RedirectUri = "https://oauth.live.com/desktop";

        /// <summary>
        /// Holds the retrieved access token.
        /// </summary>
        private string accessToken;

        /// <summary>
        /// The list of scopes.
        /// </summary>
        private string[] scopes = new string[] { "wl.basic", "wl.photos" };

        /// <summary>
        /// The resource to request.
        /// </summary>
        private string user = "me";

        /// <summary>
        /// The user's album resource
        /// </summary>
        private string albums = "me/albums";

        /// <summary>
        /// Initializes a new instance of the <see cref="MainPage"/> class.
        /// </summary>
        public MainPage()
        {
            this.InitializeComponent();
        }

        /// <summary>
        /// Override the back key press to prevent application exit when the popup is open.
        /// </summary>
        /// <param name="e">The event data.</param>
        protected override void OnBackKeyPress(CancelEventArgs e)
        {
            if (this.authorizationBrowser.Visibility == Visibility.Visible)
            {
                this.CompleteOAuthFlow(false);
                e.Cancel = true;
            }
            else
            {
                base.OnBackKeyPress(e);
            }
        }

        /// <summary>
        /// Launch the OAuth flow.
        /// </summary>
        private void LaunchOAuthFlow()
        {
            this.loadingGrid.Visibility = Visibility.Visible;
            this.authorizationBrowser.Navigating += this.OnAuthorizationBrowserNavigating;
            this.authorizationBrowser.Navigated += this.OnAuthorizationBrowserNavigated;
            this.authorizationBrowser.Navigate(this.BuildOAuthUri(this.scopes));
        }

        /// <summary>
        /// Complete the OAuth flow.
        /// </summary>
        /// <param name="success">Whether the operation was successful.</param>
        private void CompleteOAuthFlow(bool success)
        {
            this.authorizationBrowser.Navigated -= this.OnAuthorizationBrowserNavigated;
            this.authorizationBrowser.Navigating -= this.OnAuthorizationBrowserNavigating;

            this.authorizationBrowser.NavigateToString(String.Empty);
            this.authorizationBrowser.Visibility = Visibility.Collapsed;

            if (success)
            {
                this.GetUserData();
                this.signInButton.Visibility = Visibility.Collapsed;
            }
        }

        /// <summary>
        /// Retrieve the user's information from the API service.
        /// </summary>
        private void GetUserData()
        {
            this.loadingGrid.Visibility = Visibility.Visible;
            WebClient client = new WebClient();
            client.OpenReadCompleted += this.OnClientOpenReadComplete;
            client.OpenReadAsync(this.BuildApiUri(this.user), Results.UserInfo);
 
        }

        /// <summary>
        /// Complete the operation and display the output.
        /// </summary>
        /// <param name="info">The user information.</param>
        private void GetUserDataComplete(UserInfo info)
        {          
                string output = String.Format(
                    "First Name: {0}\nLast Name: {1}\nLink: {2}\n",
                    info.FirstName,
                    info.LastName,
                    info.Link);
                this.outputText.Text = output + this.outputText.Text;

                this.loadingGrid.Visibility = Visibility.Collapsed;
                this.outputText.Visibility = System.Windows.Visibility.Visible;            
        }
          

        /// <summary>
        /// Complete the operation and display the photo albums
        /// </summary>
        /// <param name="albums">The user's albums</param>
        private void GetAlbumDataComplete(Albums albumList)
        {
        
                this.outputText.Text = this.outputText.Text + "\nSkyDrive Albums\n";
                foreach (AlbumInfo info in albumList.data)
                {
                    string s = (info.Count == 1 ? String.Empty : "s"); 
                    this.outputText.Text += String.Format("{0} ({1} photo{2})\n", info.Name, info.Count, s);                   
                }                
        }

        /// <summary>
        /// Build the API service URI.
        /// </summary>
        /// <param name="path">The relative path requested.</param>
        /// <returns>The request URI.</returns>
        private Uri BuildApiUri(string path)
        {
            UriBuilder builder = new UriBuilder(MainPage.ApiServiceUri);
            builder.Path += path;
            builder.Query = "access_token=" + HttpUtility.UrlEncode(this.accessToken);
            return builder.Uri;
        }

        /// <summary>
        /// Build the OAuth URI.
        /// </summary>
        /// <param name="scopes">The requested scopes.</param>
        /// <returns>The OAuth URI.</returns>
        private Uri BuildOAuthUri(string[] scopes)
        {
            List<string> paramList = new List<string>();
            paramList.Add("client_id=" + HttpUtility.UrlEncode(MainPage.ClientId));
            paramList.Add("scope=" + HttpUtility.UrlEncode(String.Join(" ", scopes)));
            paramList.Add("response_type=" + HttpUtility.UrlEncode("token"));
            paramList.Add("display=" + HttpUtility.UrlEncode("touch"));
            paramList.Add("redirect_uri=" + HttpUtility.UrlEncode(MainPage.RedirectUri));

            UriBuilder authorizeUri = new UriBuilder(MainPage.OAuthAuthorizeUri);
            authorizeUri.Query = String.Join("&", paramList.ToArray());
            return authorizeUri.Uri;
        }

        /// <summary>
        /// Process the URI fragment string.
        /// </summary>
        /// <param name="fragment">The URI fragment.</param>
        /// <returns>The key-value pairs.</returns>
        private Dictionary<string, string> ProcessFragments(string fragment)
        {
            Dictionary<string, string> processedFragments = new Dictionary<string, string>();

            if (fragment[0] == '#')
            {
                fragment = fragment.Substring(1);
            }

            string[] fragmentParams = fragment.Split('&');

            foreach (string fragmentParam in fragmentParams)
            {
                string[] keyValue = fragmentParam.Split('=');

                if (keyValue.Length == 2)
                {
                    processedFragments.Add(keyValue[0], HttpUtility.UrlDecode(keyValue[1]));
                }
            }

            return processedFragments;
        }

        /// <summary>
        /// Handles the click event of the sign in button.
        /// </summary>
        /// <param name="sender">The source of the event.</param>
        /// <param name="e">The event data.</param>
        private void OnSignInButtonClicked(object sender, RoutedEventArgs e)
        {
            this.LaunchOAuthFlow();
        }

        /// <summary>
        /// Handles the navigating event of the OAuth web browser control.
        /// </summary>
        /// <param name="sender">The source of the event.</param>
        /// <param name="e">The event data.</param>
        private void OnAuthorizationBrowserNavigated(object sender, NavigationEventArgs e)
        {
            this.authorizationBrowser.Navigated -= this.OnAuthorizationBrowserNavigated;
            this.loadingGrid.Visibility = Visibility.Collapsed;
            this.authorizationBrowser.Visibility = Visibility.Visible;
        }

        /// <summary>
        /// Handles the navigating event of the OAuth web browser control.
        /// </summary>
        /// <param name="sender">The source of the event.</param>
        /// <param name="e">The event data.</param>
        private void OnAuthorizationBrowserNavigating(object sender, NavigatingEventArgs e)
        {
            Uri uri = e.Uri;

            if (uri != null && uri.AbsoluteUri.StartsWith(MainPage.RedirectUri))
            {
                Dictionary<string, string> fragments = this.ProcessFragments(uri.Fragment);

                bool success = fragments.TryGetValue("access_token", out this.accessToken);

                e.Cancel = true;
                this.CompleteOAuthFlow(success);
            }
        }

        /// <summary>
        /// Handles the open read complete event of the <see cref="WebClient"/> object.
        /// </summary>
        /// <param name="sender">The source of the event.</param>
        /// <param name="e">The event data.</param>
        private void OnClientOpenReadComplete(object sender, OpenReadCompletedEventArgs e)
        {
            DataContractJsonSerializer deserializer; 

            if (e.UserState.Equals(Results.UserInfo))
            {
                deserializer = new DataContractJsonSerializer(typeof(UserInfo));
                UserInfo userInfo = (UserInfo)deserializer.ReadObject(e.Result);
                this.GetUserDataComplete(userInfo);

                WebClient client = new WebClient();
                client.OpenReadCompleted += this.OnClientOpenReadComplete;            
                client.OpenReadAsync(this.BuildApiUri(this.albums), Results.AlbumInfo);
            }
            else if (e.UserState.Equals(Results.AlbumInfo))
            {
                deserializer = new DataContractJsonSerializer(typeof(Albums));
                Albums albumInfo = (Albums)deserializer.ReadObject(e.Result);
                this.GetAlbumDataComplete(albumInfo);
            }
        }
    }
}