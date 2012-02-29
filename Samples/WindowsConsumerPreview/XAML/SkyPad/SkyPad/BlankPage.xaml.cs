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
using Microsoft.Live.Controls;
using Windows.Storage.Streams;
using Windows.UI.Xaml.Media.Imaging;
using Windows.UI.Text;
using Windows.UI;
using System.Text;

// The Blank Page item template is documented at http://go.microsoft.com/fwlink/?LinkId=234238

namespace SkyPad
{



    /// <summary>
    /// An empty page that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class BlankPage : Page
    {

        private LiveConnectClient client = null;

        private Stack<String> folderIds = new Stack<string>();

        Dictionary<String, NoteListItem> notes = null;
        private bool needToSave = false;

        public BlankPage()
        {
            this.InitializeComponent();
            signInBtn.SessionChanged += new EventHandler<LiveConnectSessionChangedEventArgs>(OnSessionChanged);

            newNoteBtn.Click += addBtn_Click;
            deleteNoteBtn.Click += deleteNoteBtn_Click;
            saveBtn.Click += saveBtn_Click;
            cancelBtn.Click += cancelBtn_Click;
        }

        /// <summary>
        /// Invoked when this page is about to be displayed in a Frame.
        /// </summary>
        /// <param name="e">Event data that describes how this page was reached.  The Parameter
        /// property is typically used to configure the page.</param>
        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
        }
        private void OnSessionChanged(Object sender, LiveConnectSessionChangedEventArgs args)
        {
            if (args != null && args.Session != null && args.Status == LiveConnectSessionStatus.Connected)
            {
                this.client = new LiveConnectClient(args.Session);

                if (notes == null)
                {
                    signedInUser();
                }
            }
            else
            {
                signedOutUser();
            }
        }

        private void signedOutUser()
        {
            // User not login, cleanup user data
            notesList.SelectionChanged -= notesList_SelectionChanged;
            notes = null;
            notesEditor.Text = "";
            notesList.Items.Clear();
            noteTitle.Text = "";
            notesEditor.IsReadOnly = true;
            noteTitle.IsReadOnly = true;
            statusTxt.Text = "";
            userImage.Source = null;
            userNameTxt.Text = "";
            folderIds.Clear();
            needToSave = false;
        }

        private void signedInUser()
        {
            getUserPicture();
        }

        private async void getUserPicture()
        {
            try
            {
                LiveOperationResult result = await client.Get("/me/picture");
                dynamic pictureResult = result.Result;
                BitmapImage imgSource = new BitmapImage();
                imgSource.UriSource = new Uri(pictureResult.location, UriKind.Absolute);
                this.userImage.Source = imgSource;
            }
            catch (LiveConnectException e)
            {
                statusTxt.Text = e.Message;
            }
            
            getUserName();
        }




        private async void getUserName()
        {
            try
            {
                LiveOperationResult getMe = await client.Get("/me");
                dynamic user = getMe.Result;
                userNameTxt.Text = user.name;
           
            }
            catch (LiveConnectException e)
            {
                statusTxt.Text = e.Message;
            }
            findNoteList("/me/skydrive");
        }

        private async void findNoteList(String newFolderId)
        {
            // check if we are moving to a child folder or just re-enumerating the current folder
            if (folderIds.Count == 0 || folderIds.Peek() != newFolderId)
            {
                folderIds.Push(newFolderId);
            }

            // AVoid triggering a selection change when the whole list is updated 
            notesList.SelectionChanged -= notesList_SelectionChanged;
            try
            {
                LiveOperationResult filesResult = await client.Get(newFolderId + "/files");
                notes = new Dictionary<string, NoteListItem>();
                notesList.Items.Clear();
                dynamic files = filesResult.Result;
                List<object> data = (List<object>)files.data;

                // Generate parent folder list entry
                if (folderIds.Peek() != "/me/skydrive")
                {
                    createNoteListEntry("..", null, "folder");
                }

                foreach (IDictionary<string, object> datum in data)
                {
                    String name = datum["name"].ToString();
                    String type = datum["type"].ToString();

                    if (type == "folder")
                    {
                        createNoteListEntry(name, datum["id"].ToString(), "folder");
                    }
                    else if (name.EndsWith(".txt"))
                    {
                        name = name.Replace(".txt", null);
                        createNoteListEntry(name, datum["id"].ToString(), "note");
                    }
                }
                statusTxt.Text = "Found " + notesList.Items.Count + " items";
           
            }
            catch (LiveConnectException e)
            {
                 statusTxt.Text = e.Message;
            }

            notesList.SelectionChanged += notesList_SelectionChanged;
            
        }

        private void createNoteListEntry(String name, String id, String type)
        {
            // Add note to dictionaty
            NoteListItem nli = new NoteListItem(id, type);
            notes.Add(name, nli);

            // Create Icon Image
            Image img = new Image();
            BitmapImage bimg = new BitmapImage();

            Uri uri = null;
            if (type == "folder")
            {
                uri = new Uri("ms-resource://skydrivesamplescsharpw8/images/folder.ico");
            }
            else
            {
                uri = new Uri("ms-resource://skydrivesamplescsharpw8/images/note.ico");
            }

            bimg.UriSource = uri;
            img.Source = bimg;

            // Create TextBlock with blank spaces
            TextBlock tb_sp = new TextBlock();
            tb_sp.FontSize = 32.0;
            tb_sp.Text = "   ";

            // Create TextBlock with entry name
            TextBlock tb_name = new TextBlock();
            tb_name.FontSize = 32.0;
            tb_name.VerticalAlignment = VerticalAlignment.Center;
            tb_name.FontWeight = FontWeights.Medium;
            tb_name.Foreground = new SolidColorBrush(Colors.Black);
            tb_name.Text = name;

            StackPanel sp = new StackPanel();
            sp.Orientation = Orientation.Horizontal;
            sp.Children.Add(img);
            sp.Children.Add(tb_sp);
            sp.Children.Add(tb_name);

            notesList.Items.Add(sp);
        }

        private async void deleteNote()
        {
            if (client.Session == null)
            {
                statusTxt.Text = "You need to Sign In";
            }
            else
            {
                statusTxt.Text = "Deleting... " + noteTitle.Text;

                String noteId = notes[noteTitle.Text].id;
                try
                {
                    LiveOperationResult result = await client.Delete(noteId);
                    statusTxt.Text = "Note deleted";

                    saveBtn.IsEnabled = false;
                    addBtn.IsEnabled = true;
                    deleteNoteBtn.IsEnabled = false;
                    cancelBtn.IsEnabled = false;
                    needToSave = false;

                    findNoteList(folderIds.Peek());

                }
                catch (LiveConnectException e)
                {
                }
            }
        }

        private async void saveNote()
        {
            if (client.Session == null)
            {
                statusTxt.Text = "You need to Sign In";
            }
            else
            {
                if (noteTitle.Text.Length == 0)
                {
                    statusTxt.Text = "Please provide a title";
                }
                else
                {
                    statusTxt.Text = "Saving " + noteTitle.Text;

                    UTF8Encoding enc = new UTF8Encoding();
                    var stream = new MemoryStream(enc.GetBytes(notesEditor.Text));

                    String filename = noteTitle.Text + ".txt";
                    try
                    {
                        LiveOperationResult uploadResult = await client.Upload(folderIds.Peek(), filename, stream, true);

                        statusTxt.Text = "File saved";

                        saveBtn.IsEnabled = false;
                        addBtn.IsEnabled = true;
                        deleteNoteBtn.IsEnabled = true;
                        cancelBtn.IsEnabled = false;
                        needToSave = false;

                        findNoteList(folderIds.Peek());
                    }
                    catch (LiveConnectException e)
                    {
                        statusTxt.Text = e.Message;
                    }
                }
            }
        }

        private void addBtn_Click(object sender, RoutedEventArgs e)
        {
            if (needToSave)
            {
                statusTxt.Text = "Save or Cancel before creating a new file";
            }
            else
            {
                noteTitle.Text = "";
                noteTitle.IsReadOnly = false;
                notesEditor.Text = "";
                notesEditor.IsReadOnly = false;
                noteTitle.Focus(Windows.UI.Xaml.FocusState.Keyboard);

                // Enable detecting changes
                notesEditor.TextChanged += notesEditor_TextChanged;
            }
        }


        private void deleteNoteBtn_Click(object sender, RoutedEventArgs e)
        {
            deleteNote();
        }


        private void saveBtn_Click(object sender, RoutedEventArgs e)
        {
            saveNote();
        }

        private void cancelBtn_Click(object sender, RoutedEventArgs e)
        {
            noteTitle.Text = "";
            notesEditor.IsReadOnly = true;
            notesEditor.Text = "";
            noteTitle.IsReadOnly = true;
            saveBtn.IsEnabled = false;
            cancelBtn.IsEnabled = false;
            needToSave = false;
        }

        private void notesList_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            StackPanel sp = (StackPanel)notesList.SelectedItem;
            TextBlock tb = null;

            // Find the name of the note of folder the user clicked on
            foreach (UIElement uie in sp.Children)
            {
                if (uie.GetType().FullName == "Windows.UI.Xaml.Controls.TextBlock")
                {
                    tb = (TextBlock)uie;
                }
            }

            if (notes[tb.Text].type == "folder")
            {
                if (tb.Text == "..")
                {
                    folderIds.Pop();
                    findNoteList(folderIds.Peek());
                }
                else
                {
                    findNoteList(notes[tb.Text].id);
                }
            }
            else
            {
                statusTxt.Text = "Downloading " + tb.Text;
                noteTitle.Text = tb.Text;
                downloadNote(notes[tb.Text].id);
            }
        }

        private async void downloadNote(String noteId)
        {
            if (client == null || client.Session == null)
            {
                statusTxt.Text = "You need to Sign In";
            }
            else
            {
                if (needToSave)
                {
                    statusTxt.Text = "Need to save file.";
                }
                try
                {
                    Stream downloadResult = await client.Download(noteId + "/content?return_ssl_resources=true");

                    // Get the stream with the downloaded file
                    var memoryStream = downloadResult as MemoryStream;

                    // Cursor is at the end of the stream so we need to rewind
                    memoryStream.Seek(0, SeekOrigin.Begin);

                    // Read stream into a byte array
                    byte[] bytes = new byte[1000];
                    int numbytes = memoryStream.Read(bytes, 0, (int)memoryStream.Length);

                    // Prevent loading textbox from firing a text change event
                    notesEditor.TextChanged -= notesEditor_TextChanged;

                    // Load text into the TextBox decoding it as UTF8
                    System.Text.UTF8Encoding enc = new System.Text.UTF8Encoding();
                    notesEditor.Text = enc.GetString(bytes, 0, numbytes);

                    // Enable editing note content
                    notesEditor.IsReadOnly = false;

                    // Set Save status to false
                    needToSave = false;
                    deleteNoteBtn.IsEnabled = true;
                    saveBtn.IsEnabled = false;
                    cancelBtn.IsEnabled = false;

                    // Enable detecting changes
                    notesEditor.TextChanged += notesEditor_TextChanged;

                    statusTxt.Text = "Downloaded note (" + numbytes + " bytes)";

                }
                catch (LiveConnectException e)
                {
                    statusTxt.Text = e.Message;
                }

            }
        }
        private void backBtn_Click(object sender, RoutedEventArgs e)
        {
            Application.Current.Exit();
        }


        private void notesEditor_TextChanged(object sender, TextChangedEventArgs e)
        {
            needToSave = true;
            saveBtn.IsEnabled = true;
            cancelBtn.IsEnabled = true;
        }

    }
}
