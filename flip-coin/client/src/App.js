import React, { Component } from "react";
import CoinFlip from "./contracts/CoinFlip.json";
import getWeb3 from "./utils/getWeb3";

import "./App.css";

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
      bankFund: 0,
      userFund: 0,
      userHistory: 0,
      sendAmountToSendToTheBank: 0,
      sendFund: "0",
      lastFlip: "not play yet",
      listOfBank: null,
      displayWithraw: false,
      isBankOwner: false
    }
    this.updateBankInfo = this.updateBankInfo.bind(this)
    this.setAmount = this.setAmount.bind(this);
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
      
      // TODO
      //CHECK IF THE CURRENT ACCOUNT MATCH WITH THE BANK
      
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
                      bankFund: initialAmount,
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
      let accountInterval = setInterval(async () => {
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

  updateInterface = async (accounts) =>{
    let balance_of_bank = 0;;
    /*
    * Add a pop  up to show user change account
    */
    if(accounts[0] !== this.state.accounts[0]){
        try{
          let userAmount = 0;
          let balance = await this.state.web3.eth.getBalance(accounts[0], (err, balance) => {
            userAmount =  this.state.web3.utils.fromWei(balance) + " ETH";
          });
          this.setState({ userFund: userAmount, accounts: accounts});
        } catch (error){
          console.log("fail to get user balance"+error);
        }
        try {
          balance_of_bank = await this.state.contract.methods.getBankBalance(accounts[0]).call();
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
        if(accounts[0] === this.state.currentBank && balance_of_bank !== 0){
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
      this.setState({ bankFund: response });
      
    } catch (error){
        console.log("fail to get balance");
    }
  };


  flip = async () => {
    const { accounts, contract } = this.state;
    if (!isNaN(this.state.sendAmountToBet)){
      let bankBalance = 0;
      let userBalance = 0;
      let userHistory = 0;
      let gameStatus = "not play yet";
      try {
        await contract.methods.flip(this.state.currentBank).send({ from: accounts[0], value: parseInt(this.state.sendAmountToBet), gas: 900000});
        try {
          userHistory = await contract.methods.getUserHistory(this.state.accounts[0]).call();
          console.log("this is user historic" + userHistory);
        } catch (error){
          console.log("fail to get User balance");
        }
        try {
          const responseFlip = await contract.methods.getLastFlip(this.state.accounts[0]).call();
          // Update state with the result.
          if (responseFlip === true){
            gameStatus = "Win";
          }
          else {
            gameStatus = "Loose";
          }
        } catch (error){
            console.log("fail to get last flip");
        }
        try {
          bankBalance = await contract.methods.getBankBalance(this.state.currentBank).call();
        } catch (error){
          console.log("fail to get Bank balance");
        }
        try{
          userBalance = await this.state.web3.eth.getBalance(accounts[0]);
          userBalance = this.state.web3.utils.fromWei(userBalance) + " ETH"
        } catch(error){
          console.log("fail to get user balance");
        }
        this.setState({ userFund: userBalance,
                        lastFlip: gameStatus,
                        userHistory: userHistory,
                        bankFund: bankBalance,
                      });
      } catch (error){
        console.log("error When fliping"+ error);
      }
    }
  };

  sendMoney = async (dst) => {
    const { accounts, contract } = this.state;
    if (dst === "bank"){
      console.log("this.state.sendFund");
      console.log(this.state.sendFund);
      try{
        await contract.methods.sendMoneyToTheBank().send({from: accounts[0], value: parseInt(this.state.sendFund)});
      } catch(error){
        console.log("send money to bank failed" + error);
      }
      try {
        const response = await contract.methods.getBankBalance(this.state.currentBank).call();
        this.setState({ bankFund: response});
      } catch (error){
        console.log("fail to get Bank balance");
      }
      try {
        await this.state.web3.eth.getBalance(accounts[0], (err, balance) => {
          this.setState({ userFund: this.state.web3.utils.fromWei(balance)});
        });
      } catch (error){
        console.log("fail to get User balance");
      }
      this.setState({displayWithraw: true});
    }
  };

  withdraw = async () => {
    const { accounts, contract } = this.state;
    try{
      await contract.methods.withdrawBankAccount().send({from: accounts[0]});
      console.log("withdraw done");
    } catch(error){
      console.log("Failed to witdhraw from bank account" + error);
    }
    try {
      const response = await contract.methods.getBankBalance(this.state.currentBank).call();
      this.setState({ bankFund: response});
      this.setState({displayWithraw: false});
      console.log("get bank balance one");

    } catch (error){
      console.log("fail to get Bank balance");
    }
    try {
      await this.state.web3.eth.getBalance(accounts[0], (err, balance) => {
        this.setState({ userFund: this.state.web3.utils.fromWei(balance)});
      });
    } catch (error){
      console.log("fail to get User balance");
    }
  };

  createNewBank = async(value) => {
    const { accounts, contract } = this.state;
    let listOfBank;
    console.log("Inside createNewBank");
    console.log("this.state.sendAmountToSendToTheBank");
    console.log(this.state.sendAmountToSendToTheBank);
    try{
      await contract.methods.createBank("Default").send({from: accounts[0], value: parseInt(this.state.sendAmountToSendToTheBank)});
    } catch(error){
      console.log("Failed to create new bank account" + error);
    }
    console.log("value of currentBank:");
    console.log(this.state.currentBank);
    try {
      const response = await contract.methods.getBankBalance(this.state.currentBank).call();
      this.setState({ bankFund: response});
    } catch (error){
      console.log("fail to get Bank balance");
    }
    try {
      listOfBank = await contract.methods.getListOfBank().call();
      this.setState({listOfBank: listOfBank});
      this.setState({displayWithraw: true});
    } catch (error){
      console.log("list of bank empty");
    }
  }

  updateBankInfo = async(event) => {
    const { contract , accounts} = this.state;
    let setBankIndex = event.target.value;
    let listOfBank, isBankOwner;
    let balance_of_bank = 0;
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
    try {

      balance_of_bank = await contract.methods.getBankBalance(listOfBank[setBankIndex]).call();
      this.setState({ bankFund: balance_of_bank,
                      currentBank: listOfBank[setBankIndex]});
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
    if(accounts[0] === listOfBank[setBankIndex] && balance_of_bank !== 0){
      this.setState({displayWithraw: true});
    }
  }

  setAmount(e) {
    if (e.target.name === "valueToSendToBank"){
      this.setState({ sendFund: e.target.value });
      console.log("value to bank" + e.target.value);
    } else if (e.target.name === "valueToBet"){
      this.setState({ sendAmountToBet: e.target.value });
    } else if (e.target.name === "valueToCreateBank"){
      this.setState({ sendAmountToSendToTheBank: e.target.value });
    }

  };

  render() {
    if (!this.state.web3) {
      return <div>Please Install Metamask to be able to Play to this smart contract</div>;
    }
    return (
      <div className="App">
        <h1>Robe The Bank</h1>
        <h2>Try to flip a coin</h2>

        <SelectBank items={this.state.listOfBank} value={this.state.activity} onSelect={this.updateBankInfo}/>
        <div>Balance of the bank: {this.state.bankFund}</div>
        {this.state.displayWithraw &&
          <button type="button" onClick={this.withdraw.bind(this)}> Withraw</button>
        }
        <div>Balance of your account: {this.state.userFund}</div>
        <div>History: {this.state.userHistory}</div>
        {!this.state.isBankOwner &&
          <div>
            <input type="text" name="valueToCreateBank" defaultValue='0' onChange={ this.setAmount }/>
            <button type="button" onClick={this.createNewBank.bind(this)}> create new bank</button>
          </div>
        }
        {this.state.isBankOwner &&
          <div>
            <input type="text" name="valueToSendToBank" defaultValue='0' onChange={ this.setAmount }/>
            <button type="button" onClick={this.sendMoney.bind(this, "bank")}>Send money to the bank</button>
          </div>
        }
        <input type="text" name="valueToBet" defaultValue="0" onChange={ this.setAmount }/>
        <button type="button" onClick={this.flip.bind(this)}>Flip</button>
        <p> You have {this.state.lastFlip}</p>
      </div>
    );
  }
}

export default App;
