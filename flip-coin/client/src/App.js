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
      sendBankFund: 0,
      sendUserFund: 0,
      amountToBet: 0,
      lastFlip: "not play yet",
    }
    this.setAmountToSendToTheBank = this.setAmountToSendToTheBank.bind(this);
    this.setAmountToSendToTheUser = this.setAmountToSendToTheUser.bind(this);
    this.setAmountToBet = this.setAmountToBet.bind(this);
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
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  componentDidUpdate = async () => {
    if (this.state.updateBalance === true) {
      try {
        const { contract } = this.state;

        // // Get the value from the contract to prove it worked.
        const response = await contract.methods.getBankBalance().call();
        console.log("reponse of you getBankBalance" + response);
        this.setState({ bankFund: response});
          
      } catch (error){
          console.log("fail to get Bank balance");
      }
      try {
        const { contract } = this.state;

        // // Get the value from the contract to prove it worked.
        const response = await contract.methods.getUserBalance(this.state.accounts[0]).call();

        this.setState({ userFund: response});
          
      } catch (error){
          console.log("fail to get User balance");
      }
      this.setState({ updateBalance: false});
    }
    if (this.state.updateLastFlip === true){
      try {
        const { contract } = this.state;
        
        let gameStatus = "";
        
        const responseFlip = await contract.methods.getLastFlip(this.state.accounts[0]).call();
        console.log("reponse Flip" + responseFlip);
        // Update state with the result.
        if (responseFlip === true){
          gameStatus = "Win";
        }
        else{
          gameStatus = "Loose";
        }
        this.setState({ lastFlip: gameStatus});
        
      } catch (error){
          console.log("fail to get last flip");
      }
      this.setState({ updateLastFlip: false});
    }

  };

  runExample = async () => {
    try {
      const { contract } = this.state;

      // Stores a given value, 5 by default.
      //await contract.methods.deposit().send({ from: accounts[0], value: 1000 });

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
    }
    this.setState({updateBalance: true, updateLastFlip: true});
  
  };

  sendMoney = async (id) => {
    const { accounts, contract } = this.state;
    console.log(id)
    console.log(this.props)
    console.log("send to user:" + this.state.sendUserFund);
    if (id === "player"){
      try{
        await contract.methods.sendMoneyToThePlayer().send({ from: accounts[0], value: parseInt(this.state.sendUserFund)});
        
      } catch(error){
        console.log("send money to player failed");
      }
      
    } else if (id === "bank"){
      try{
        await contract.methods.sendMoneyToTheBank().send({ from: accounts[0], value: parseInt(this.state.sendBankFund)});
      } catch(error){
        console.log("send money to bank failed");
      }
    }

    this.setState({updateBalance: true});
  };

  setAmountToSendToTheBank(e) {
    console.log(e.target.value);
    console.log(typeof(e.target.value));
    this.setState({ sendBankFund: e.target.value });
  };

  setAmountToSendToTheUser(e) {
    console.log("setAmountToSendToTheUser");
    console.log(e.target.value);
    console.log(typeof(e.target.value));
    this.setState({ sendUserFund: e.target.value });
  };

  setAmountToBet(e) {
    console.log(e.target.value);
    console.log(typeof(e.target.value));
    this.setState({ sendAmountToBet: e.target.value });
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
        <input type="text" name="valueToSendToBank" defaultValue='0' onChange={ this.setAmountToSendToTheBank }/>
        <button type="button" onClick={this.sendMoney.bind(this, "bank")}>Send money to the bank</button>
        <input type="text" name="valueToSendToUser" defaultValue='0' onChange={ this.setAmountToSendToTheUser }/>
        <button type="button" id="2" onClick={this.sendMoney.bind(this, "player")}>Send money to the user</button>
        <input type="text" name="valueToBet" defaultValue={this.state.amountToBet} onChange={ this.setAmountToBet }/>
        <button onClick={this.flip.bind(this)}>Flip</button>
        <p> You have {this.state.lastFlip}</p>
      </div>
    );
  }
}

export default App;
