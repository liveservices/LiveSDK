//-------------------------------------------------------------------------------------------------
// <copyright file="LiveConnectClientTaskAsync.cs" company="Microsoft">
//   Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// <summary>
//   This file extends the Microsoft.Live.LiveConnectClient class to support task async pattern.
//   Visual Studio Async CTP (Version 3) required.  Download Async CTP from:
//   http://www.microsoft.com/download/en/details.aspx?displaylang=en&id=9983
// </summary>
//-------------------------------------------------------------------------------------------------
namespace Microsoft.Live
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Threading;
    using System.Threading.Tasks;

    // <summary>
    //      This class extends Microsoft.Live.LiveConnectClient to add new async APIs
    //      that enables the task async pattern.
    // </summary>
    public static class LiveConnectClientTaskAsync
    {
        #region Public Methods

        /// <summary>
        ///     Makes a GET call to the Api service
        /// </summary>
        /// <param name="client">the LiveConnectClient object this method is attached to.</param>
        /// <param name="path">relative path to the resource.</param>
        public static Task<LiveOperationResult> Get(this LiveConnectClient client, string path)
        {
            client.GetCompleted += OnOperationCompleted;
            var tcs = new TaskCompletionSource<LiveOperationResult>();

            client.GetAsync(path, new OperationState<LiveOperationResult>(tcs, client, ApiMethod.Get));

            return tcs.Task;
        }

        /// <summary>
        ///     Makes a DELETE call to the Api service
        /// </summary>
        /// <param name="client">the LiveConnectClient object this method is attached to.</param>
        /// <param name="path">relative path to the resource being deleted.</param>
        public static Task<LiveOperationResult> Delete(this LiveConnectClient client, string path)
        {
            client.DeleteCompleted += OnOperationCompleted;
            var tcs = new TaskCompletionSource<LiveOperationResult>();

            client.DeleteAsync(path, new OperationState<LiveOperationResult>(tcs, client, ApiMethod.Delete));

            return tcs.Task;
        }

        /// <summary>
        ///     Makes a POST call to the Api service
        /// </summary>
        /// <param name="client">the LiveConnectClient object this method is attached to.</param>
        /// <param name="path">relative path to the resource collection to which the new object should be added.</param>
        /// <param name="body">properties of the new resource in json.</param>
        public static Task<LiveOperationResult> Post(this LiveConnectClient client, string path, string body)
        {
            client.PostCompleted += OnOperationCompleted;
            var tcs = new TaskCompletionSource<LiveOperationResult>();

            client.PostAsync(path, body, new OperationState<LiveOperationResult>(tcs, client, ApiMethod.Post));

            return tcs.Task;
        }

        /// <summary>
        ///     Makes a POST call to the Api service
        /// </summary>
        /// <param name="client">the LiveConnectClient object this method is attached to.</param>
        /// <param name="path">relative path to the resource collection to which the new object should be added.</param>
        /// <param name="body">properties of the new resource in name-value pairs.</param>
        public static Task<LiveOperationResult> Post(this LiveConnectClient client, string path, IDictionary<string, object> body)
        {
            client.PostCompleted += OnOperationCompleted;
            var tcs = new TaskCompletionSource<LiveOperationResult>();

            client.PostAsync(path, body, new OperationState<LiveOperationResult>(tcs, client, ApiMethod.Post));

            return tcs.Task;
        }

        /// <summary>
        ///     Makes a PUT call to the Api service
        /// </summary>
        /// <param name="client">the LiveConnectClient object this method is attached to.</param>
        /// <param name="path">relative path to the resource to be updated.</param>
        /// <param name="body">properties of the updated resource in json.</param>
        public static Task<LiveOperationResult> Put(this LiveConnectClient client, string path, string body)
        {
            client.PutCompleted += OnOperationCompleted;
            var tcs = new TaskCompletionSource<LiveOperationResult>();

            client.PutAsync(path, body, new OperationState<LiveOperationResult>(tcs, client, ApiMethod.Put));

            return tcs.Task;
        }

        /// <summary>
        ///     Makes a PUT call to the Api service
        /// </summary>
        /// <param name="client">the LiveConnectClient object this method is attached to.</param>
        /// <param name="path">relative path to the resource to be updated.</param>
        /// <param name="body">properties of the updated resource in name-value pairs.</param>
        public static Task<LiveOperationResult> Put(this LiveConnectClient client, string path, IDictionary<string, object> body)
        {
            client.PutCompleted += OnOperationCompleted;
            var tcs = new TaskCompletionSource<LiveOperationResult>();

            client.PutAsync(path, body, new OperationState<LiveOperationResult>(tcs, client, ApiMethod.Put));

            return tcs.Task;
        }

        /// <summary>
        ///     Download a file into a stream.
        /// </summary>
        /// <param name="client">the LiveConnectClient object this method is attached to.</param>
        /// <param name="path">relative or absolute uri to the file to be downloaded.</param>
        public static Task<Stream> Download(this LiveConnectClient client, string path)
        {
            return Download(client, path, null);
        }

        /// <summary>
        ///     Download a file into a stream.
        /// </summary>
        /// <param name="client">the LiveConnectClient object this method is attached to.</param>
        /// <param name="path">relative or absolute uri to the file to be downloaded.</param>
        /// <param name="progress">a delegate that is called to report the download progress.</param>
        public static Task<Stream> Download(this LiveConnectClient client, string path, IProgress<LiveOperationProgress> progress)
        {
            client.DownloadCompleted += OnDownloadOperationCompleted;
            client.DownloadProgressChanged += OnDownloadProgressChanged;
            var tcs = new TaskCompletionSource<Stream>();

            client.DownloadAsync(path, new OperationState<Stream>(tcs, client, ApiMethod.Download) { Progress = progress });

            return tcs.Task;
        }

        /// <summary>
        ///     Upload a file to the server.
        /// </summary>
        /// <param name="client">the LiveConnectClient object this method is attached to.</param>
        /// <param name="path">relative or absolute uri to the location where the file should be uploaded to.</param>
        /// <param name="fileName">name for the uploaded file.</param>
        /// <param name="inputStream">Stream that contains the file content.</param>
        public static Task<LiveOperationResult> Upload(this LiveConnectClient client, string path, string fileName, Stream inputStream)
        {
            return Upload(client, path, fileName, inputStream, false, null);
        }

        /// <summary>
        ///     Upload a file to the server.
        /// </summary>
        /// <param name="client">the LiveConnectClient object this method is attached to.</param>
        /// <param name="path">relative or absolute uri to the location where the file should be uploaded to.</param>
        /// <param name="fileName">name for the uploaded file.</param>
        /// <param name="inputStream">Stream that contains the file content.</param>
        /// <param name="progress">a delegate that is called to report the upload progress.</param>
        public static Task<LiveOperationResult> Upload(this LiveConnectClient client, string path, string fileName, Stream inputStream, bool overwriteExisting)
        {
            return Upload(client, path, fileName, inputStream, false, null);
        }

        /// <summary>
        ///     Upload a file to the server.
        /// </summary>
        /// <param name="client">the LiveConnectClient object this method is attached to.</param>
        /// <param name="path">relative or absolute uri to the location where the file should be uploaded to.</param>
        /// <param name="fileName">name for the uploaded file.</param>
        /// <param name="inputStream">Stream that contains the file content.</param>
        /// <param name="overwriteExisting">true to overwrite an existing file.</param>
        /// <param name="progress">a delegate that is called to report the upload progress.</param>
        public static Task<LiveOperationResult> Upload(this LiveConnectClient client, string path, string fileName, Stream inputStream, bool overwriteExisting, IProgress<LiveOperationProgress> progress)
        {
            client.UploadCompleted += OnOperationCompleted;
            var tcs = new TaskCompletionSource<LiveOperationResult>();

            client.UploadAsync(
                path,
                fileName,
                overwriteExisting,
                inputStream,
                new OperationState<LiveOperationResult>(tcs, client, ApiMethod.Upload) { Progress = progress });

            return tcs.Task;
        }

        /// <summary>
        ///     Move a file from one location to another
        /// </summary>
        /// <param name="client">the LiveConnectClient object this method is attached to.</param>
        /// <param name="path">relative path to the file resource to be moved.</param>
        /// <param name="destination">relative path to the folder resource where the file should be moved to.</param>
        public static Task<LiveOperationResult> Move(this LiveConnectClient client, string path, string destination)
        {
            client.MoveCompleted += OnOperationCompleted;
            var tcs = new TaskCompletionSource<LiveOperationResult>();

            client.MoveAsync(path, destination, new OperationState<LiveOperationResult>(tcs, client, ApiMethod.Move));

            return tcs.Task;
        }

        /// <summary>
        ///     Copy a file to another location.
        /// </summary>
        /// <param name="client">the LiveConnectClient object this method is attached to.</param>
        /// <param name="path">relative path to the file resource to be copied.</param>
        /// <param name="destination">relative path to the folder resource where the file should be copied to.</param>
        public static Task<LiveOperationResult> Copy(this LiveConnectClient client, string path, string destination)
        {
            client.CopyCompleted += OnOperationCompleted;
            var tcs = new TaskCompletionSource<LiveOperationResult>();

            client.CopyAsync(path, destination, new OperationState<LiveOperationResult>(tcs, client, ApiMethod.Copy));

            return tcs.Task;
        }

        #endregion

        #region Private Methods

        /// <summary>
        ///     Event handler called when an operation (except for download) is completed.
        /// </summary>
        /// <param name="sender">The object that fires the event.</param>
        /// <param name="e">The event arg containing the result of the operation.</param>
        private static void OnOperationCompleted(object sender, LiveOperationCompletedEventArgs e)
        {
            var state = e.UserState as OperationState<LiveOperationResult>;
            if (state != null)
            {
                UnSubscribe(state.LiveClient, state.Method);

                var tcs = state.Tcs;
                if (e.Error != null)
                {
                    tcs.TrySetException(e.Error);
                }
                else
                {
                    LiveOperationResult result = new LiveOperationResult(e.Result, e.RawResult);
                    tcs.TrySetResult(result);
                }
            }
        }

        /// <summary>
        ///     Event handler called when a download operation is completed.
        /// </summary>
        /// <param name="sender">The object that fires the event.</param>
        /// <param name="e">The event arg containing the result of the download operation.</param>
        private static void OnDownloadOperationCompleted(object sender, LiveDownloadCompletedEventArgs e)
        {
            var state = e.UserState as OperationState<Stream>;
            if (state != null)
            {
                UnSubscribe(state.LiveClient, ApiMethod.Download);

                var tcs = state.Tcs;
                if (e.Error != null)
                {
                    tcs.TrySetException(e.Error);
                }
                else
                {
                    tcs.TrySetResult(e.Result);
                }
            }
        }

        /// <summary>
        ///     Event handler called when a download progress event is fired.
        /// </summary>
        /// <param name="sender">The object that fires the event.</param>
        /// <param name="e">The event arg containing the progress of the download operation.</param>
        private static void OnDownloadProgressChanged(object sender, LiveDownloadProgressChangedEventArgs e)
        {
            var state = e.UserState as OperationState<Stream>;
            if (state.Progress != null)
            {
                state.Progress.Report(new LiveOperationProgress(e.BytesReceived, e.TotalBytesToReceive));
            }
        }

        /// <summary>
        ///     Event handler called when a upload progress event is fired.
        /// </summary>
        /// <param name="sender">The object that fires the event.</param>
        /// <param name="e">The event arg containing the progress of the upload operation.</param>
        private static void OnUploadProgressChanged(object sender, LiveUploadProgressChangedEventArgs e)
        {
            var state = e.UserState as OperationState<LiveOperationResult>;
            if (state.Progress != null)
            {
                state.Progress.Report(new LiveOperationProgress(e.BytesSent, e.TotalBytesToSend));
            }
        }

        /// <summary>
        ///     Unsubscribe to events.
        /// </summary>
        /// <param name="client">The LiveConnectClient object that the subscription is attached to.</param>
        /// <param name="method">The method corresponding to the operation.</param>
        private static void UnSubscribe(LiveConnectClient client, ApiMethod method)
        {
            switch (method)
            {
                case ApiMethod.Get:
                    client.GetCompleted -= OnOperationCompleted;
                    break;

                case ApiMethod.Delete:
                    client.DeleteCompleted -= OnOperationCompleted;
                    break;

                case ApiMethod.Post:
                    client.PostCompleted -= OnOperationCompleted;
                    break;

                case ApiMethod.Put:
                    client.PutCompleted -= OnOperationCompleted;
                    break;

                case ApiMethod.Move:
                    client.MoveCompleted -= OnOperationCompleted;
                    break;

                case ApiMethod.Copy:
                    client.CopyCompleted -= OnOperationCompleted;
                    break;

                case ApiMethod.Upload:
                    client.UploadProgressChanged -= OnUploadProgressChanged;
                    client.UploadCompleted -= OnOperationCompleted;
                    break;

                case ApiMethod.Download:
                    client.DownloadProgressChanged -= OnDownloadProgressChanged;
                    client.DownloadCompleted -= OnDownloadOperationCompleted;
                    break;

                default:
                    throw new InvalidOperationException("Un-supported method.");
            }
        }

        #endregion

        #region Private Class

        /// <summary>
        ///     A private class used to pass state between the caller and the event handler.
        /// </summary>
        private class OperationState<TResult>
        {
            /// <summary>
            ///     Constructor for creating a new OperationState object.
            /// </summary>
            public OperationState(TaskCompletionSource<TResult> tcs, LiveConnectClient client, ApiMethod method)
            {
                this.Tcs = tcs;
                this.LiveClient = client;
                this.Method = method;
            }

            /// <summary>
            ///     Gets the TaskCompletionSource object.
            /// </summary>
            public TaskCompletionSource<TResult> Tcs { get; private set; }

            /// <summary>
            ///     Gets the LiveConnectClient object.
            /// </summary>
            public LiveConnectClient LiveClient { get; private set; }

            /// <summary>
            ///     Gets the ApiMethod for the calling operation.
            /// </summary>
            public ApiMethod Method { get; private set; }

            /// <summary>
            ///     Gets the progress handler for the calling download or upload operation.
            /// </summary>
            public IProgress<LiveOperationProgress> Progress { get; set; }
        }

        #endregion
    }
}
