using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using System.Diagnostics.CodeAnalysis;

namespace SkyDriveUploader
{
    public partial class UploadItem : UserControl
    {
        public FileInfo ItemInfo { get; set; }
        public int ThreadId { get; set; }

        [SuppressMessage("Microsoft.Naming", "CA1704")]
        public UploadItem(FileInfo fi, int id)
        {
            InitializeComponent();

            if (fi != null)
            {
                ItemInfo = fi;
                ThreadId = id;
                txtStatus.Text = fi.Name;
            }
        }
    }
}
