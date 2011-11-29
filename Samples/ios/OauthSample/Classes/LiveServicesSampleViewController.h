//
//  LiveServicesSampleViewController.h
//  LiveServicesSample
//
//  Created by Admin on 6/22/11.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface LiveServicesSampleViewController : UIViewController {

 }

- (IBAction) SignInClicked:(id) sender;
- (void) accessTokenMessageReceived: (NSNotification *) note;
- (void)signInToCustomService;

@end

