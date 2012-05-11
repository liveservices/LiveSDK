using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Browser;
using System.IO;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using System.Windows.Browser;
using System.ComponentModel;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;

namespace SkyDriveUploader
{
    [ScriptableType]
    public partial class MainPage : UserControl
    {
        #region Vars and Props
        [ScriptableMember]
        public string Token { get; set; }
        [ScriptableMember]
        public bool IsSignIn { get; set; }
        private BackgroundWorker[] workers = new BackgroundWorker[GlobalMembers.MaxThread];
        #endregion

        public MainPage()
        {
            InitializeComponent();
            initWorkers();
        }

        [ScriptableMember]
        public void OnConsent()
        {
            if (listUploadItems.Items.Count > 0 && !btnUpload.IsEnabled)
                btnUpload.IsEnabled = true;
        }

        #region Upload
        private void initWorkers()
        {
            for (int i = 0; i < workers.Length; i++)
            {
                workers[i] = new BackgroundWorker();
                workers[i].DoWork += new DoWorkEventHandler(worker_DoWork);
                workers[i].RunWorkerCompleted += new RunWorkerCompletedEventHandler(worker_RunWorkerCompleted);
                workers[i].ProgressChanged += new ProgressChangedEventHandler(worker_ProgressChanged);
                workers[i].WorkerReportsProgress = true;
                workers[i].WorkerSupportsCancellation = true;
            }
        }

        /// <summary>
        /// Upload file asynchronously by POST
        /// </summary>
        /// <param name="requestUrl">Url to upload to</param>
        /// <param name="data">File stream</param>
        /// <param name="fileName">File name</param>
        /// <param name="id">Thread id</param>
        [SuppressMessage("Microsoft.Performance", "CA1811")]
        private void UploadFile(string requestUrl, Stream data, string fileName, int id)
        {
            UriBuilder ub = new UriBuilder(requestUrl);
            ub.Query = string.Format(CultureInfo.InvariantCulture, GlobalMembers.UriBuilderQuery, Token);
            WebClient wc = new WebClient();
            wc.Headers[GlobalMembers.WebClientHeaderName] = GlobalMembers.WebClientHeaderValue;

            wc.OpenWriteCompleted += (sender, e) =>
            {
                if (!workers[id].IsBusy)
                    workers[id].RunWorkerAsync(new ThreadData { Id = id, FileName = fileName, Input = data, Output = e.Result });
            };

            wc.OpenWriteAsync(ub.Uri);
        }

        private void worker_DoWork(object sender, DoWorkEventArgs e)
        {
            try
            {
                ThreadData data = e.Argument as ThreadData;

                byte[] buffer = new byte[255];
                int bytesRead;
                double totalBytesRead = 0;
                double totalSize = data.Input.Length;

                // Add header 
                UTF8Encoding encoding = new UTF8Encoding();
                Byte[] bytes = encoding.GetBytes(GlobalMembers.StreamHeaderBoundaryStart + 
                                                 GlobalMembers.StreamHeaderContentDisposition + data.FileName + 
                                                 GlobalMembers.StreamHeaderContentType);
                data.Output.Write(bytes, 0, bytes.Length);

                // Write the file content
                while ((bytesRead = data.Input.Read(buffer, 0, buffer.Length)) != 0)
                {
                    data.Output.Write(buffer, 0, bytesRead);
                    totalBytesRead += bytesRead;
                    System.Threading.Thread.Sleep(10);
                    workers[data.Id].ReportProgress((int)((totalBytesRead / totalSize) * 100), data.FileName);
                }

                // Close the boundary
                bytes = encoding.GetBytes(GlobalMembers.StreamHeaderBoundaryEnd);
                data.Output.Write(bytes, 0, bytes.Length);

                data.Input.Close();
                data.Output.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
                throw;
            }
        }

        [SuppressMessage("Microsoft.Globalization", "CA1303")]
        private void worker_ProgressChanged(object sender, ProgressChangedEventArgs e)
        {
            foreach (UploadItem item in listUploadItems.Items)
            {
                if (item.ItemInfo.Name == e.UserState.ToString())
                {
                    if (e.ProgressPercentage < 100)
                        item.txtStatus.Text = "Uploading " + item.ItemInfo.Name + "... " + e.ProgressPercentage + "%";
                    else
                        item.txtStatus.Text = item.ItemInfo.Name + " upload complete.";
                    item.pgStatus.Value = item.pgStatus.Maximum * ((double)e.ProgressPercentage / 100d);
                    this.UpdateLayout();
                }
            }
        }

        private void worker_RunWorkerCompleted(object sender, RunWorkerCompletedEventArgs e)
        {
            for (int i = 0; i < workers.Length; i++)
            {
                if (workers[i].IsBusy)
                    return;                
            }

            HtmlPage.Window.Invoke(GlobalMembers.FuncDisableSignInButton, false);
            btnAdd.IsEnabled = true;
            btnClear.IsEnabled = true;
            btnUpload.IsEnabled = true;
            this.UpdateLayout();
        }
        #endregion

        #region Events
        [SuppressMessage("Microsoft.Performance", "CA1811")]
        private void btnAdd_Click(object sender, RoutedEventArgs e)
        {
            OpenFileDialog dlg = new OpenFileDialog();
            dlg.Filter = GlobalMembers.SupportedFileType;
            dlg.FilterIndex = 1;
            dlg.Multiselect = false;

            if ((bool)dlg.ShowDialog())
            {
                foreach (UploadItem ui in listUploadItems.Items)
                {
                    if (ui.ItemInfo.Name == dlg.File.Name)
                        return;
                }
                
                int itemId = listUploadItems.Items.Count;
                if (itemId < GlobalMembers.MaxThread)
                {
                    UploadItem item = new UploadItem(dlg.File, itemId);
                    listUploadItems.Items.Add(item);

                    if (IsSignIn && !btnUpload.IsEnabled)
                        btnUpload.IsEnabled = true;
                }
            }
        }

        [SuppressMessage("Microsoft.Performance", "CA1811")]
        private void btnClear_Click(object sender, RoutedEventArgs e)
        {
            listUploadItems.Items.Clear();
            if (btnUpload.IsEnabled)
                btnUpload.IsEnabled = false;
        }

        [SuppressMessage("Microsoft.Performance", "CA1811")]
        private void btnUpload_Click(object sender, RoutedEventArgs e)
        {
            HtmlPage.Window.Invoke(GlobalMembers.FuncDisableSignInButton, true);
            btnAdd.IsEnabled = false;
            btnClear.IsEnabled = false;
            btnUpload.IsEnabled = false;

            foreach (UploadItem item in listUploadItems.Items)
            {
                UploadFile(GlobalMembers.RequestUrl, item.ItemInfo.OpenRead(), item.ItemInfo.Name, item.ThreadId);
            }
        }
        #endregion
    }
}
