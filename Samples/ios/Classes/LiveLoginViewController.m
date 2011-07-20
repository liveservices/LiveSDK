//
//  LiveLoginViewController.m
//  LiveServicesSample
//
//  Created by Admin on 6/22/11.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import "LiveLoginViewController.h"


@implementation LiveLoginViewController
@synthesize lblStatus;
@synthesize webBrowser;

NSString *OAuthAuthorizeUri =@"https://oauth.live.com/authorize";
//replace the ##### with your client id
NSString *ClientID =@"client_id=##########&";
NSString *RedirectURI =@"https://oauth.live.com/desktop";
NSString *Scopes = @"scope=wl.basic%20wl.signin&";
NSString *Display = @"display=touch&";
NSString *ResponseType = @"response_type=token&";


- (void)didReceiveMemoryWarning {
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc. that aren't in use.
}

-(void)viewDidLoad{
    
    NSString * uri = [self ConstructURI];
    [webBrowser loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:uri]]];
}

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error {
    if(error != nil)
    {
    }
}

- (void)webViewDidFinishLoad:(UIWebView *)browser{
    
    NSURLRequest *currentRequest = [browser request];
    NSURL *currentURL = [currentRequest URL];
    
    NSString *absoluteURL = [currentURL absoluteString];
    bool match = [absoluteURL hasPrefix:RedirectURI];
    if (match) {
        [self ParseRedirectUri:[currentURL fragment]];
    
    } 
}

- (void) ParseRedirectUri:(NSString *) fragment
{
    NSString *accessToken =  @"";
    NSRange accessTokenBegin = [fragment rangeOfString:@"access_token="];
    NSRange accessTokenEnd = [fragment rangeOfString:@"&"];
    accessToken = [fragment substringToIndex:accessTokenEnd.location];
    accessToken = [accessToken substringFromIndex:(accessTokenBegin.location+accessTokenBegin.length)];
    
     [self PostMessage:accessToken];
    
}

- (void) PostMessage:(NSString*) message
{
    NSNotificationCenter *note = [NSNotificationCenter defaultCenter];
    [note postNotificationName:@"AccessTokenReceived" object:message];

}

- (void)viewDidUnload {
    [self setWebBrowser:nil];
    [self setLblStatus:nil];
    OAuthAuthorizeUri = nil;
    ClientID = nil;
    RedirectURI = nil;
    Scopes = nil;
    Display = nil;
    ResponseType = nil;
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}



- (void)dealloc {
    [webBrowser release];
    [lblStatus release];
 
   

    [super dealloc];
}


- (NSString *) ConstructURI
{
    return [NSString stringWithFormat:@"%@?%@redirect_uri=%@&%@%@%@",OAuthAuthorizeUri,ClientID,RedirectURI,Scopes,Display,ResponseType];

    
}


@end
