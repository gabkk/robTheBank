import React, { Component } from "react";
import CoinFlip from "./contracts/CoinFlip.json";
import getWeb3 from "./utils/getWeb3";

import "./App.css";

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
      sendFund: "0",
      lastFlip: "not play yet",
    }
    this.setAmount = this.setAmount.bind(this);
  };


  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      
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
      // Add try catch here
      const initialAmount = await instance.methods.getBankBalance().call();
      const userHistory = await instance.methods.getUserHistory(accounts[0]).call();
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3,
                      accounts,
                      contract: instance,
                      bankFund: initialAmount,
                      userFund: userAmount,
                      userHistory: userHistory}
                    , this.runExample);
      console.log(instance);
      console.log(networkId);
      console.log(deployedNetwork.address);
    } catch (error) {
      // Catch any errors for any of the above operations.
      console.log("Failed to load web3, accounts, or contract. Check console for details.");
      console.error(error);
    }
  };

  runExample = async () => {
    try {
      const { contract } = this.state;

      // // Get the value from the contract to prove it worked.
      const response = await contract.methods.getBankBalance().call();
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
      let userHistoric = 0;
      let gameStatus = "not play yet";
      try {
        await contract.methods.flip().send({ from: accounts[0], value: parseInt(this.state.sendAmountToBet), gas: 90000});
        try {
          bankBalance = await contract.methods.getBankBalance().call();
        } catch (error){
          console.log("fail to get Bank balance");
        }
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
        console.log("error When fliping");
      }
    }
  };

  sendMoney = async (dst) => {
    const { accounts, contract } = this.state;
    if (dst === "bank"){
      try{
        await contract.methods.sendMoneyToTheBank().send({ from: accounts[0], value: parseInt(this.state.sendFund)});
      } catch(error){
        console.log("send money to bank failed");
      }
      try {
        const response = await contract.methods.getBankBalance().call();
        this.setState({ bankFund: response});
      } catch (error){
        console.log("fail to get Bank balance");
      }
    }
  };

  setAmount(e) {
    if (e.target.name === "valueToSendToBank"){
      this.setState({ sendFund: e.target.value });
    } else if (e.target.name === "valueToBet"){
      this.setState({ sendAmountToBet: e.target.value });
    }
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Coin Flip v0!</h1>
        <h2>Try to flip a coin</h2>
        <div>Balance of the bank: {this.state.bankFund}</div>
        <div>Balance of your account: {this.state.userFund}</div>
        <div>History: {this.state.userHistory}</div>
        <input type="text" name="valueToSendToBank" defaultValue='0' onChange={ this.setAmount }/>
        <button type="button" onClick={this.sendMoney.bind(this, "bank")}>Send money to the bank</button>
        <input type="text" name="valueToBet" defaultValue="0" onChange={ this.setAmount }/>
        <button onClick={this.flip.bind(this)}>Flip</button>
        <p> You have {this.state.lastFlip}</p>
      </div>
    );
  }
}

export default App;
