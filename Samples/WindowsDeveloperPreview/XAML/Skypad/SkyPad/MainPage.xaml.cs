using System;
using System.Collections.Generic;
using System.IO;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Microsoft.Live;
using Microsoft.Live.Controls;
using Windows.UI.Xaml.Media.Imaging;
using Windows.UI.Xaml.Media;
using System.Text;
using System.Threading.Tasks;
using Windows.Storage.Streams;

namespace SkyPad
{
    partial class MainPage
    {
        private LiveConnectClient client = null;

        private Stack<String> folderIds = new Stack<string>();

        Dictionary<String, noteListItem> notes = null;
        private bool needToSave = false;

        public MainPage()
        {
            InitializeComponent();

            signInBtn.SessionChanged += new EventHandler<LiveConnectSessionChangedEventArgs>(OnSessionChanged);

            newNoteBtn.Click += addBtn_Click;
            deleteNoteBtn.Click += deleteNoteBtn_Click;
            saveBtn.Click += saveBtn_Click;
            cancelBtn.Click += cancelBtn_Click;
        }


        private void OnSessionChanged(Object sender, LiveConnectSessionChangedEventArgs args)
        {
            if (args != null && args.Session != null && args.Session.Status == LiveConnectSessionStatus.Connected)
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

        private void getUserPicture()
        {
            var memoryStream = new InMemoryRandomAccessStream();
            client.DownloadCompleted += new EventHandler<LiveOperationCompletedEventArgs>(getUserPicture_Callback);
            client.DownloadAsync("/me/picture?return_ssl_resources=true", memoryStream.OpenWrite(), memoryStream);
        }

        private void getUserPicture_Callback(object sender, LiveOperationCompletedEventArgs e)
        {
           client.DownloadCompleted -= getUserPicture_Callback;

           if (e.Error == null)
            {
                IRandomAccessStream imageStream = e.UserState as IRandomAccessStream;

                if (imageStream != null)
                {
                    BitmapImage imgSource = new BitmapImage();
                    imgSource.SetSource(imageStream);
                    this.userImage.Source = imgSource;
                }
                else
                {
                    statusTxt.Text = "Could not find user's picture";
                }
            }
            else
            {
                statusTxt.Text = e.Error.Message;
            }

            getUserName();
        }

        private void getUserName()
        {
            client.GetCompleted += new EventHandler<LiveOperationCompletedEventArgs>(getUserName_Callback);
            client.GetAsync("/me");
        }

        private void getUserName_Callback(object sender, LiveOperationCompletedEventArgs e)
        {
            client.GetCompleted -= getUserName_Callback;

            if (e.Error == null)
            {
                var user = e.Result;
                userNameTxt.Text = user["name"].ToString();
            }
            else
            {
                statusTxt.Text = e.Error.Message;
            }

            findNoteList("/me/skydrive");
        }

        private void findNoteList(String newFolderId)
        {
            // check if we are moving to a child folder or just re-enumerating the current folder
            if (folderIds.Count == 0 || folderIds.Peek() != newFolderId)
            {
                folderIds.Push(newFolderId);
            }

            // AVoid triggering a selection change when the whole list is updated 
            notesList.SelectionChanged -= notesList_SelectionChanged;

            client.GetCompleted += new EventHandler<LiveOperationCompletedEventArgs>(findNoteList_Callback);
            client.GetAsync(newFolderId + "/files");
        }

        void findNoteList_Callback(object sender, LiveOperationCompletedEventArgs e)
        {
            client.GetCompleted -= findNoteList_Callback;

            if (e.Error == null)
            {
                notes = new Dictionary<string, noteListItem>();
                notesList.Items.Clear();

                List<object> data = (List<object>)e.Result["data"];

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
            else
            {
                statusTxt.Text = e.Error.Message;
            }

            notesList.SelectionChanged += notesList_SelectionChanged;
        }

        private void createNoteListEntry(String name, String id, String type)
        {
            // Add note to dictionaty
            noteListItem nli = new noteListItem(id, type);
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

        private void deleteNote()
        {
            if (client.Session == null || client.Session.Status != LiveConnectSessionStatus.Connected)
            {
                statusTxt.Text = "You need to Sign In";
            }
            else
            {
                statusTxt.Text = "Deleting... " + noteTitle.Text;

                String noteId = notes[noteTitle.Text].id;

                client.DeleteCompleted += new EventHandler<LiveOperationCompletedEventArgs>(deleteNote_Callback);
                client.DeleteAsync(noteId);
            }
        }

        private void deleteNote_Callback(object sender, LiveOperationCompletedEventArgs e)
        {
            client.DeleteCompleted -= deleteNote_Callback;

            if (e.Error == null)
            {
                statusTxt.Text = "Note deleted";

                saveBtn.IsEnabled = false;
                addBtn.IsEnabled = true;
                deleteNoteBtn.IsEnabled = false;
                cancelBtn.IsEnabled = false;
                needToSave = false;

                findNoteList(folderIds.Peek());
            }
            else
            {
                statusTxt.Text = e.Error.Message;
            }

        }
        private void saveNote()
        {
            if (client.Session == null || client.Session.Status != LiveConnectSessionStatus.Connected)
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

                    System.Text.UTF8Encoding enc = new UTF8Encoding();
                    var stream = new MemoryStream(enc.GetBytes(notesEditor.Text));

                    String filename = noteTitle.Text + ".txt";

                    client.UploadCompleted += new EventHandler<LiveOperationCompletedEventArgs>(saveNote_Callback);
                    client.UploadAsync(folderIds.Peek(), filename, true, stream, stream);
                }
            }
        }

        void saveNote_Callback(object sender, LiveOperationCompletedEventArgs e)
        {
            client.UploadCompleted -= saveNote_Callback;

            if (e.Error == null)
            {
                statusTxt.Text = "File saved";

                saveBtn.IsEnabled = false;
                addBtn.IsEnabled = true;
                deleteNoteBtn.IsEnabled = true;
                cancelBtn.IsEnabled = false;
                needToSave = false;

                findNoteList(folderIds.Peek());
            }
            else
            {
                statusTxt.Text = e.Error.Message;
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
                noteTitle.Focus();

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

        private void downloadNote(String noteId)
        {
            if (client == null || client.Session == null || client.Session.Status != LiveConnectSessionStatus.Connected)
            {
                statusTxt.Text = "You need to Sign In";
            }
            else
            {
                if (needToSave)
                {
                    statusTxt.Text = "Need to save file.";
                }
                var stream = new MemoryStream();

                client.DownloadCompleted += new EventHandler<LiveOperationCompletedEventArgs>(downloadNote_Callback);
                client.DownloadAsync(noteId + "/content?return_ssl_resources=true", stream, stream);
            }
        }

        private void downloadNote_Callback(object sender, LiveOperationCompletedEventArgs e)
        {
            client.DownloadCompleted -= downloadNote_Callback;

            if (e.Error == null)
            {
                // Get the stream with the downloaded file
                var memoryStream = e.UserState as MemoryStream;

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
            else
            {
                statusTxt.Text = e.Error.Message;
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

        private class noteListItem
        {
            public String id;
            public String type;

            public noteListItem(String id, String type)
            {
                this.id = id;
                this.type = type;
            }
        }
    }
}