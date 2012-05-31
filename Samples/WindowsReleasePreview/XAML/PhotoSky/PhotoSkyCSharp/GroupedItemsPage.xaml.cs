using PhotoSkyCSharp.Data;

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
using Windows.ApplicationModel.Resources;
using Windows.UI.ApplicationSettings;
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
        Rect _windowBounds;
        double _settingsWidth = 346;
        Popup _settingsPopup;

  


        void OnWindowSizeChanged(object sender, Windows.UI.Core.WindowSizeChangedEventArgs e)
        {
            _windowBounds = Window.Current.Bounds;
        }

        public GroupedItemsPage()
        {
            this.InitializeComponent();

            _windowBounds = Window.Current.Bounds;

            Window.Current.SizeChanged += OnWindowSizeChanged;

            Windows.UI.ApplicationSettings.SettingsPane.GetForCurrentView().CommandsRequested += GroupedItemsPage_CommandsRequested;
            LoadProfile();

        }
        void GroupedItemsPage_CommandsRequested(Windows.UI.ApplicationSettings.SettingsPane sender, Windows.UI.ApplicationSettings.SettingsPaneCommandsRequestedEventArgs args)
        {
            
             
                SettingsCommand cmd = new SettingsCommand("Accounts", "Account", (x) =>
                    {
                        _settingsPopup = new Popup();
                        _settingsPopup.Closed += OnPopupClosed;
                        Window.Current.Activated += OnWindowActivated;
                        _settingsPopup.IsLightDismissEnabled = true;
                        _settingsPopup.Width = _settingsWidth;
                        _settingsPopup.Height = _windowBounds.Height;

                        SimpleSettingsNarrow mypane = new SimpleSettingsNarrow();
                        mypane.Width = _settingsWidth;
                        mypane.Height = _windowBounds.Height;

                        _settingsPopup.Child = mypane;
                        _settingsPopup.SetValue(Canvas.LeftProperty, _windowBounds.Width - _settingsWidth);
                        _settingsPopup.SetValue(Canvas.TopProperty, 0);
                        _settingsPopup.IsOpen = true;
                    });

                args.Request.ApplicationCommands.Add(cmd);
            

        }

        private void OnWindowActivated(object sender, Windows.UI.Core.WindowActivatedEventArgs e)
        {
            if (e.WindowActivationState == Windows.UI.Core.CoreWindowActivationState.Deactivated)
            {
                _settingsPopup.IsOpen = false;
                
            }
        }

        void OnPopupClosed(object sender, object e)
        {
            Window.Current.Activated -= OnWindowActivated;
        }
        
        /// <summary>
        /// Populates the page with content passed during navigation.  Any saved state is also
        /// provided when recreating a page from a prior session.
        /// </summary>
        /// <param name="navigationParameter">The parameter value passed to
        /// <see cref="Frame.Navigate(Type, Object)"/> when this page was initially requested.
        /// </param>
        /// <param name="pageState">A dictionary of state preserved by this page during an earlier
        /// session.  This will be null the first time a page is visited.</param>
        protected override void LoadState(Object navigationParameter, Dictionary<String, Object> pageState)
        {
            // TODO: Create an appropriate data model for your problem domain to replace the sample data
            var sampleDataGroups = SkyDriveDataSource.GetGroups((String)navigationParameter);
            this.DefaultViewModel["Groups"] = sampleDataGroups;
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
            this.Frame.Navigate(typeof(GroupDetailPage), ((SkyDriveAlbum)group).UniqueId);
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
            var itemId = ((SkyDriveItem)e.ClickedItem).UniqueId;
            this.Frame.Navigate(typeof(ItemDetailPage), itemId);
        }


        private async void LoadProfile()
        {
            
        }

    }
}
