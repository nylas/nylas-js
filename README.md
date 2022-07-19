<a href="https://www.nylas.com/">
    <img src="https://brand.nylas.com/assets/downloads/logo_horizontal_png/Nylas-Logo-Horizontal-Blue_.png" alt="Aimeos logo" title="Aimeos" align="right" height="60" />
</a>

# Nylas JavaScript SDK

![npm](https://img.shields.io/npm/v/@nylas/nylas-js)

This is the GitHub repository for the Nylas JavaScript SDK. The Nylas Communications Platform provides REST APIs for [Email](https://developer.nylas.com/docs/connectivity/email/), [Calendar](https://developer.nylas.com/docs/connectivity/calendar/), and [Contacts](https://developer.nylas.com/docs/connectivity/contacts/), and the Nylas Javascript SDK is the quickest way to build your integration using JavaScript.

Here are some resources to help you get started:

- [Quickstart](https://developer.nylas.com/docs/the-basics/quickstart/)
- [Nylas API Reference](https://developer.nylas.com/docs/api/)


## ⚙️ Install

To install the Nylas JavaScript SDK, you will first need to have [npm](https://www.npmjs.com/get-npm) installed on your machine.

Then, head to the nearest command line and run the following:
```bash
npm install @nylas/nylas-js
```

To install this package from source, clone this repo and run `npm install` from inside the project directory:

```bash
git clone https://github.com/nylas/nylas-js.git
cd nylas-js
npm install
```

## ⚡️ Usage

The entrypoint for the SDK is `Nylas`, which can be imported as an ES module and instantiated:

```javascript
import Nylas from 'nylas-js'

const nylas = new Nylas({
  // Config
});
```

### Configuration options
These are the following options that can be passed in to configure an instance of the Nylas JS SDK

#### `serverBaseUrl`
The URL of the backend server configured with the Nylas middleware or Nylas routes implemented.

## 💙 Contributing

Interested in contributing to the Nylas JavaScript SDK project? Thanks so much for your interest! We are always looking for improvements to the project and contributions from open-source developers are greatly appreciated.

Please refer to [Contributing](Contributing.md) for information about how to make contributions to this project. We welcome questions, bug reports, and pull requests.

## 📝 License

This project is licensed under the terms of the MIT license. Please refer to [LICENSE](LICENSE.txt) for the full terms. 


