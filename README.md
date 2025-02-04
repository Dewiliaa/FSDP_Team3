# FSDP_Team3

## Members
Aaron Lua Siang Kian (S10258287K)

Lavaniya D/O Rajamoorthi (S10262519C)

Evan Goh (S102583831G)

Dewi Lia Virnanda (S10262440K)

Ng Jing Zhan Garrett (S10257347K)

---
## Sample Accounts
### Admin Account (Has ability to display Ads):
- admin : admin1234

### User Account (No ability to display Ads):
- user : user1234

## To be able to run fully working server through code:
- Change the IP link in the file config.js to current network ip to work

## Functions
### Front Page (Done by Evan):
- Designed the whole front end in the front page
- Created a advert slider in the front page
- Created advertisments in canva to use for the front page

### Login Page (Done by Evan, Garrett):
#### Evan
- Created the front end for login button + login page
- Added the remember me + eye icon ( show password )
- Added password logic to this page 

#### Garrett
- Implemented JWT for login
- User now need to be logged in to access website and features
- Users do not have the ability to display ads

### Dashboard Page (Done by Aaron):
- Shows statistics of Ad Display Times and Devices Used for the day
- Shows alerts when a device disconnects/reconnects

### Manage Ads Page (Done by Dewi, Lavaniya, Garrett):
#### Garrett
- Implement DynamoDB to store the ads as metadata
- Allow for display of current ads on page
- Implemented responsive view and styling
  
#### Lavaniya
- Did some of the buttons and styling

### Dewi
- Did the create template page.
- Linked DynamoDB retrieved images from ManageAds to EditTemplate.
  
### Ad Creation Page (Done by Dewi, Lavaniya):
#### Lavaniya
- Added s3 button and library panel, some parts of template editor
  
### Dewi
- Added elements such as shapes, enter texts, able to change font and size, colors.
- Added function buttons such as Undo, Redo, Delete, Bring to Front, Send to Back, and Lock.
- Configure library panel CORs issue to drag and drop newly saved images in S3 buckets.
- Styling for edit template page.
- Resizing function for elements.

### Library Page (Done by Garrett, Aaron):
#### Aaron
- Ability to add an image into the s3 buckets media storage
- Displays the images currently stored in the media storage for previews and deleting

#### Garrett
- Allow images to be filtered as files or ads depeneding on the user
- Allows images to be stored in DynamoDB for fetched ads to display as accordingly
- Implemented responsive view and styling

### Scheduling Page (Done by Evan, Aaron):
#### Evan 
- Fetching the stored ads from the dynamoDB
- Fetching the connected devices from the devices page
- Connection to connected devices

#### Aaron
- Allow connected devices to be fetched and shown to be selected for scheduling a page that's fully functioning
- Schedules an ad to be displayed on a device in a timeframe and stop displaying accordingly
- Allow Ad Schedules to be stored and fetched to show ongoing or future scheduling incoming
  
### Devices Page (Done by Aaron, Garrett):
#### Aaron
- Allow tracking of actual devices to be added
- Add device can add an actual device's details to be stored as data in DynamoDB and used for later
- Devices are fetched and displayed in containers that have dropdown buttons and a currently displaying box showing an ad if an ad is being displayed
- Implemented WebSockets from backend server for real time changes to work and device-to-device interaction through display ads from one device to the selected device
- Allow the ability to view device information, display ads on targeted device and remove device
- Select device button to select devices to display an ad to
- Created a Groups section that allows adding groups of devices together and displaying ads to groups collectively
- Devices in Groups are stored as data in DynamoDB, fetched for displaying on screen
- Select groups button to select groups to display an ad to

#### Garrett
- Assistance in allowing the ability to show ads
- Resize ads that are displayed properly

### Public Server (Done by Garrett):
- Hosted app on ec2 with elastic ip attached. Elastic IP: 52.65.65.69:3000
- App can be accessed from users with different networks and can view real time updates, connections and ad displays
