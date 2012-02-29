//-------------------------------------------------------------------------------------------------
// <copyright file="LiveAuthClientTaskAsync.cs" company="Microsoft">
//      Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// <summary>
//      This file extends the Microsoft.Live.LiveAuthClient class to support task async pattern.
//      Visual Studio Async CTP (Version 3) required.  Download Async CTP from:
//      http://www.microsoft.com/download/en/details.aspx?displaylang=en&id=9983
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
    //      This class extends Microsoft.Live.LiveAuthClient to add new async APIs
    //      that enables the task async pattern.
    // </summary>
    public static class LiveAuthClientTaskAsync
    {
        /// <summary>
        ///     Initializes the auth client and detects if a user is already signed in. 
        ///     If a user is already signed in, this method creates a valid Session.
        ///     This call is UI-less.
        /// </summary>
        /// <param name="client">the LiveAuthClient object this method is attached to.</param>
        public static Task<LiveLoginResult> Initialize(this LiveAuthClient client)
        {
            return client.Initialize(null);
        }

        /// <summary>
        ///     Initializes the auth client and detects if a user is already signed in. 
        ///     If a user is already signed in, this method creates a valid Session.
        ///     This call is UI-less.
        /// </summary>
        /// <param name="client">The LiveAuthClient object this method is attached to.</param>
        /// <param name="scopes">The list of offers that the application is requesting user consent for.</param>
        public static Task<LiveLoginResult> Initialize(this LiveAuthClient client, IEnumerable<string> scopes)
        {
            var tcs = new TaskCompletionSource<LiveLoginResult>();

            client.InitializeCompleted += OnInitializeCompleted;
            client.InitializeAsync(scopes, new OperationState(tcs, client));

            return tcs.Task;
        }

        /// <summary>
        ///     Displays the login/consent UI and returns a Session object when the user completes the auth flow.
        /// </summary>
        /// <param name="client">The LiveAuthClient object this method is attached to.</param>
        /// <param name="scopes">The list of offers that the application is requesting user consent for.</param>
        public static Task<LiveLoginResult> Login(this LiveAuthClient client, IEnumerable<string> scopes)
        {
            var tcs = new TaskCompletionSource<LiveLoginResult>();

            client.LoginCompleted += OnLoginCompleted;
            client.LoginAsync(scopes, new OperationState(tcs, client));

            return tcs.Task;
        }

        /// <summary>
        ///     Event handler for InitializeCompleted, called when Initialize is completed.
        /// </summary>
        /// <param name="sender">The object that fires the event.</param>
        /// <param name="e">The event arg containing the result of Initialize.</param>
        private static void OnInitializeCompleted(object sender, LoginCompletedEventArgs e)
        {
            OperationState state = e.UserState as OperationState;
            if (state != null)
            {
                state.AuthClient.InitializeCompleted -= OnInitializeCompleted;

                var tcs = state.Tcs;
                if (e.Error != null)
                {
                    tcs.TrySetException(e.Error);
                }
                else
                {
                    tcs.TrySetResult(new LiveLoginResult(e.Status, e.Session));
                }
            }
        }

        /// <summary>
        ///     Event handler for LoginCompleted, called when Login is completed.
        /// </summary>
        /// <param name="sender">The object that fires the event.</param>
        /// <param name="e">The event arg containing the result of Login.</param>
        private static void OnLoginCompleted(object sender, LoginCompletedEventArgs e)
        {
            OperationState state = e.UserState as OperationState;
            if (state != null)
            {
                state.AuthClient.LoginCompleted -= OnLoginCompleted;

                var tcs = state.Tcs;
                if (e.Error != null)
                {
                    tcs.TrySetException(e.Error);
                }
                else
                {
                    tcs.TrySetResult(new LiveLoginResult(e.Status, e.Session));
                }
            }
        }

        #region Private Class

        /// <summary>
        ///     A private class used to pass state between the caller and the event handler.
        /// </summary>
        private class OperationState
        {
            /// <summary>
            ///     Constructor for creating a new OperationState object.
            /// </summary>
            public OperationState(TaskCompletionSource<LiveLoginResult> tcs, LiveAuthClient client)
            {
                this.Tcs = tcs;
                this.AuthClient = client;
            }

            /// <summary>
            ///     Gets the TaskCompletionSource object.
            /// </summary>
            public TaskCompletionSource<LiveLoginResult> Tcs { get; private set; }

            /// <summary>
            ///     Gets the LiveAuthClient object.
            /// </summary>
            public LiveAuthClient AuthClient { get; private set; }
        }

        #endregion
    }
}
