import React, { Component } from "react";
import CoinFlip from "./contracts/CoinFlip.json";
import getWeb3 from "./utils/getWeb3";

import "./App.css";

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      updateBalance: false,
      updateLastFlip: false,
      storageValue: 0,
      web3: null,
      accounts: null,
      contract: null,
      bankFund: 0,
      userFund: 0,
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

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = CoinFlip.networks[networkId];
      const instance = new web3.eth.Contract(
        CoinFlip.abi,
        deployedNetwork && deployedNetwork.address
      );
      const initialAmount = await instance.methods.getBankBalance().call();
      const userAmount = await instance.methods.getUserBalance(accounts[0]).call();
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance, bankFund: initialAmount, userFund: userAmount}
                    , this.runExample);
      console.log(instance);
      console.log(networkId);
      console.log(accounts);
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
      
      try {
        await contract.methods.flip().send({ from: accounts[0], value: parseInt(this.state.sendAmountToBet), gas: 70000});
      } catch (error){
        console.log("error When fliping");
      }
      try {
        const response = await contract.methods.getBankBalance().call();
        this.setState({ bankFund: response});
      } catch (error){
        console.log("fail to get Bank balance");
      }
      try {
        const response = await contract.methods.getUserBalance(this.state.accounts[0]).call();
        this.setState({ userFund: response});
      } catch (error){
        console.log("fail to get User balance");
      }
      try {
        const { contract } = this.state;
        let gameStatus;
        const responseFlip = await contract.methods.getLastFlip(this.state.accounts[0]).call();
        console.log("reponse Flip" + responseFlip);
        // Update state with the result.
        if (responseFlip === true){
          gameStatus = "Win";
        }
        else {
          gameStatus = "Loose";
        }
        this.setState({ lastFlip: gameStatus});
      } catch (error){
          console.log("fail to get last flip");
      }
      this.setState({ updateBalance: false});
    }
  };

  sendMoney = async (id) => {
    const { accounts, contract } = this.state;
    console.log(id)
    console.log(this.props)
    console.log("send to user:" + this.state.sendFund);
    if (id === "player"){
      try{
        await contract.methods.sendMoneyToThePlayer().send({ from: accounts[0], value: parseInt(this.state.sendFund)});
        
      } catch(error){
        console.log("send money to player failed");
      }
      try {
        const response = await contract.methods.getUserBalance(this.state.accounts[0]).call();
        this.setState({ userFund: response});
      } catch (error){
        console.log("fail to get User balance");
      }
    } else if (id === "bank"){
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

    this.setState({updateBalance: true, sendFund: ""});
  };

  setAmount(e) {
    console.log(e.target);
    console.log(typeof(e.target.value));
    if (e.target.name === "valueToSendToBank" || e.target.name === "valueToSendToUser"){
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
        <input type="text" name="valueToSendToBank" defaultValue='0' onChange={ this.setAmount }/>
        <button type="button" onClick={this.sendMoney.bind(this, "bank")}>Send money to the bank</button>
        <input type="text" name="valueToSendToUser" defaultValue='0' onChange={ this.setAmount }/>
        <button type="button" onClick={this.sendMoney.bind(this, "player")}>Send money to the user</button>
        <input type="text" name="valueToBet" defaultValue="0" onChange={ this.setAmount }/>
        <button onClick={this.flip.bind(this)}>Flip</button>
        <p> You have {this.state.lastFlip}</p>
      </div>
    );
  }
}

export default App;
