//-------------------------------------------------------------------------------------------------
// <copyright file="LiveLoginResult.cs" company="Microsoft">
//   Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
//-------------------------------------------------------------------------------------------------
namespace Microsoft.Live
{
    using System;

    /// <summary>
    ///     Defines the result returned by the LiveAuthClient.Intialize or the LiveAuthClient.Login operation.
    /// </summary>
    public class LiveLoginResult
    {
        /// <summary>
        ///     Creates a new LiveLoginResult instance.
        /// </summary>
        public LiveLoginResult(LiveConnectSessionStatus status, LiveConnectSession session)
        {
            this.Status = status;
            this.Session = session;
        }

        /// <summary>
        ///     Gets the session object.
        /// </summary>
        public LiveConnectSession Session { get; private set; }

        /// <summary>
        ///     Gets the login status.
        /// </summary>
        public LiveConnectSessionStatus Status { get; internal set; }
    }
}
