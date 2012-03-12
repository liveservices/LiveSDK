//
// MainPage.xaml.h
// Declaration of the MainPage.xaml class.
//

#pragma once

#include "pch.h"
#include "MainPage.g.h"
#include <stack>

namespace SkyPadCpp
{
    extern const std::wstring BaseOAuthUrl;
    extern const std::wstring BaseApiUrl;
    extern const std::wstring ClientId;
    extern const std::wstring NoteFileExtension;

    /// <summary>
    /// An empty page that can be used on its own or navigated to within a Frame.
    /// </summary>
    public ref class MainPage sealed
    {
    public:
        MainPage();
        ~MainPage();

    protected:
        virtual void OnNavigatedTo(Windows::UI::Xaml::Navigation::NavigationEventArgs^ e) override;

    private:
        void SendRequest(Windows::Foundation::Uri^ uri, Platform::String^ method, XHRDataReceivedHandler^ received, XHRCompletedHandler^ succeeded, XHRFailedHandler^ failed);
        void DownloadFile(Windows::Foundation::Uri^ url, std::function<void(std::wstring*)> callback);
        void UploadFile(Windows::Foundation::Uri^ url);
        void GetUserName();
        void CreateNoteListEntry(std::wstring name, std::wstring id, std::wstring type);
        void FindNoteList(std::wstring newFolderId);
        void DownloadNote(std::wstring id);
        std::wstring GetAuthcodeFromUrl(std::wstring url);
        std::wstring GetAccessTokenFromUrl(std::wstring url);
        std::wstring GetAccessTokenParameter();
        void WriteStatusText(Platform::String^ outputText);

        void OnNotesListSelectionChanged(Platform::Object^ sender, Windows::UI::Xaml::Controls::SelectionChangedEventArgs^ e);
        void OnAddButtonClick(Platform::Object^ sender, Windows::UI::Xaml::RoutedEventArgs^ e);
        void OnTextChanged(Platform::Object^ sender, Windows::UI::Xaml::Controls::TextChangedEventArgs^ e);
        void OnSaveButtonClick(Platform::Object^ sender, Windows::UI::Xaml::RoutedEventArgs^ e);
        void OnDeleteButtonClick(Platform::Object^ sender, Windows::UI::Xaml::RoutedEventArgs^ e);
        void OnCancelButtonClick(Platform::Object^ sender, Windows::UI::Xaml::RoutedEventArgs^ e);
        void OnDataReceived(wchar_t *szOutput);
        void OnSendRequestComplete(wchar_t *szOutput);
        void OnSendRequestFailed(HRESULT hrError);
        void OnSignInButtonClicked(Platform::Object^ sender, Windows::UI::Xaml::RoutedEventArgs^ e);
        void OnDataAvailable(wchar_t *szOutput);
        void OnGetUserNameCompleted(wchar_t *szOutput);
        void OnGetNotesDataCompleted(wchar_t *szOutput);
        void OnDeleteCompleted(wchar_t *szOutput);

        Windows::Foundation::Uri^ _callbackUri;
        Windows::Security::Authentication::OnlineId::OnlineIdAuthenticator^ _authenticator;
        Microsoft::WRL::ComPtr<IXMLHTTPRequest2> _xhr;
        Windows::Foundation::Collections::PropertySet^ notes;
        bool _isLoggedIn;
        bool _needToSave;
        std::wstring _oauthUri;
        std::wstring _accessToken;
        std::stack<std::wstring> folderIds;
        Windows::Foundation::EventRegistrationToken _notesListSelectionHandler;
        Windows::Foundation::EventRegistrationToken _textChangedHandler;
    };

    private ref class NoteListItem
    {
        public:
            NoteListItem();
            NoteListItem(std::wstring id, std::wstring type);
            ~NoteListItem();

            std::wstring id;
            std::wstring type;
    };
}
