//-------------------------------------------------------------------------------------------------
// <copyright file="LiveOperationProgress.cs" company="Microsoft">
//   Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
//-------------------------------------------------------------------------------------------------
namespace Microsoft.Live
{
    using System;
    using System.Diagnostics;

    /// <summary>
    ///     Defines the progress values for a download or upload operation.
    /// </summary>
    public class LiveOperationProgress
    {
        /// <summary>
        ///     Creates a new LiveOperationProgress object.
        /// </summary>
        public LiveOperationProgress(long bytesTransferred, long totalBytes)
        {
            Debug.Assert(bytesTransferred >= 0);
            Debug.Assert(totalBytes >= 0);

            this.BytesTransferred = bytesTransferred;
            this.TotalBytes = totalBytes;
        }

        /// <summary>
        ///     Gets the number of bytes transferred.
        /// </summary>
        public long BytesTransferred { get; private set; }

        /// <summary>
        ///     Gets the number of total bytes to be transferred.
        /// </summary>
        public long TotalBytes { get; private set; }

        /// <summary>
        ///     Gets the percentage transferred.
        /// </summary>
        public double ProgressPercentage
        {
            get
            {
                return (this.TotalBytes == 0) ? 0 : ((double)this.BytesTransferred) / this.TotalBytes * 100;
            }
        }
    }
}
