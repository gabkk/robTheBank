import React, { Component } from "react";
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import 'bootstrap/dist/css/bootstrap.min.css';

import CoinFlip from "./contracts/CoinFlip.json";
import getWeb3 from "./utils/getWeb3";

import Flip from "./components/Flip";
import BankManagement from "./components/BankManagement";

import "./App.css";
import "./stylesheets/application.scss";

class SelectBank extends React.Component{
    render(){
      return (
      <select value={this.props.value} name={this.props.name} onChange={this.props.onSelect}> {this.props.items.map((item,index) =>{
          return <option key={item} value={index}>{item}</option>})}
      </select>
      )
    }
  }

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      storageValue: 0,
      web3: null,
      accounts: null,
      contract: null,
      selectedBankFund: 0,
      selectedBankName: 'Default',
      myBankFund: 0,
      userFund: 0,
      userHistory: 0,
      lastFlip: "not play yet",
      myBankName: null,
      listOfBank: null,
      displayWithraw: false,
      isBankOwner: false
    }
    this.updateBankInfo = this.updateBankInfo.bind(this)
    this.updateInterface = this.updateInterface.bind(this);
  };


  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      console.log("Inside component did mount");

      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      let accounts = await web3.eth.getAccounts();

      // Show the contract balance
      let userAmount = 0;
      await web3.eth.getBalance(accounts[0], (err, balance) => {
        userAmount =  web3.utils.fromWei(balance) + " ETH";
      });
      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = CoinFlip.networks[networkId];
      const instance = new web3.eth.Contract(
        CoinFlip.abi,
        deployedNetwork && deployedNetwork.address
      );
      let listOfBank;

      try {
        listOfBank = await instance.methods.getListOfBank().call();
        console.log("listOfBank");
        console.log(listOfBank);
        this.setState({listOfBank: listOfBank});
      } catch (error){
        console.log("list of bank empty");
      }

      let isBankOwner = false;

      try {
        isBankOwner = await instance.methods.isBankOwner(accounts[0]).call();
        this.setState({isBankOwner: isBankOwner});
        console.log("is bank owner " + isBankOwner);
      } catch (error){
        console.log("isBankOwner failed");
      }
      console.log("Is this account :" + accounts[0] + " owner of a bank : " + isBankOwner);

      // Add try catch here
      const initialAmount = await instance.methods.getBankBalance(listOfBank[0]).call();
      const selectedBankName = await instance.methods.getBankName(listOfBank[0]).call();
      const myBankFund = await instance.methods.getBankBalance(accounts[0]).call();
      const myBankName = await instance.methods.getBankName(accounts[0]).call();
      
      let displayWithraw = false;
      console.log("value in the bank");
      console.log(initialAmount);
      if(listOfBank[0] === accounts[0] && initialAmount !== 0){
        displayWithraw = true;
      }
      console.log("initialAmount of bank owner " + initialAmount);

      const userHistory = await instance.methods.getUserHistory(accounts[0]).call();
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.

      this.setState({ web3,
                      accounts,
                      contract: instance,
                      selectedBankFund: initialAmount,
                      selectedBankName: selectedBankName,
                      myBankFund: myBankFund,
                      myBankName: myBankName,
                      userFund: userAmount,
                      userHistory: userHistory,
                      listOfBank: listOfBank,
                      displayWithraw: displayWithraw,
                      currentBank: listOfBank[0],
                    }, this.runExample);
      console.log(instance);
      console.log(networkId);
      console.log(deployedNetwork.address);

      /*
      * Loop To catch user wallet changes
      */
      setInterval(async () => {
        let newAccount = await web3.eth.getAccounts(); ;
        if (newAccount[0] !== this.state.accounts[0]) {
          this.updateInterface(newAccount);
        }
      }, 1000);

    } catch (error) {
      // Catch any errors for any of the above operations.
      console.log("Failed to load web3, accounts, or contract. Check console for details.");
      console.error(error);
    }
  };


  /*
  * Called when the user change metamask account
  */
  updateInterface = async (accounts) =>{
    let balanceOfBank = 0;
    let nameOfBank = null;
    console.log("Inside updateInterface")
    console.log(accounts);
    /*
    * Add a pop  up to show user change account
    */
    if(accounts[0] !== this.state.accounts[0]){
        try{
          let userAmount = 0;
          await this.state.web3.eth.getBalance(accounts[0], (err, balance) => {
            userAmount =  this.state.web3.utils.fromWei(balance) + " ETH";
          });
          this.setState({ userFund: userAmount, accounts: accounts});
        } catch (error){
          console.log("fail to get user balance"+error);
        }
        try {
          balanceOfBank = await this.state.contract.methods.getBankBalance(accounts[0]).call();
          this.setState({ myBankFund: balanceOfBank});
        } catch (error){
          console.log("fail to get Bank balance");
        }
        try {
          nameOfBank = await this.state.contract.methods.getBankName(accounts[0]).call();
          this.setState({ myBankName: nameOfBank});
        } catch (error){
          console.log("fail to get Bank balance");
        }
        try {
          let isBankOwner = await this.state.contract.methods.isBankOwner(accounts[0]).call();
          this.setState({isBankOwner: isBankOwner});
          console.log("is bank owner " + isBankOwner);
        } catch (error){
          console.log("isBankOwner failed");
        }
        if(balanceOfBank !== "0"){
          this.setState({displayWithraw: true});
        } else {
          this.setState({displayWithraw: false});
        }
    }
  }

  runExample = async () => {

    const { contract } = this.state;
    try {

      // // Get the value from the contract to prove it worked.
      console.log("Inside run Exqmple");
      console.log(this.state.currentBank);
      const response = await contract.methods.getBankBalance(this.state.currentBank).call();
      // Update state with the result.
      this.setState({ selectedBankFund: response });
      
    } catch (error){
        console.log("fail to get balance");
    }
  };

  /*
  * Called when the user change the selected bank
  */
  updateBankInfo = async(event) => {
    const { contract , accounts} = this.state;
    let setBankIndex = event.target.value;
    let listOfBank, isBankOwner;
    let balance_of_bank = 0;
    let myBankFund = 0;
    let nameOfBank = "Default";
    console.log(" Inside updateBankinfo");
    console.log("accounts[0]");
    console.log(accounts[0]);
    
    try {
      listOfBank = await contract.methods.getListOfBank().call();
      this.setState({listOfBank: listOfBank});
    } catch (error){
      console.log("list of bank empty");
    }
    console.log("Current bank type: " +typeof(listOfBank[setBankIndex]) + " , value:" + listOfBank[setBankIndex]);

    /*Set value for the selected bank*/
    try {
      balance_of_bank = await contract.methods.getBankBalance(listOfBank[setBankIndex]).call();
      this.setState({ selectedBankFund: balance_of_bank,
                      currentBank: listOfBank[setBankIndex]});
    } catch (error){
      console.log("fail to get Bank balance");
    }

    try {
      nameOfBank = await contract.methods.getBankName(listOfBank[setBankIndex]).call();
      this.setState({ selectedBankName: nameOfBank });
    } catch (error){
      console.log("fail to get Bank balance");
    }

    /*Check if the user bank is valid to display withdraw*/
    try {
      myBankFund = await contract.methods.getBankBalance(accounts[0]).call();
    } catch (error){
      console.log("fail to get Bank balance");
    }

    try {
      isBankOwner = await contract.methods.isBankOwner(accounts[0]).call();
      this.setState({isBankOwner: isBankOwner});
      console.log("is bank owner " + isBankOwner);
    } catch (error){
      console.log("isBankOwner failed");
    }
    if(myBankFund !== "0"){
      this.setState({displayWithraw: true});
    } else {
      this.setState({displayWithraw: false});
    }
  }

  updateFromComponent(...newStateValue){
    console.log("updateFromComponent");
    console.log(newStateValue);
    this.setState(newStateValue[0]);
  }

  render() {
    if (!this.state.web3) {
      return <div>Please Install Metamask to be able to Play to this smart contract</div>;
    }
    return (
      <div className="app">
        <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
          <Navbar.Brand href="#home">Robe The Bank</Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link href="#comingSoon">swarm version</Nav.Link>
              <Nav.Link href="#info">Info</Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link>Balance of your wallet: {this.state.userFund}</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <div className="gameManagement">
          <BankManagement accounts={this.state.accounts}
                myBankFund={this.state.myBankFund}
                contract={this.state.contract}
                currentBank={this.state.currentBank}
                web3={this.state.web3}
                displayWithraw={this.state.displayWithraw}
                isBankOwner={this.state.isBankOwner}
                myBankName={this.state.myBankName}
                updateFromComponent={this.updateFromComponent.bind(this)} />

        </div>

        <div className="bank">
          <SelectBank items={this.state.listOfBank} value={this.state.activity} onSelect={this.updateBankInfo}/>
          <div>Balance of the {this.state.selectedBankName} bank: {this.state.selectedBankFund}</div>
        </div>


        <div className="gameInteraction">
          <Flip accounts={this.state.accounts}
                contract={this.state.contract}
                currentBank={this.state.currentBank}
                web3={this.state.web3}
                updateFromComponent={this.updateFromComponent.bind(this)} />
          <p> You have {this.state.lastFlip}</p>
          <div>History: {this.state.userHistory}</div>
        </div>
      </div>
    );
  }
}

export default App;
