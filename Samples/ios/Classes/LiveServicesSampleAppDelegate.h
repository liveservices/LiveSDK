//
//  LiveServicesSampleAppDelegate.h
//  LiveServicesSample
//
//  Created by Admin on 6/22/11.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>

@class LiveServicesSampleViewController;

@interface LiveServicesSampleAppDelegate : NSObject <UIApplicationDelegate> {
    UIWindow *window;
    LiveServicesSampleViewController *viewController;
}

@property (nonatomic, retain) IBOutlet UIWindow *window;
@property (nonatomic, retain) IBOutlet LiveServicesSampleViewController *viewController;

@end

