import React, { Component } from "react";
import ReactLoading from 'react-loading';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';

class BankManagement extends Component{
    constructor(props){
        super(props);
        this.state = {
            displayWithraw: this.props.displayWithraw,
            isBankOwner: false,
            sendFund: 0,
            sendFundToNewBank: 0,
            nameToCreateBank: null,
            loadingSend: false,
            loadingWithraw: false,
            myBankFund: this.props.myBankFund,
            myBankName: this.props.myBankName,
            listOfBankObj: this.props.listOfBankObj,
            toggleActive: false
        }
        this.onToggle = this.onToggle.bind(this);
    };

  componentDidMount = async () => {
    if (this.props.contract){
      try{
          let isBankOwner = await this.props.contract.methods.isBankOwner(this.props.accounts[0]).call();
          if (isBankOwner){
            this.setState({displayWithraw: true});
        }
      } catch(error){
        console.log("failed to get isBankOwner accounts[0] : " + error);
      }
    }

    // Loop To catch user wallet changes
    if(this.props.accounts){
      this.timer = this.launchTimer();
    }
  };

  onToggle = () => {
    this.setState({ toggleActive: !this.state.toggleActive });
  }

  // stopTimer = () => {
  //   console.log("stoooop");
  //   clearInterval(this.timer);
  // };

  launchTimer= () => {
    this.timer = setInterval(async () => {
        if (this.props.contract){
          try{
            let myBankObj = await this.props.contract.methods.getBankInfos(this.props.accounts[0]).call();
            //console.log("Inside UPDATE INTERFACE");
            //console.log(myBankObj);
            this.setState({ myBankName: myBankObj[0],
                            myBankFund: myBankObj[1],
                            isBankOwner: myBankObj[2]});
          } catch(error){
            console.log("failed to getBankInfos of accounts[0] : " + error);
          }
        }
      }, 1000);
  }

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
    if (this.state.sendFund === 0){
      return;
    } else {
      this.setState({loadingSend: true});
    }
    let valueInWei = web3.utils.toWei(this.state.sendFund, "ether")
    try{
      await contract.methods.sendMoneyToTheBank().send({from: accounts[0], value: valueInWei});
    } catch(error){
      console.log("BankManagement sendMoney: send money to bank failed" + error);
    }
    /* The user is only able to send money to his own bank */
    try{
      ret = await this.updateBalances.bind(this, accounts[0], accounts[0], web3, contract)();
    } catch (error){
      console.log("updateBalances failed:" + error);
    }
    if (currentBank === accounts[0]){
        this.props.updateFromComponent({displayWithraw: true,
                                        userFund: ret.userFund,
                                        myBankFund: ret.bankFund,
                                        selectedBankFund: ret.bankFund});
    } else {
        this.props.updateFromComponent({displayWithraw: true,
                                        userFund: ret.userFund,
                                        myBankFund: ret.bankFund});
    }
    this.setState({loadingSend: false});
  };

  withdraw = async () => {
    const { accounts, contract, currentBank, web3 } = this.props;
    let ret;
    let bankFund;
    this.setState({loadingWithraw: true});
    try{
      await contract.methods.withdrawBankAccount().send({from: accounts[0]});
      try{
        ret = await this.updateBalances.bind(this, currentBank, accounts[0], web3, contract)();
      } catch (error){
        console.log("updateBalances failed:" + error);
      }
      try {
          bankFund = await contract.methods.getBankBalance(this.state.currentBank).call();
      } catch (error){
          console.log("BankManagement createNewBank fail to get Bank balance");
      }
      this.props.updateFromComponent({displayWithraw: false,
                                      bankFund: bankFund,
                                      userFund: ret.userFund,
                                      myBankFund: 0});
    } catch(error){
      console.log("BankManagement Failed to witdhraw from bank account" + error);
    }
    this.setState({loadingWithraw: false});
  };

  createNewBank = async(value) => {
    const { accounts, contract, web3 } = this.props;
    let listOfBank;
    let bankFund;
    if (isNaN(this.state.sendFundToNewBank)|| this.state.sendFundToNewBank === 0){
      return;
    } else {
      this.setState({loadingSend: true});
    }
    let valueInWei = web3.utils.toWei(this.state.sendFundToNewBank, "ether")
    try{
      console.log("Before create Bank");
      console.log(this.state.toggleActive);
      console.log(typeof(this.state.toggleActive));
      console.log(this.state.nameToCreateBank);
      console.log(typeof(this.state.nameToCreateBank));
      console.log(this.state.sendFundToNewBank);
      console.log(accounts[0]);
      console.log(valueInWei);

      await contract.methods.createBank(this.state.nameToCreateBank, this.state.toggleActive).send({from: accounts[0], value: valueInWei});
      /*Bank creation successful to we display the withdraw button*/

      this.setState({displayWithraw: true});
      try {
        bankFund = await contract.methods.getBankBalance(accounts[0]).call();
      } catch (error){
        console.log("BankManagement createNewBank fail to get Bank balance");
      }

      try {
        listOfBank = await contract.methods.getListOfBank().call();
      } catch (error){
        console.log("BankManagement createNewBank list of bank empty");
      }
      // WIP Retreive all the bank event to get name and Balance
      try {
        await contract.methods.getListOfBankObj().call();
        try {
          //TODO Improve this !!!!!!!!
          await contract.getPastEvents(['LogListOfBank'], {fromBlock: 'latest', toBlock: 'latest'},
            async (err, events) => {
              this.setState(state => {
                var obj={};
                obj.name = events[events.length-1].returnValues.name;
                obj.address = events[events.length-1].returnValues.addr;
                obj.balance = events[events.length-1].returnValues.balance;
                obj.isOracle = events[events.length-1].returnValues.usingOracle;
                const listOfBankObj = state.listOfBankObj.concat({obj});
                return {
                  listOfBankObj
                };
              });
            }
          )
        } catch (error){
          console.log("No past event in getListOfBank");
        }
      } catch (error){
        console.log("Get list of bank OBJ failed");
      }
      this.props.updateFromComponent({displayWithraw: true,
                                      listOfBank: listOfBank,
                                      bankFund: bankFund,
                                      myBankName: this.state.nameToCreateBank,
                                      myBankFund: this.state.sendFundToNewBank,
                                      isBankOwner: true,
                                      listOfBankObj: this.state.listOfBankObj});
    } catch(error){
      console.log("BankManagement Failed to create new bank account" + error);
    }
    this.setState({loadingSend: false});
  }

  setAmount = e => {
    if (e.target.name === "valueToSendToBank"){
      this.setState({ sendFund: e.target.value });
    } else if (e.target.name === "valueToCreateBank"){
      this.setState({ sendFundToNewBank: e.target.value });
    }
    if (e.target.name === "nameToCreateBank"){
      this.setState({ nameToCreateBank: e.target.value });
    }
  };

  render(){
    return(
      <div className="ManagementContainer">
        {this.props.isBankOwner ? (
            <InputGroup>
              <p className="BankManagementMenu">My Bank</p>
              {this.state.loadingWithraw &&
                <ReactLoading type={"cubes"} color={"white"} height={50} width={50} />
              }
              {(this.props.displayWithraw || this.state.displayWithraw ) &&
              <Button type="button" className="success" onClick={this.withdraw.bind(this)} variant="success">Withdraw</Button>
              }
              <div className="ManagementBankInfo">
                <p>Bank {this.state.myBankName}</p>
                <p> funds {this.props.web3.utils.fromWei(this.state.myBankFund, "ether")} Eth</p>
              </div>            
              <FormControl
                placeholder="0"
                aria-label="0"
                aria-describedby="basic-addon2"
                type="text"
                name="valueToSendToBank"
                onChange={ this.setAmount }
              />
              <InputGroup.Append>
                <Button type="button" variant="outline-secondary" onClick={this.sendMoney.bind(this)}>
                  Send money to the bank
                </Button>
              </InputGroup.Append>
              {this.state.loadingSend &&
                <ReactLoading type={"bubbles"} color={"white"} height={50} width={50} />
              }
            </InputGroup>
          ) : (
          <div>
            <InputGroup >
              <p className="BankManagementCreate">Create your own bank now -></p>
              <p>Value</p>
              <FormControl
                placeholder="0"
                aria-label="0"
                aria-describedby="basic-addon2"
                type="text"
                name="valueToCreateBank"
                onChange={ this.setAmount }
              />
              <p>bank name</p>
              <FormControl
                placeholder="default"
                aria-label="default"
                aria-describedby="basic-addon2"
                type="text"
                name="nameToCreateBank"
                maxLength="20"
                onChange={ this.setAmount }
              />
              <div className='custom-control custom-switch'>
                <input
                  type='checkbox'
                  className='custom-control-input'
                  id='customSwitchesChecked'
                  onClick={this.onToggle.bind(this)}
                />
                <label className='custom-control-label' htmlFor='customSwitchesChecked'>
                  Is using oracle
                </label>
              </div>
              <InputGroup.Append>
                <Button type="button" className="NewBankButton" onClick={this.createNewBank.bind(this)} variant="outline-secondary">
                  create new bank
                </Button>
              </InputGroup.Append>
              {this.state.loadingSend &&
                <ReactLoading type={"bubbles"} color={"white"} height={50} width={50} />
              }
            </InputGroup>
          </div>
          )
        }
      </div>
    )};
};

export default BankManagement;