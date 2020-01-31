# Rob The Bank

Rob the bank is a Dapp deployed on ropsten network, it is developed with reactjs and solidty.

* [Test it here !!!](https://mysterious-lowlands-26449.herokuapp.com/)

The application is hosted on Heroku so if you have an error message when you click on the link just refresh the page

You should have metamask installed and the ropsten network selected

https://metamask.io/

The purpose of this Dapp is a simple game where you try to rob a bank.
You can also open a bank to let people try to rob you.

The mechanic is simple the robber will loose their bet if they are not able to rob your bank.
You can create a bank and withdraw the found you win at any time.

![Preview](img/preview.png?raw=true "Homepage")

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the software and how to install them

```
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -

sudo apt install nodejs

node --version
```
v12.1.0
```
npm --version
```
6.9.0


### Installing

Just go to the client folder and run

```
npm i && npm start
```

## Running the tests

If you want to run the test you will need to install truffle 

```
npm install -g truffle
```

then go to the repository root and run

```
npm i truffle-assertions

truffle test
```

![Preview](img/test.png?raw=true "Tests")

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

Framework used

* [Reactjs](https://reactjs.org/)
* [Truffle suite](https://www.trufflesuite.com/)


## Authors

* **gabriel kuma**


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

This repository is made for education purposes.
This idea came after following Ivan & Filip courses on https://academy.ivanontech.com/