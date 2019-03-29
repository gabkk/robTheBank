import React, { Component } from "react";
import CoinFlip from "./contracts/CoinFlip.json";
import getWeb3 from "./utils/getWeb3";

import "./App.css";

class App extends Component {

  state = { update_balance: false, storageValue: 0, web3: null, accounts: null, contract: null };

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
        deployedNetwork && deployedNetwork.address,
      );
      const initialAmount = await instance.methods.getBalance().call();
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance, storageValue: initialAmount}
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
    if (this.state.update_balance === true) {
      try {
        const { contract } = this.state;

        // // Get the value from the contract to prove it worked.
        const response = await contract.methods.getBalance().call();
        // Update state with the result.
          this.setState({ storageValue: response });
        
          
      } catch (error){
          console.log("fail to get balance");
      }
      this.setState({ update_balance: false});
    }
  }

  runExample = async () => {
    try {
      const { accounts, contract } = this.state;

      // Stores a given value, 5 by default.
      await contract.methods.deposit().send({ from: accounts[0], value: 1000 });

      // // Get the value from the contract to prove it worked.
      const response = await contract.methods.getBalance().call();
      // Update state with the result.
      this.setState({ storageValue: response });
      
    } catch (error){
        console.log("fail to get balance");
    }
  };

  flip = async () => {
    const { accounts, contract } = this.state;
    
    await contract.methods.flip().send({ from: accounts[0], value: 1000 });

    this.setState({update_balance: true});
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Coin Flip v0!</h1>
        <h2>Try to flip a coin</h2>
        <div>Balance de votre compte: {this.state.storageValue}</div>
        <button onClick={this.flip.bind(this)}>Flip</button> 
      </div>
    );
  }
}

export default App;
