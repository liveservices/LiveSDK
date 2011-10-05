//
//  LiveLoginViewController.h
//  LiveServicesSample
//
//  Created by Admin on 6/22/11.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>


@interface LiveLoginViewController : UIViewController {
	
    UIWebView *webBrowser;
    UILabel *lblStatus;
}
@property (nonatomic, retain) IBOutlet UILabel *lblStatus;
@property (nonatomic, retain) IBOutlet UIWebView *webBrowser;



- (NSString *) ConstructURI;
- (void) ParseRedirectUri:(NSString*) fragment;
- (void) PostMessage:(NSString*) message;
@end
