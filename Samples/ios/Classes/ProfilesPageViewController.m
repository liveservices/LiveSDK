//
//  ProfilesPageViewController.m
//  LiveServicesSample
//
//  Created by Admin on 6/23/11.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import "ProfilesPageViewController.h"

@implementation ProfilesPageViewController
@synthesize txtFullName;
@synthesize txtProfileName;
@synthesize txtLastName;


@synthesize txtFirstName;
@synthesize uvwProfile;



NSString *_accessToken = nil;
NSString * _apiUrl = @"https://apis.live.net/v5.0/";
NSString * _resource = @"me";
NSMutableData * profileData = nil;
NSURLConnection *profileConnection =nil;

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
       
    }
    return self;
}

- (void) SetAccessToken:(NSString*) AccessToken{
    _accessToken = AccessToken;
    [self GetUserProfile];
    [self GetUserProfileImage];
}

- (void) GetUserProfile{
    NSString *profileUrl = _apiUrl;
    
    profileUrl = [profileUrl stringByAppendingString:_resource];
    profileUrl = [profileUrl stringByAppendingString:@"?access_token="];
    profileUrl = [NSString stringWithFormat:@"%@%@",profileUrl, _accessToken];


    NSURLRequest *profileRequest = [NSURLRequest requestWithURL:[NSURL URLWithString:profileUrl]];
    profileConnection = [[NSURLConnection alloc] initWithRequest:profileRequest delegate:self];
    if(profileConnection)
    {
        profileData = [[NSMutableData alloc] init ];
   
    }
    
}

                  
-(void) connection:(NSURLConnection *)profileConnection didReceiveData:(NSData *)data
{
    [profileData appendData:data];
}

- (void) connectionDidFinishLoading:(NSURLConnection *)profileConnection
{
    NSString* json_string = [[NSString alloc]initWithData:profileData encoding:NSUTF8StringEncoding ];
    NSMutableDictionary* dictionary = [ self ParseResponse:json_string];
    [self PopulateUI:dictionary];
    [json_string release];
}

-(void)PopulateUI:(NSMutableDictionary *)dictionary
{
    self.txtFirstName.text= [dictionary objectForKey:@"first_name"];
    self.txtLastName.text= [dictionary objectForKey:@"last_name"];
    self.txtFullName.text= [dictionary objectForKey:@"name"];
}

- (NSMutableDictionary *) ParseResponse:(NSString *)response
{
    
    // In an ideal world you would use a more robust JSON Deserializer 
    response = [response stringByReplacingOccurrencesOfString:@"{" withString:@""];
    response = [response stringByReplacingOccurrencesOfString:@"}" withString:@""];
    response = [response stringByReplacingOccurrencesOfString:@"\"" withString:@""];
    response = [response stringByReplacingOccurrencesOfString:@"\r" withString:@""];
    NSArray *fields = [[NSArray alloc] initWithArray:[response componentsSeparatedByString:@","]];
    NSMutableDictionary *responseDictionary = [[NSMutableDictionary  alloc] initWithCapacity:[fields count]];
    
    for (int i =0; i < [fields count]; i++) {
        
        NSString* pair = [fields objectAtIndex:i];
        NSArray * values = [pair componentsSeparatedByString:@":"];
        NSString * value = [values objectAtIndex:1];
        NSString * key = [values objectAtIndex:0];
        [responseDictionary setObject:value forKey:[key stringByReplacingOccurrencesOfString:@" " withString:@""]];
       
    }
    [fields release];
    [responseDictionary autorelease];
    return responseDictionary;
    
}
          
-(void) GetUserProfileImage{
    NSString *profileUrl = _apiUrl;
    
    profileUrl = [profileUrl stringByAppendingString:_resource];
    profileUrl = [profileUrl stringByAppendingString:@"/picture?access_token="];
    profileUrl = [NSString stringWithFormat:@"%@%@",profileUrl, _accessToken];
     NSURLRequest *profileRequest = [NSURLRequest requestWithURL:[NSURL URLWithString:profileUrl]];
    

    [uvwProfile loadRequest:profileRequest];
    
}

- (void)dealloc
{
    [txtFirstName release];
    
    [txtFullName release];
    [txtProfileName release];
    [txtLastName release];

    
    [uvwProfile release];
    [super dealloc];
}

- (void)didReceiveMemoryWarning
{
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc that aren't in use.
}

#pragma mark - View lifecycle

- (void)viewDidLoad
{
    [super viewDidLoad];
    // Do any additional setup after loading the view from its nib.
    
}

- (void)viewDidUnload
{
 
    [self setTxtFirstName:nil];
    [self setTxtFullName:nil];
    [self setTxtProfileName:nil];
    [self setTxtLastName:nil];
    
    [self setUvwProfile:nil];
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    // Return YES for supported orientations
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}

@end
