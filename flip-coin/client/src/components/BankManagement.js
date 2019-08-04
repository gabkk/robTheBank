import React, { Component } from "react";

class BankManagement extends Component{
	constructor(props){
		super(props);
	    this.state = {
	    	displayWithraw: false,
	    	isBankOwner: false,
	    	sendFund: null,
	    	sendFundToNewBank: null,
	    }
	};

  updateBalances = async (currentBank, account, web3, contract) => {
    let userFund = 0;
    let bankFund = 0;
    try {
      bankFund = await contract.methods.getBankBalance(currentBank).call();
    } catch (error){
      console.log("BankManagement fail to get Bank balance: " + error);
    }
    try {
      userFund = await web3.eth.getBalance(account);
      userFund = web3.utils.fromWei(userFund) + " ETH";
    } catch (error){
      console.log("BankManagement fail to get User balance" + error);
    }
  	return {userFund: userFund, bankFund: bankFund}
  };

  sendMoney = async () => {
	const { accounts, contract, currentBank, web3 } = this.props;
    let ret;
    try{
      await contract.methods.sendMoneyToTheBank().send({from: accounts[0], value: parseInt(this.state.sendFund)});
    } catch(error){
      console.log("BankManagement sendMoney: send money to bank failed" + error);
    }
    try{
      ret = await this.updateBalances.bind(this, currentBank, accounts[0], web3, contract)();
    } catch (error){
      console.log("updateBalances failed:" + error);
    }
    this.props.updateFromComponent({displayWithraw: true, userFund: ret.userFund, bankFund: ret.bankFund});
  };

  withdraw = async () => {
    const { accounts, contract, currentBank, web3 } = this.props;
    console.log("widthraw currentBank");
    console.log(currentBank);
    let ret;
    try{
      await contract.methods.withdrawBankAccount().send({from: accounts[0]});
    } catch(error){
      console.log("BankManagement Failed to witdhraw from bank account" + error);
    }
    try{
      ret = await this.updateBalances.bind(this, currentBank, accounts[0], web3, contract)();
    } catch (error){
      console.log("updateBalances failed:" + error);
    }
    this.props.updateFromComponent({displayWithraw: false, userFund: ret.userFund, bankFund: ret.bankFund});
  };

  createNewBank = async(value) => {
    const { accounts, contract } = this.state;
    let listOfBank;
    let bankFund;
    try{
      await contract.methods.createBank("Default").send({from: accounts[0], value: parseInt(this.state.sendFundToNewBank)});
    } catch(error){
      console.log("BankManagement Failed to create new bank account" + error);
    }
    try {
      bankFund = await contract.methods.getBankBalance(this.state.currentBank).call();
    } catch (error){
      console.log("BankManagement createNewBank fail to get Bank balance");
    }
    try {
      listOfBank = await contract.methods.getListOfBank().call();
    } catch (error){
      console.log("BankManagement createNewBank list of bank empty");
    }
    this.props.updateFromComponent({displayWithraw: true, listOfBank: listOfBank, bankFund: bankFund});
  }

  setAmount = e => {
    if (e.target.name === "valueToSendToBank"){
      this.setState({ sendFund: e.target.value });
      console.log("value to bank" + e.target.value);
    } else if (e.target.name === "valueToCreateBank"){
      this.setState({ sendFundToNewBank: e.target.value });
    }
  };

  render(){
    return(
      <div>
        {this.props.displayWithraw &&
          <button type="button" onClick={this.withdraw.bind(this)}> Withraw</button>
        }
        {this.props.isBankOwner ? (
          <div>
            <input type="text" name="valueToSendToBank" defaultValue='0' onChange={ this.setAmount }/>
            <button type="button" onClick={this.sendMoney.bind(this)}>Send money to the bank</button>
          </div>
          ) : (
          <div>
            <input type="text" name="valueToCreateBank" defaultValue='0' onChange={ this.setAmount }/>
            <button type="button" onClick={this.createNewBank.bind(this)}> create new bank</button>
          </div>
          )
        }
      </div>
    )};
};

export default BankManagement;