# Nylas Identity

SDK to handle uas sessions & auth

## Introduction

Nylas Identity is used to handle OAuth flow requests & sessions from UAS to the JS client

## Table of content

- [Install ](#install)
- [Initialization](#initialization)
  - [Session config](#session-config)
- [Code challenge generation](#code-challenge)
- [Code exchange flow](#code-excahnge)
- [API](#api)
  - [auth](#auth)
    - [Config](#auth-config)
  - [authIMAP](#auth-imap)
    - [Payload](#auth-imap-payload)
    - [Responses](#auth-imap-response)
  - [isLoggedIn](#is-logged-in)
  - [detectEmail](#detect-email)
    - [Responses ](#detect-emai-response)
  - [applicationInfo ](#application-info)
    - [Responses](#application-info-response)
  - [getAvailableProviders](#get-available-providers)
    - [Responses](#get-available-providers-response)
  - [getProfile](#get-profile)
  - [getScopes](#get-scopes)
  - [validateToken](#validate-token)
  - [logout](#logout)
  - [Events](#events)

## Install<a id='install'></a>

TODO

## Initialization<a id='initialization'></a>

When initialized the **NylasSessions**

```js
const session = new NylasSessions({
  ClientID: "example_id",
  RedirectURI: "http://localhost:3000/",
});
```

### Session config<a id='session-config'></a>

Session config is used to init the identity library
Prop name | Type | Required | Description
--- | --- | --- | ---
ClientID | `string` | `true` | Nylas Client ID
RedirectURI | `string` | `true` | RedirectURI of your app
AccessType | `string` | `false` | Type of access you request from token (defaults to offline)
Domain | `string` | `false` | Your Nylas Auth domain
Store | `Store` | `false` | Set a store for handling sessions (defaults to localStorage)
Hosted | `boolean` | `false` | Set if you want to use hosted page instead of your own implementation

## Code challenge generation<a id='code-challenge'></a>

Nylas Identity generates a PKCE code on the fyl upon initialization inside `localStorage`. If the user has no ongoing session & code is not present inside storge it generates a `uuid` that will represent the `code_challenge`. When the `auth` method is called we get the `base64` encoded challenge and also encrypt it with `SHA256`. If the login fails the code challege stays the same. When the user authenticates & afterwords logges out a new code challenge will be generated.

## Code exchange flow<a id='code-excahnge'></a>

Code exchange with Nylas Identity works by detecting that the redirect url is present & also that eather the flow returned an error or the code it extracts the code challenge from storage and attempts the code exchange if successful it will set the JWT token and if it fails it will fire the `onLoginFail()` event.

## API<a id='api'></a>

All methods that are needed to interact with UAS authentication & sessions for client side apps.

### auth<a id='auth'></a>

`auth` method is used to generate a link for an OAuth provider or in the case of hosted oauth enabled generate a link to UAS hosted login screen or is `popup` prop is set also open that link inside a popup window instead of returning a link

```js
const link = await session.auth({
  Proivder: "google",
});
```

#### Auth config<a id='auth-config'></a>

Auth config is used to configure the URL of the OAuth provider or Hosted url if hosted is enabled
Prop name | Type | Required | Description
--- | --- | --- | ---
Proivder | `string` | `true` | Nylas Client ID
Scope | `Array<string>` | `false` | Scope overrides the default scope set in the Integration creation process
LoginHint | `string` | `false` | Set the email that will be used to scope provider suggestions
Metadata | `object` | `false` | Set additional metadata to be passed
Settings | `object` | `false` | Set additional settings to be passed
Hosted | `boolean` | `false` | Set if you want to use hosted page instead of your own implementation
Prompt | `string` | `false` | Only applies if you are using Hosted auth
Popup | `boolean` | `false` | Set if you want to open a popup instead of getting the link to the provider

### authIMAP<a id='auth-imap'></a>

Used to authenticate IMAP emails. On success returnes a redirect url when the user redirects to it the authentication is finished (code excahnge is done).

```js
const link = await session.authIMAP({
  Proivder: "google",
});
```

#### IMAP payload<a id='auth-imap-payload'></a>

Used to authenticate the user on the IMAP server specified in the payload. Note: Can only be used if you have an IMAP integration set, also the `getAvailableProviders` method returns IMAP providers with server configuration
Prop name | Type | Required | Description
--- | --- | --- | ---
imap_username | `string` | `true` | Email of IMAP account
imap_password | `string` | `true` | Password of the account
host | `string` | `true` | Host of IMAP server
port | `int` | `true` | Port of IMAP server
type | `string` | `true` | Type of IMAP provider (if the user provides IMAP server information set to `generic`)
smtp_host | `string` | `true` | Host of SMTP server
smtp_port | `int` | `true` | Host of SMTP server

#### IMAP responses<a id='auth-imap-responses'></a>

Successful response

```json
{
  "success": true,
  "data": {
    "BaseURL": "http://localhost:3000?code=example_code"
  }
}
```

Failed response

```json
{
  "success": false,
  "error": {
    "type": "invalid_authentication",
    "http_code": 400,
    "event_code": 25022,
    "message": "Authentication failed due to wrong input or credentials",
    "request_id": "dummy_request_id"
  }
}
```

### isLoggedIn<a id='is-logged-in'></a>

Checks if the user is logged in (`true`/`false`).

```js
const email = await session.isLoggedIn();
```

### detectEmail<a id='detect-email'></a>

Used to detect a provider from the provided email address.

```js
const email = await session.detectEmail("test@nylas.com");
```

#### Response<a id='detect-email-response'></a>

Oauth detected

```json
{
  "success": true,
  "data": {
    "provider": "google",
    "email_address": "john@nylas.com",
    "detected": true
  }
}
```

IMAP detected

```json
{
  "success": true,
  "data": {
    "provider": "imap",
    "type": "yahoo",
    "email_address": "john@yahoo.com",
    "detected": true
  }
}
```

No provider detected

```json
{
  "success": true,
  "data": {
    "email_address": "john@asdad.com",
    "detected": false
  }
}
```

| Prop name     | Type      | Description                                                 |
| ------------- | --------- | ----------------------------------------------------------- |
| email_address | `string`  | Email Address that was provided                             |
| detected      | `boolean` | If the email has been paired with a provider                |
| provider      | `string`  | Returns top level provider type (IMAP or an OAuth provider) |
| type          | `string`  | Returns IMAP type (provider)                                |

### applicationInfo <a id='application-info'></a>

Returns information about application from the specified `ClientID`.

```js
const email = await session.applicationInfo();
```

#### Response<a id='application-info-response'></a>

```json
{
  "data": {
    "application_id": "example_id",
    "name": "UAS App",
    "icon_url": "https://inbox-developer-resources.s3.amazonaws.com/icons/example"
  }
}
```

### getAvailableProviders<a id='get-available-providers'></a>

Used to get OAuth & IMAP providers for the specified `ClientID`.

```js
const providers = await session.getAvailableProviders();
```

#### Response<a id='get-available-providers-response'></a>

```json
[
  {
    "name": "Google",
    "provider": "google",
    "type": "oauth",
    "settings": {}
  },
  {
    "name": "Yahoo",
    "provider": "yahoo",
    "type": "imap",
    "settings": {
      "name": "Yahoo",
      "imap_host": "imap.mail.yahoo.com",
      "imap_port": 993,
      "smtp_host": "smtp.mail.yahoo.com",
      "smtp_port": 587,
      "password_link": "https://help.yahoo.com/kb/learn-generate-password-sln15241.html",
      "primary": true
    }
  }
]
```

### getProfile<a id='get-profile'></a>

If JWT present parses it and returns a profile object

```js
const profile = await session.getProfile();
```

### getScopes<a id='get-scopes'></a>

If user is logged in returnes authenticated provider scopes

```js
const scopes = await session.getScopes();
```

### validateToken<a id='validate-token'></a>

Checks if the users token is valid when logged in (`true`/`false`)

```js
const isValid = await session.validateToken();
```

### logout<a id='logout'></a>

Destory the current session and loggout the user

```js
await session.logout();
```

### Events<a id='events'></a>

Subscribe to events to get information about API interactions.

#### onLoginSuccess
Returns the response of code exchange
```js
onLoginSuccess((event) => {
  console.log(event);
});
```

#### onLoginFail
Returns an error that happened during code exchange
```js
onLoginFail((event) => {
  console.log(event);
});
```

#### onLogoutSuccess
Returns the logged out user if needed for re-auth
```js
onLogoutSuccess((event) => {
  console.log(event);
});
```
#### onTokenRefreshSuccess
Returns the response of token exchange
```js
onTokenRefreshSuccess((event) => {
  console.log(event);
});
```
#### onTokenRefreshFail
Returns an error that happened during token exchange
```js
onTokenRefreshFail((event) => {
  console.log(event);
});
```

#### onSessionExpired
Returns the expired id token
```js
onSessionExpired((event) => {
  console.log(event);
});
```
