#pragma once

namespace SkyPadCpp
{
    delegate void XHRDataReceivedHandler(wchar_t *szDataReceived);
    delegate void XHRCompletedHandler(wchar_t *szDataReceived);
    delegate void XHRFailedHandler(HRESULT hrError);
    class XHREvent : public Microsoft::WRL::RuntimeClass<
        Microsoft::WRL::RuntimeClassFlags<Microsoft::WRL::RuntimeClassType::ClassicCom>,  
        IXMLHTTPRequest2Callback>  
    {
    public:
        
        XHREvent(XHRDataReceivedHandler^ received, XHRCompletedHandler^ succeeded, XHRFailedHandler^ failed) : m_Ref(1), m_DataReceived(received), m_Succeeded(succeeded), m_Failed(failed)
        { 

        }
        virtual ~XHREvent() { }
        
        // IXMLHTTPRequest2Callback
        IFACEMETHODIMP OnRedirect(IXMLHTTPRequest2 *pXHR, const wchar_t *pwszRedirectUrl) { 
            return S_OK; }
        IFACEMETHODIMP OnHeadersAvailable(IXMLHTTPRequest2 *pXHR, DWORD dwStatus, const wchar_t *pwszStatus) { 
            return S_OK; }
        IFACEMETHODIMP OnDataAvailable(IXMLHTTPRequest2 *pXHR, ISequentialStream *pResponseStream);
        IFACEMETHODIMP OnResponseReceived(IXMLHTTPRequest2 *pXHR, ISequentialStream *pResponseStream);
        IFACEMETHODIMP OnError(IXMLHTTPRequest2 *pXHR, HRESULT hrError);

        HRESULT ReadFromStream(_In_opt_ ISequentialStream *pStream);

    private:
        ULONG m_Ref;
        XHRDataReceivedHandler^ m_DataReceived;
        XHRCompletedHandler^ m_Succeeded;
        XHRFailedHandler^ m_Failed;
    };
}