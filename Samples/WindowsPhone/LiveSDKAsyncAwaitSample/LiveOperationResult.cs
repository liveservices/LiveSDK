//-------------------------------------------------------------------------------------------------
// <copyright file="LiveOperationResult.cs" company="Microsoft">
//   Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
//-------------------------------------------------------------------------------------------------
namespace Microsoft.Live
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    ///     Defines the result of an Api operation (with the exception of a download operation).
    /// </summary>
    public class LiveOperationResult
    {
        /// <summary>
        ///     Creates a new LiveOperationResult instance.
        /// </summary>
        public LiveOperationResult(IDictionary<string, object> result, string rawResult)
        {
            this.Result = result;
            this.RawResult = rawResult;
        }

        /// <summary>
        ///     Gets the operation result as a dictionary.
        /// </summary>
        public IDictionary<string, object> Result { get; private set; }

        /// <summary>
        ///     Gets the operation result as string.
        /// </summary>
        public string RawResult { get; private set; }
    }
}
