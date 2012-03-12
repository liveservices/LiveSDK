#include "pch.h"

using namespace SkyPadCpp;

#define MAX_OUTPUT 32768
#define MAX_WIDE_OUTPUT 16384

IFACEMETHODIMP XHREvent::OnResponseReceived(IXMLHTTPRequest2 *pXHR, ISequentialStream *pResponseStream)
{
    HRESULT hr = S_OK;
    DWORD cbRead = 1;
    BYTE bBuffer[MAX_OUTPUT];
    wchar_t szOutput[MAX_WIDE_OUTPUT];

    while (hr == S_OK)
    {
        hr = pResponseStream->Read(static_cast<void*>(bBuffer), ARRAYSIZE(bBuffer) - 1, &cbRead);
        bBuffer[cbRead] = 0;

        if (SUCCEEDED(hr)) 
        {
            int charWritten = MultiByteToWideChar(CP_UTF8, 0, (char*)(bBuffer), cbRead, szOutput, ARRAYSIZE(szOutput));
            szOutput[charWritten] = L'\0';
            m_Succeeded->Invoke(szOutput);
        }
    }

    if (FAILED(hr))
    {
        m_Failed->Invoke(E_INVALIDARG);
    }

    return hr;
}

IFACEMETHODIMP XHREvent::OnError(IXMLHTTPRequest2 *pXHR, HRESULT hrError)
{
    m_Failed->Invoke(hrError);
    return S_OK;
}

IFACEMETHODIMP XHREvent::OnDataAvailable(IXMLHTTPRequest2 *pXHR, ISequentialStream *pResponseStream)
{
    return S_OK;
}

HRESULT XHREvent::ReadFromStream(
    _In_opt_ ISequentialStream *pStream
)
{
    HRESULT hr = S_OK;
    BYTE buffer[MAX_OUTPUT];
    DWORD cbRead = 0;

    if (pStream == NULL)
    {
        hr = E_INVALIDARG;
        goto Exit;
    }

    while (cbRead < MAX_OUTPUT)
    {
        hr = pStream->Read(buffer, MAX_OUTPUT - 1, &cbRead);

        if (FAILED(hr) ||
            cbRead == 0)
        {
            goto Exit;
        }

        buffer[cbRead] = 0;
    }

Exit:

    return hr;
}