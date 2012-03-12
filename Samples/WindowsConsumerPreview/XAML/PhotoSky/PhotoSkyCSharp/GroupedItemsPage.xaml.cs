using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;
using Microsoft.Live;
using Windows.UI.Xaml.Media.Imaging;

// The Grouped Items Page item template is documented at http://go.microsoft.com/fwlink/?LinkId=234231

namespace PhotoSkyCSharp
{
    /// <summary>
    /// A page that displays a grouped collection of items.
    /// </summary>
    public sealed partial class GroupedItemsPage : PhotoSkyCSharp.Common.LayoutAwarePage
    {
        public GroupedItemsPage()
        {
            this.InitializeComponent();
        }

        /// <summary>
        /// Invoked when this page is about to be displayed in a Frame.
        /// </summary>
        /// <param name="e">Event data that describes how this page was reached.  The Parameter
        /// property provides the grouped collection of items to be displayed.</param>
        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            this.DefaultViewModel["Groups"] = e.Parameter;
        }

        /// <summary>
        /// Invoked when a group header is clicked.
        /// </summary>
        /// <param name="sender">The Button used as a group header for the selected group.</param>
        /// <param name="e">Event data that describes how the click was initiated.</param>
        void Header_Click(object sender, RoutedEventArgs e)
        {
            // Determine what group the Button instance represents
            var group = (sender as FrameworkElement).DataContext;

            // Navigate to the appropriate destination page, configuring the new page
            // by passing required information as a navigation parameter
            this.Frame.Navigate(typeof(GroupDetailPage), group);
        }

        /// <summary>
        /// Invoked when an item within a group is clicked.
        /// </summary>
        /// <param name="sender">The GridView (or ListView when the application is snapped)
        /// displaying the item clicked.</param>
        /// <param name="e">Event data that describes the item clicked.</param>
        void ItemView_ItemClick(object sender, ItemClickEventArgs e)
        {
            // Navigate to the appropriate destination page, configuring the new page
            // by passing required information as a navigation parameter
            this.Frame.Navigate(typeof(ItemDetailPage), e.ClickedItem);
        }

        private void btnSignIn_SessionChanged(object sender, Microsoft.Live.Controls.LiveConnectSessionChangedEventArgs e)
        {
            if (e.Status == LiveConnectSessionStatus.Connected)
            {
                App.Session = e.Session;
                LoadProfile();
            }
            else
            {
                btnSignIn.Visibility = Windows.UI.Xaml.Visibility.Visible;
            }
        }

        private async void LoadProfile()
        {
            LiveConnectClient client = new LiveConnectClient(App.Session);
            LiveOperationResult liveOpResult = await client.Get("me");
            dynamic dynResult = liveOpResult.Result;
            this.txtUserName.Text = dynResult.name;

            liveOpResult = await client.Get("me/picture");
            dynResult = liveOpResult.Result;
            this.imgProfile.Source = new BitmapImage(new Uri(dynResult.location)); 
        }

       
    }
}
