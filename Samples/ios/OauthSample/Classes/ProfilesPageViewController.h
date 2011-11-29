//
//  ProfilesPageViewController.h
//  LiveServicesSample
//
//  Created by Admin on 6/23/11.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>


@interface ProfilesPageViewController : UIViewController {
    
    

    UILabel *txtFirstName;
    UIWebView *uvwProfile;
    
    UILabel *txtFullName;
    UILabel *txtProfileName;
    UILabel *txtLastName;

   
   }
@property (nonatomic, retain) IBOutlet UILabel *txtFullName;
@property (nonatomic, retain) IBOutlet UILabel *txtProfileName;
@property (nonatomic, retain) IBOutlet UILabel *txtLastName;
@property (nonatomic, retain) IBOutlet UILabel *txtFirstName;
@property (nonatomic, retain) IBOutlet UIWebView *uvwProfile;

-(void) SetAccessToken:(NSString*) AccessToken;
-(void) GetUserProfile;
-(void) GetUserProfileImage;

-(NSMutableDictionary *) ParseResponse:(NSString *) response;
-(void) PopulateUI:(NSMutableDictionary *) dictionary;


@end

