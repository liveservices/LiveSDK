//-------------------------------------------------------------------------------------------------
// <copyright file="ApiMethod.cs" company="Microsoft">
//   Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
//-------------------------------------------------------------------------------------------------
namespace Microsoft.Live
{
    using System;

    /// <summary>
    ///     Defines the operations supported by the library for calling the Live Connect REST API.
    /// </summary>
    internal enum ApiMethod
    {
        Get,
        Post,
        Put,
        Delete,
        Upload,
        Download,
        Move,
        Copy
    }
}
