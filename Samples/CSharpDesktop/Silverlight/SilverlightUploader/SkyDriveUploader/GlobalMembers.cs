using System;
using System.IO;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Ink;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;

namespace SkyDriveUploader
{
    public static class GlobalMembers
    {
        public const string RequestUrl = "https://apis.live.net/v5.0/me/skydrive/files/";
        public const string SupportedFileType = "Supported Files (*.ARW;*.CR2;*.CRW;*.DOC;*.DOCM;*.DOCX;*.DOT;*.DOTM;*.DOTX;*.ERF;*.GIF;*.JPG;*.MEF;*.MP4;*.MRW;*.NEF;*.NRW;*.ONE;*.ORF;*.PDF;*.PEF;*.PNG;*.POT;*.POTM;*.POTX;*.PPS;*.PPSM;*.PPSX;*.PPT;*.PPTM;*.PPTX;*.RAW;*.RW2;*.RWL;*.SR2;*.TIF;*.TIFF;*.TXT;*.WMV;*.XLS;*.XLSB;*.XLSM;*.XLSX)|*.ARW;*.CR2;*.CRW;*.DOC;*.DOCM;*.DOCX;*.DOT;*.DOTM;*.DOTX;*.ERF;*.GIF;*.JPG;*.MEF;*.MP4;*.MRW;*.NEF;*.NRW;*.ONE;*.ORF;*.PDF;*.PEF;*.PNG;*.POT;*.POTM;*.POTX;*.PPS;*.PPSM;*.PPSX;*.PPT;*.PPTM;*.PPTX;*.RAW;*.RW2;*.RWL;*.SR2;*.TIF;*.TIFF;*.TXT;*.WMV;*.XLS;*.XLSB;*.XLSM;*.XLSX";
        public const string UriBuilderQuery = "access_token={0}";
        public const string WebClientHeaderName = "Content-Type";
        public const string WebClientHeaderValue = "multipart/form-data; boundary=A300x";
        public const string StreamHeaderBoundaryStart = "--A300x\r\n";
        public const string StreamHeaderContentDisposition = "Content-Disposition: form-data; name=\"file\"; filename=\"";
        public const string StreamHeaderContentType = "\"\r\nContent-Type: application/octet-stream\r\n\r\n";
        public const string StreamHeaderBoundaryEnd = "\r\n--A300x--\r\n";
        public const string FuncDisableSignInButton = "disableSignInButton";
        public const int MaxThread = 100;
    }

    public class ThreadData
    {
        public int Id { get; set; }
        public string FileName { get; set; }
        public Stream Input { get; set; }
        public Stream Output { get; set; }
    }
}
