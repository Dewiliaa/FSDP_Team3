# FSDP_Team3

## Members
Aaron Lua Siang Kian (S10258287K)

Lavaniya D/O Rajamoorthi (S10262519C)

Evan Goh (S102583831G)

Name 4:

---
## Sample Accounts
### Admin Account (Has ability to display Ads):
- admin : admin1234

### User Account (No ability to display Ads):
- user : user1234

## Functions
### Front Page (Done by Evan):
- designed the whole front end in the front page
- created a advert slider in the front page
- created advertisments in canva to use for the front page

### Login Page (Done by Evan, Garrett):
#### Evan
- created the front end for login button + login page
- added the remember me + eye icon ( show password )
- added password logic to this page 

#### Garrett
- Implemented JWT for login
- User now need to be logged in to access website and features
- Users do not have the ability to display ads

### Dashboard Page (Done by Aaron):
- Shows statistics of Ad Display Times and Devices Used for the day
- Shows alerts when a device disconnects/reconnects

### Manage Ads Page (Done by Dewi, Lavaniya):

### Ad Creation Page (Done by Dewi, Lavaniya):
-Lavaniya(added s3 button and library panel, some parts of template editor)

### Library Page (Done by Garrett, Aaron):
#### Aaron
- Ability to add an image into the s3 buckets media storage
- Displays the images currently stored in the media storage for previews and deleting

#### Garrett
- Allow images to be filtered as files or ads depeneding on the user
- Allows images to be stored in DynamoDB for fetched ads to display as accordingly

### Scheduling Page (Done by Evan, Aaron):
#### Evan 
- fetching the stored ads from the dynamoDB
- fetching the connected devices from the devices page
- connection to connected devices
  
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


