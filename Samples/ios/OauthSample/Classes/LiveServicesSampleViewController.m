//
//  LiveServicesSampleViewController.m
//  LiveServicesSample
//
//  Created by Admin on 6/22/11.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import "LiveServicesSampleViewController.h"
#import "LiveLoginViewController.h"
#import "ProfilesPageViewController.h"

@implementation LiveServicesSampleViewController



- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
	
	// Release any cached data, images, etc that aren't in use.
}

- (void)viewDidUnload {
	// Release any retained subviews of the main view.
	// e.g. self.myOutlet = nil;
}


- (void)dealloc {
    [super dealloc];
}

- (IBAction) SignInClicked:(id) sender{
	
	[self signInToCustomService];
	
	}


- (void)signInToCustomService {
    LiveLoginViewController *login = nil;

	login = [LiveLoginViewController alloc];
	[login autorelease];
	
	[self presentModalViewController:login animated:YES];
}

-(void) viewDidLoad
{
    NSNotificationCenter *note = [NSNotificationCenter defaultCenter];
    [note addObserver:self selector:@selector(accessTokenMessageReceived:)name:@"AccessTokenReceived" object:nil];
    
}

- (void) accessTokenMessageReceived: (NSNotification *) note{
    
    NSString *accessToken = @"";
    ProfilesPageViewController *profile = nil;
    
     accessToken = [note object];
    
    [self dismissModalViewControllerAnimated:NO];
  
    profile = [[ProfilesPageViewController alloc] init];
    [self presentModalViewController:profile animated:YES];
    [profile SetAccessToken:accessToken];
    [profile autorelease];
    
}

@end

