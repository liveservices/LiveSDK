//
// MainPage.xaml.cpp
// Implementation of the MainPage.xaml class.
//

#include "pch.h"
#include "MainPage.xaml.h"
#include <string>
#include <algorithm>
#include <vector>
#include <ppl.h>
#include <ppltasks.h>

using namespace Concurrency;
using namespace Microsoft::WRL;
using namespace Platform;
using namespace Platform::Collections;
using namespace Windows::Foundation;
using namespace Windows::Foundation::Collections;
using namespace Windows::UI::Xaml;
using namespace Windows::UI::Xaml::Controls;
using namespace Windows::UI::Xaml::Controls::Primitives;
using namespace Windows::UI::Xaml::Data;
using namespace Windows::UI::Xaml::Input;
using namespace Windows::UI::Xaml::Media;
using namespace Windows::UI::Xaml::Navigation;
using namespace Windows::Data::Json;
using namespace Windows::Networking::BackgroundTransfer;
using namespace Windows::Security::Authentication::OnlineId;
using namespace Windows::Security::Authentication::Web;
using namespace Windows::Storage;
using namespace Windows::Storage::Streams;
using namespace Windows::UI::Xaml;
using namespace Windows::UI::Xaml::Controls;
using namespace Windows::UI::Xaml::Data;
using namespace Windows::UI::Xaml::Media;
using namespace Windows::UI::Xaml::Media::Imaging;
using namespace SkyPadCpp;


const std::wstring SkyPadCpp::BaseOAuthUrl = L"https://oauth.live.com";
const std::wstring SkyPadCpp::BaseApiUrl = L"https://apis.live.net/v5.0";
const std::wstring SkyPadCpp::NoteFileExtension = L".txt";

MainPage::MainPage()
{
    InitializeComponent();
    _isLoggedIn = false;
    _needToSave = false;
    _xhr = nullptr;
    notes = ref new Windows::Foundation::Collections::PropertySet();

    _callbackUri = WebAuthenticationBroker::GetCurrentApplicationCallbackUri();
    _oauthUri += SkyPadCpp::BaseOAuthUrl + L"/authorize?";
    _oauthUri += L"client_id=";
    _oauthUri += _callbackUri->AbsoluteUri->Data();
    _oauthUri += L"&scope=wl.signin wl.basic wl.skydrive wl.skydrive_update";
    _oauthUri += L"&redirect_uri=";
    _oauthUri += _callbackUri->AbsoluteUri->Data();
    _oauthUri += L"&response_type=token";
}

MainPage::~MainPage()
{
    if (nullptr != _xhr)
    {
        _xhr->Abort();
        _xhr = nullptr;
    }
}

/// <summary>
/// Invoked when this page is about to be displayed in a Frame.
/// </summary>
/// <param name="e">Event data that describes how this page was reached.  The Parameter property is typically used to configure the page.</param>
void MainPage::OnNavigatedTo(NavigationEventArgs^ e)
{
    _authenticator = ref new OnlineIdAuthenticator();
    std::vector<OnlineIdServiceTicketRequest^> v;
    v.push_back(ref new OnlineIdServiceTicketRequest("jwt.oauth.live.net", "JWT"));
    auto ticketRequests = ref new VectorView<OnlineIdServiceTicketRequest^>(v);

    task<UserIdentity^> userAuthTask(_authenticator->AuthenticateUserAsync(ticketRequests, "", CredentialPromptType::PromptIfNeeded));
    userAuthTask.then([this] (UserIdentity^ userIdentity)
    {
        return WebAuthenticationBroker::AuthenticateAsync(
            WebAuthenticationOptions::SilentMode,
            ref new Uri(ref new String(_oauthUri.c_str())),
            _callbackUri);
    }).then([this](task<WebAuthenticationResult^> webAuthTask)
    {
        try
        {
            WebAuthenticationResult^ result = webAuthTask.get();
            auto status = result->ResponseStatus;
            if (status == WebAuthenticationStatus::Success)
            {
                Uri^ responseUrl = ref new Uri(result->ResponseData);
                std::wstring accessTokenFromUrl = GetAccessTokenFromUrl(responseUrl->AbsoluteUri->Data());
                if (accessTokenFromUrl.length() > 0)
                {
                    _accessToken = accessTokenFromUrl;
                    _isLoggedIn = true;
                    signInBtn->Visibility = Windows::UI::Xaml::Visibility::Collapsed;
                    GetUserName();
                }
            }
        }
        catch (Platform::Exception^ e)
        {
        }
    });
}

void SkyPadCpp::MainPage::OnSignInButtonClicked(Platform::Object^ sender, Windows::UI::Xaml::RoutedEventArgs^ e)
{
    if (!_isLoggedIn)
    {
        task<WebAuthenticationResult^> webAuthTask(WebAuthenticationBroker::AuthenticateAsync(
                WebAuthenticationOptions::None,
                ref new Uri(ref new String(_oauthUri.c_str())),
                _callbackUri));
        webAuthTask.then([this](task<WebAuthenticationResult^> webAuthTask) {
            try
            {
                WebAuthenticationResult^ result = webAuthTask.get();
                auto status = result->ResponseStatus;
                if (status == WebAuthenticationStatus::Success)
                {
                    Uri^ responseUrl = ref new Uri(result->ResponseData);
                    std::wstring accessTokenFromUrl = GetAccessTokenFromUrl(responseUrl->AbsoluteUri->Data());
                    if (accessTokenFromUrl.length() > 0)
                    {
                        _accessToken = accessTokenFromUrl;
                        _isLoggedIn = true;
                        signInBtn->Visibility = Windows::UI::Xaml::Visibility::Collapsed;
                        GetUserName();
                    }
                }
            }
            catch (Platform::Exception^ e)
            {
                WriteStatusText("Unable to sign in!");
            }
        });
    }
}

void MainPage::DownloadFile(Uri^ url, std::function<void(std::wstring*)> callback)
{
    task<StorageFile^> createTempFileTask(ApplicationData::Current->LocalFolder->CreateFileAsync("tempfile"));
    createTempFileTask.then([this, url] (task<StorageFile^> fileTask ) {
        StorageFile^ file = fileTask.get();
        auto downloader = ref new BackgroundDownloader();
        DownloadOperation^ download = downloader->CreateDownload(url, file);
        return download->StartAsync();
    }).then([] (task<DownloadOperation^> downloadTask) {
        DownloadOperation^ downloadOp = downloadTask.get();
        auto response = downloadOp->GetResponseInformation();
        auto size = downloadOp->Progress.BytesReceived;
        auto file = downloadOp->ResultFile;
        return file->OpenAsync(FileAccessMode::Read);
    }).then([this, callback] (IRandomAccessStream^ stream) {
        try
        {
            DataReader^ reader = ref new DataReader(stream);
            task<UINT> loadDataTask(reader->LoadAsync((UINT)stream->Size));
            loadDataTask.then([reader, callback](UINT bytesLoaded)
            {
                String^ fileData = reader->ReadString(bytesLoaded);
                callback(new std::wstring(fileData->Data()));
            });
        }
        catch (Platform::Exception^ e)
        {
            WriteStatusText("Unable to download the file!");
        }
    });
}

void MainPage::UploadFile(Uri^ url)
{
    task<StorageFile^> createTempFileTask(ApplicationData::Current->LocalFolder->CreateFileAsync("uploadtemp"));
    createTempFileTask.then([this, url] (task<StorageFile^> fileTask)
    {
        try
        {
            StorageFile^ file = fileTask.get();
            task<IRandomAccessStream^> openTask(file->OpenAsync(FileAccessMode::ReadWrite));
            openTask.then([this, url, file](IRandomAccessStream^ stream) 
            {
                IOutputStream^ outputStream = stream->GetOutputStreamAt(0);
                DataWriter^ dataWriter = ref new DataWriter(outputStream);
                dataWriter->WriteString(this->notesEditor->Text);
                task<UINT> storeTask(dataWriter->StoreAsync());
                storeTask.then([dataWriter](UINT bytesWritten)
                {
                    return dataWriter->FlushAsync();
                }).then([this, url, file](bool isFlushCompleted)
                {
                    auto uploader = ref new BackgroundUploader();
                    auto uploadOperation = uploader->CreateUpload(url, file);
                    return uploadOperation->StartAsync();
                }).then([this](task<UploadOperation^> uploadTask)
                {
                    this->WriteStatusText("File saved");
                    this->deleteNoteBtn->IsEnabled = true;
                    this->saveBtn->IsEnabled = false;
                    this->cancelBtn->IsEnabled = false;
                    this->_needToSave = false;

                    this->FindNoteList(this->folderIds.top());
                });
            });
        }
        catch (Platform::Exception^ e)
        {
            WriteStatusText("Unable to upload the file.");
        }
    });
}

void SkyPadCpp::MainPage::OnAddButtonClick(Platform::Object^ sender, Windows::UI::Xaml::RoutedEventArgs^ e)
{
    if (_needToSave)
    {
        WriteStatusText("Save or Cancel before creating a new file");
    }
    else
    {
        noteTitle->Text = "";
        noteTitle->IsReadOnly = false;
        notesEditor->Text = "";
        notesEditor->IsReadOnly = false;
        noteTitle->Focus(Windows::UI::Xaml::FocusState::Keyboard);

        // Enable detecting changes
        _textChangedHandler = notesEditor->TextChanged += ref new Windows::UI::Xaml::Controls::TextChangedEventHandler(this, &SkyPadCpp::MainPage::OnTextChanged);
    }
}


void SkyPadCpp::MainPage::OnTextChanged(Platform::Object^ sender, Windows::UI::Xaml::Controls::TextChangedEventArgs^ e)
{
    _needToSave = true;
    saveBtn->IsEnabled = true;
    cancelBtn->IsEnabled = true;
}

void SkyPadCpp::MainPage::OnSaveButtonClick(Platform::Object^ sender, Windows::UI::Xaml::RoutedEventArgs^ e)
{
    if (!_isLoggedIn)
    {
        WriteStatusText("You need to Sign In");
    }
    else
    {
        if (noteTitle->Text->Length() == 0)
        {
            WriteStatusText("Please provide a title");
        }
        else
        {
            WriteStatusText("Saving " + noteTitle->Text);
            std::wstring fileName(noteTitle->Text->Data());
            size_t extPos = fileName.rfind(SkyPadCpp::NoteFileExtension);
            if (extPos == std::string::npos)
            {
                fileName += SkyPadCpp::NoteFileExtension;
                noteTitle->Text = ref new String(fileName.c_str());
            }

            std::wstring url = SkyPadCpp::BaseApiUrl + L"/" + folderIds.top() + L"/files/" + fileName + MainPage::GetAccessTokenParameter();
            UploadFile(ref new Uri(ref new String(url.c_str())));
        }
    }
}

void SkyPadCpp::MainPage::OnDeleteButtonClick(Platform::Object^ sender, Windows::UI::Xaml::RoutedEventArgs^ e)
{
    if (!_isLoggedIn)
    {
        WriteStatusText("You need to Sign In");
    }
    else
    {
        WriteStatusText("Deleting... " + noteTitle->Text);

        Object^ ps = notes->Lookup(noteTitle->Text);
        if (ps != nullptr)
        { 
            SkyPadCpp::NoteListItem^ currentItem = safe_cast<SkyPadCpp::NoteListItem^>(ps);
            std::wstring url = SkyPadCpp::BaseApiUrl + L"/" + currentItem->id + MainPage::GetAccessTokenParameter();

            SendRequest(
                ref new Uri(ref new String(url.c_str())),
                "DELETE",
                ref new XHRDataReceivedHandler(this, &MainPage::OnDataAvailable),
                ref new XHRCompletedHandler(this, &MainPage::OnDeleteCompleted),
                ref new XHRFailedHandler(this, &MainPage::OnSendRequestFailed));
        }
        else
        {
            WriteStatusText("Error: Couldn't find the note in the lookup map: " + noteTitle->Text);
        }
    }
}

void SkyPadCpp::MainPage::OnCancelButtonClick(Platform::Object^ sender, Windows::UI::Xaml::RoutedEventArgs^ e)
{
    if (_textChangedHandler.Value != 0)
    {
        notesEditor->TextChanged -= _textChangedHandler;
    }

    noteTitle->Text = "";
    notesEditor->IsReadOnly = true;
    notesEditor->Text = "";
    noteTitle->IsReadOnly = true;
    saveBtn->IsEnabled = false;
    cancelBtn->IsEnabled = false;
    _needToSave = false;
}


void MainPage::GetUserName()
{
    std::wstring getUserNameUrl = SkyPadCpp::BaseApiUrl + L"/me";
    getUserNameUrl += L"?access_token=" + _accessToken;

    SendRequest(
        ref new Uri(ref new String(getUserNameUrl.c_str())),
        "GET",
        ref new XHRDataReceivedHandler(this, &MainPage::OnDataAvailable),
        ref new XHRCompletedHandler(this, &MainPage::OnGetUserNameCompleted),
        ref new XHRFailedHandler(this, &MainPage::OnSendRequestFailed));
}

void MainPage::SendRequest(Windows::Foundation::Uri^ uri, Platform::String^ method, XHRDataReceivedHandler^ received, XHRCompletedHandler^ succeeded, XHRFailedHandler^ failed)
{
    HRESULT hr = CoCreateInstance(CLSID_FreeThreadedXMLHTTP60, nullptr, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&_xhr));
    if (FAILED(hr))
    {
        WriteStatusText("Unable to initialize XMLHttpRequest");
    }
    else
    {
        ComPtr<IXMLHTTPRequest2Callback> xhrEvent = Microsoft::WRL::Details::Make<XHREvent>(received, succeeded, failed);

        HRESULT hr = _xhr->Open(method->Data(), uri->AbsoluteUri->Data(), xhrEvent.Get(), nullptr, nullptr, nullptr, nullptr);
        if (SUCCEEDED(hr)) 
        { 
            // Set content type header
            hr = _xhr->Send(nullptr, 0);
            if (FAILED(hr))
            {
                WriteStatusText("Unable to send request!");
            }
        }
    }
}

void SkyPadCpp::MainPage::OnNotesListSelectionChanged(Platform::Object^ sender, Windows::UI::Xaml::Controls::SelectionChangedEventArgs^ e)
{
    StackPanel^ sp = safe_cast<StackPanel^>(notesList->SelectedItem);
    UIElement^ uie = sp->Children->GetAt(2);
    TextBlock^ tb = safe_cast<TextBlock^>(uie);

    Object^ ps = notes->Lookup(tb->Text);
    if (ps != nullptr)
    { 
        SkyPadCpp::NoteListItem^ selectedNoteItem = safe_cast<SkyPadCpp::NoteListItem^>(ps);
        if (selectedNoteItem->type.compare(L"folder") == 0)
        {
            if (tb->Text == "..")
            {
                folderIds.pop();
                FindNoteList(folderIds.top());
            }
            else
            {
                FindNoteList(selectedNoteItem->id);
            }
        }
        else
        {
            WriteStatusText("Downloading " + tb->Text);
            noteTitle->Text = tb->Text;
            Object^ ps = notes->Lookup(noteTitle->Text);
            if (ps != nullptr)
            { 
                SkyPadCpp::NoteListItem^ selectedNoteItem = safe_cast<SkyPadCpp::NoteListItem^>(ps);
                DownloadNote(selectedNoteItem->id);
            }
            else
            {
                WriteStatusText("Error: Couldn't find the note in the lookup map: " + tb->Text);
            }
        }
    }
}

void MainPage::FindNoteList(std::wstring newFolderId)
{
    // check if we are moving to a child folder or just re-enumerating the current folder
    if (folderIds.empty() || newFolderId.compare(folderIds.top()) != 0)
    {
        folderIds.push(newFolderId);
    }
    
    if (_notesListSelectionHandler.Value != 0)
    {
        notesList->SelectionChanged -= _notesListSelectionHandler;
    }
    
    std::wstring url = SkyPadCpp::BaseApiUrl + L"/" + newFolderId + L"/files" + MainPage::GetAccessTokenParameter();
    SendRequest(
        ref new Uri(ref new String(url.c_str())),
        "GET",
        ref new XHRDataReceivedHandler(this, &MainPage::OnDataAvailable),
        ref new XHRCompletedHandler(this, &MainPage::OnGetNotesDataCompleted),
        ref new XHRFailedHandler(this, &MainPage::OnSendRequestFailed));
}

void MainPage::DownloadNote(std::wstring id)
{
    if (!_isLoggedIn)
    {
        WriteStatusText("You need to Sign In");
    }
    else
    {
        if (_needToSave)
        {
            WriteStatusText("Need to save file.");
        }
        else
        {
            std::wstring url = SkyPadCpp::BaseApiUrl + L"/" + id + L"/content" + MainPage::GetAccessTokenParameter();
            DownloadFile(ref new Uri(ref new String(url.c_str())), [this](std::wstring* response)
            {
                String^ responseString = ref new String(response->c_str());
                if (_textChangedHandler.Value != 0)
                {
                    notesEditor->TextChanged -= _textChangedHandler;
                }
                
                // Load the text into the editor
                notesEditor->Text = responseString;
                
                // Enable editing note content
                notesEditor->IsReadOnly = false;
                
                // Set Save status to false
                _needToSave = false;
                deleteNoteBtn->IsEnabled = true;
                saveBtn->IsEnabled = false;
                cancelBtn->IsEnabled = false;
                
                // Enable detecting changes
                _textChangedHandler = notesEditor->TextChanged += ref new Windows::UI::Xaml::Controls::TextChangedEventHandler(this, &SkyPadCpp::MainPage::OnTextChanged);
                
                WriteStatusText("Downloaded note");
            });
        }
    }
}

void MainPage::WriteStatusText(Platform::String^ outputText)
{
    statusTxt->Text = outputText;
}

void MainPage::CreateNoteListEntry(std::wstring name, std::wstring id, std::wstring item_type)
{
    // Add note to dictionary
    NoteListItem^ nli = ref new NoteListItem(id, item_type);
    notes->Insert(ref new String(name.c_str()), nli);

    // Create Icon Image
    Image^ img = ref new Image();
    BitmapImage^ bimg = ref new BitmapImage();

    Uri^ uri;
    if (item_type.compare(L"folder") == 0)
    {
        uri = ref new Uri("ms-appx:///Assets/folder.ico");
    }
    else
    {
        uri = ref new Uri("ms-appx:///Assets/note.ico");
    }

    bimg->UriSource = uri;
    img->Source = bimg;

    // Create TextBlock with blank spaces
    TextBlock^ tb_sp = ref new TextBlock();
    tb_sp->FontSize = 32.0;
    tb_sp->Text = "   ";

    // Create TextBlock with entry name
    TextBlock^ tb_name = ref new TextBlock();
    tb_name->FontSize = 32.0;
    tb_name->VerticalAlignment = Windows::UI::Xaml::VerticalAlignment::Center;
    tb_name->FontWeight = Windows::UI::Text::FontWeights::Medium;
    tb_name->Foreground = ref new SolidColorBrush(Windows::UI::Colors::Black);
    tb_name->Text = ref new String(name.c_str());

    StackPanel^ sp = ref new StackPanel();
    sp->Orientation = Orientation::Horizontal;
    sp->Children->Append(img);
    sp->Children->Append(tb_sp);
    sp->Children->Append(tb_name);

    notesList->Items->Append(sp);
}


void MainPage::OnGetUserNameCompleted(wchar_t *szOutput)
{
    String^ responseString = ref new String(szOutput);
    JsonObject^ tokenResponse = ref new JsonObject();
    if (JsonObject::TryParse(responseString, &tokenResponse))
    {
        userNameTxt->Text = tokenResponse->GetNamedString("name");
        std::wstring pictureUri = SkyPadCpp::BaseApiUrl + L"/me/picture" + GetAccessTokenParameter();

        BitmapImage^ img = ref new BitmapImage(ref new Uri(ref new String(pictureUri.c_str())));
        userImage->Source = img;
    }

    FindNoteList(L"me/skydrive");
}

void MainPage::OnGetNotesDataCompleted(wchar_t *szOutput)
{
        notes->Clear();
        notesList->Items->Clear();

        // Generate parent folder list entry
        if (folderIds.top().compare(L"me/skydrive") != 0)
        {
            CreateNoteListEntry(L"..", L"", L"folder");
        }

        String^ responseString = ref new String(szOutput);
        JsonObject^ filesResponse = ref new JsonObject();
        if (JsonObject::TryParse(responseString, &filesResponse))
        {
            JsonArray^ data = filesResponse->GetNamedArray("data");
            for(int itemIndex = 0; itemIndex < (int)data->Size; itemIndex++)
            {
                JsonObject^ currentItem = data->GetObjectAt(itemIndex);
                String^ itemName = currentItem->GetNamedString("name");
                String^ itemType = currentItem->GetNamedString("type");
    
                std::wstring itemNameString(itemName->Data());
                std::wstring itemTypeString(itemType->Data());
                std::wstring itemIdString(currentItem->GetNamedString("id")->Data());
                if (itemTypeString.compare(L"folder") == 0)
                {
                    CreateNoteListEntry(itemNameString, itemIdString, L"folder");
                }
                else if (itemTypeString.compare(L"file") == 0)
                {
                    size_t extPos = itemNameString.rfind(SkyPadCpp::NoteFileExtension);
                    if ((extPos != std::string::npos) && (extPos == (itemNameString.length() - SkyPadCpp::NoteFileExtension.length())))
                    {
                        CreateNoteListEntry(itemNameString, itemIdString, L"note");
                    }
                }

            }
            _notesListSelectionHandler = notesList->SelectionChanged += ref new Windows::UI::Xaml::Controls::SelectionChangedEventHandler(this, &SkyPadCpp::MainPage::OnNotesListSelectionChanged);
        }
}

void MainPage::OnDeleteCompleted(wchar_t *szOutput)
{
    if (_textChangedHandler.Value != 0)
    {
        notesEditor->TextChanged -= _textChangedHandler;
    }

    noteTitle->Text = "";
    noteTitle->IsReadOnly = true;
    notesEditor->Text = "";
    notesEditor->IsReadOnly = true;
    saveBtn->IsEnabled = false;
    newNoteBtn->IsEnabled = true;
    deleteNoteBtn->IsEnabled = false;
    cancelBtn->IsEnabled = false;
    _needToSave = false;
    WriteStatusText("Note deleted");

    FindNoteList(this->folderIds.top());
}

void MainPage::OnSendRequestComplete(wchar_t *szOutput)
{
    WriteStatusText("Loaded.");
}

void MainPage::OnDataAvailable(wchar_t *szOutput)
{
    WriteStatusText("Retrieving data.");
}

void MainPage::OnSendRequestFailed(HRESULT hrError)
{
    wchar_t output[10];
    _ltow_s(hrError, output, ARRAYSIZE(output), 16);
    WriteStatusText("Unable to send requet. Error: 0x" + ref new Platform::String(output));
}

std::wstring MainPage::GetAuthcodeFromUrl(std::wstring url)
{
    std::wstring codeParameter = L"code=";
    auto codeStartIndex = url.find(codeParameter);
    codeStartIndex += codeParameter.length();
    auto codeEndIndex = url.find_first_of(L"&", codeStartIndex);

    std::wstring authCode = url.substr(codeStartIndex, codeEndIndex - codeStartIndex);
    return authCode;
}

std::wstring MainPage::GetAccessTokenFromUrl(std::wstring url)
{
    std::wstring tokenParameter = L"access_token=";
    auto tokenStartIndex = url.find(tokenParameter);
    tokenStartIndex += tokenParameter.length();
    auto tokenEndIndex = url.find_first_of(L"&", tokenStartIndex);

    std::wstring authCode = url.substr(tokenStartIndex, tokenEndIndex - tokenStartIndex);
    return authCode;
}

std::wstring MainPage::GetAccessTokenParameter()
{
    return L"?access_token=" + this->_accessToken;
}


NoteListItem::NoteListItem()
{
}

NoteListItem::NoteListItem(std::wstring id, std::wstring type)
{
    NoteListItem::id = id;
    NoteListItem::type = type;
}

NoteListItem::~NoteListItem()
{
}
